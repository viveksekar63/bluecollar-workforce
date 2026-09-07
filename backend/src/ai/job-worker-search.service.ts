import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindWorkersByJobDto } from './dto/find-workers-by-job.dto';
import { AiJobRequirementPersistenceService } from './ai-job-requirement-persistence.service';
import { WorkerSearchService } from './worker-search.service';

@Injectable()
export class JobWorkerSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiRequirements: AiJobRequirementPersistenceService,
    private readonly workerSearchService: WorkerSearchService,
  ) {}

  async findWorkers(userId: string, jobId: string, dto: FindWorkersByJobDto) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') throw new ForbiddenException('Employer account is not verified');

    const job = await this.prisma.job.findFirst({ where: { id: jobId, employerId: employer.id }, include: { skills: { include: { skill: true } } } });
    if (!job) throw new NotFoundException('Job not found');

    const persisted = await this.aiRequirements.getRequirements(job.id);
    if (!persisted) throw new NotFoundException('AI requirements not found for this job');

    const location = job.city
      ? { id: '', type: 'CITY' as const, name: job.city, parentId: null, parentName: null, districtName: job.district ?? null, stateName: job.state, pincode: job.pincode ?? null }
      : job.district
        ? { id: '', type: 'DISTRICT' as const, name: job.district, parentId: null, parentName: null, districtName: job.district, stateName: job.state, pincode: job.pincode ?? null }
        : job.state
          ? { id: '', type: 'STATE' as const, name: job.state, parentId: null, parentName: null, districtName: job.district ?? null, stateName: job.state, pincode: job.pincode ?? null }
          : null;

    const normalizedRequirement = {
      workerCount: job.openings ?? 1,
      profession: persisted.profession ? { id: '', name: persisted.profession, categoryId: '', categoryName: persisted.professionCategory ?? '' } : null,
      professionCategory: persisted.professionCategory ? { id: '', name: persisted.professionCategory } : null,
      location,
      minimumExperienceYears: persisted.minimumExperienceYears,
      minimumSkillLevel: persisted.minimumSkillLevel,
      skills: job.skills.map((item) => ({ id: item.skill.id, name: item.skill.name })),
      languages: persisted.languages,
      availability: persisted.availability,
      mobility: persisted.mobility,
      willingToRelocate: persisted.willingToRelocate,
      willingToTravel: persisted.willingToTravel,
      accommodationAvailable: persisted.accommodationAvailable,
    };

    const ranked = await this.workerSearchService.searchNormalizedRequirement(
      normalizedRequirement,
      `Job ${job.id}: ${job.title}`,
      { latitude: dto.latitude, longitude: dto.longitude, radiusKm: dto.radiusKm },
      { page: dto.page, limit: dto.limit },
    );

    return {
      job: { id: job.id, title: job.title, status: job.status, city: job.city, district: job.district, state: job.state, openings: job.openings },
      aiRequirements: persisted,
      ...ranked,
    };
  }

  async recommendedForContact(userId: string, jobId: string, limit = 10) {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const result = await this.findWorkers(userId, jobId, { page: 1, limit: safeLimit });
    const employer = await this.prisma.employer.findUnique({ where: { userId }, select: { id: true } });
    if (!employer) throw new NotFoundException('Employer profile not found');

    const items = result.results?.items ?? [];
    if (!items.length) {
      return { success: true, mode: 'AI_CONTACT_RECOMMENDATIONS', job: result.job, recommendations: [], summary: { candidatesEvaluated: 0, recommended: 0, shortlisted: 0 } };
    }

    const workerIds = items.map((item: any) => item.id).filter(Boolean);
    const actionRows = await this.prisma.$queryRaw<Array<{ workerId: string; actionType: string }>>(Prisma.sql`
      SELECT "worker_id" AS "workerId", "action_type" AS "actionType"
      FROM "job_worker_actions"
      WHERE "employer_id" = ${employer.id} AND "job_id" = ${jobId}
        AND "worker_id" IN (${Prisma.join(workerIds)})
        AND "action_type" = 'SHORTLISTED'
    `);
    const shortlisted = new Set(actionRows.map((row) => row.workerId));

    const recommendations = items.map((worker: any, index: number) => {
      const matchScore = Number(worker.matchScore ?? 0);
      const action = matchScore >= 90 ? 'CONTACT_NOW' : matchScore >= 75 ? 'HIGH_PRIORITY' : 'REVIEW';
      return {
        workerId: worker.id,
        workerCode: worker.workerCode,
        name: `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim() || worker.workerCode,
        profession: worker.profession,
        professionCategory: worker.professionCategory,
        experienceYears: worker.experienceYears,
        profileImageUrl: worker.profileImageUrl ?? null,
        verificationStatus: worker.verificationStatus,
        verificationScore: worker.verificationScore,
        matchScore,
        matchTier: worker.matchTier,
        matchReasons: worker.matchReasons ?? [],
        matchBreakdown: worker.matchBreakdown ?? null,
        preferenceScore: worker.preferenceScore ?? 0,
        languageScore: worker.languageScore ?? 100,
        isShortlisted: shortlisted.has(worker.id),
        recommendationRank: index + 1,
        recommendationAction: action,
        contactLocked: true,
        contactUnlockRequired: true,
      };
    });

    return {
      success: true,
      mode: 'AI_CONTACT_RECOMMENDATIONS',
      job: result.job,
      recommendations,
      summary: {
        candidatesEvaluated: items.length,
        recommended: recommendations.length,
        shortlisted: recommendations.filter((item) => item.isShortlisted).length,
        contactLocked: recommendations.length,
      },
    };
  }
}
