import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    if (String(employer.status) !== 'VERIFIED') {
      throw new ForbiddenException('Employer account is not verified');
    }

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId: employer.id },
      include: {
        skills: { include: { skill: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const persisted = await this.aiRequirements.getRequirements(job.id);
    if (!persisted) {
      throw new NotFoundException('AI requirements not found for this job');
    }

    const location = job.city
      ? {
          id: '',
          type: 'CITY' as const,
          name: job.city,
          parentId: null,
          parentName: null,
          districtName: job.district ?? null,
          stateName: job.state,
          pincode: job.pincode ?? null,
        }
      : job.district
        ? {
            id: '',
            type: 'DISTRICT' as const,
            name: job.district,
            parentId: null,
            parentName: null,
            districtName: job.district,
            stateName: job.state,
            pincode: job.pincode ?? null,
          }
        : job.state
          ? {
              id: '',
              type: 'STATE' as const,
              name: job.state,
              parentId: null,
              parentName: null,
              districtName: job.district ?? null,
              stateName: job.state,
              pincode: job.pincode ?? null,
            }
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
      {
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusKm: dto.radiusKm,
      },
      {
        page: dto.page,
        limit: dto.limit,
      },
    );

    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        city: job.city,
        district: job.district,
        state: job.state,
        openings: job.openings,
      },
      aiRequirements: persisted,
      ...ranked,
    };
  }
}
