import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobRequirementService } from './job-requirement.service';

@Injectable()
export class AiJobRequirementPersistenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobRequirementService: JobRequirementService,
  ) {}

  async createDraft(userId: string, dto: {
    query: string;
    title?: string;
    description?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') {
      throw new BadRequestException('Employer account is not verified');
    }

    const parsed = await this.jobRequirementService.parse(dto.query);
    if (parsed.status !== 'READY' || !parsed.suggestedJob || !parsed.normalizedRequirement) {
      return { parsed, job: null };
    }

    const suggestedJob = parsed.suggestedJob;
    const normalized = parsed.normalizedRequirement;

    if (dto.salaryMin !== undefined && dto.salaryMax !== undefined && dto.salaryMin > dto.salaryMax) {
      throw new BadRequestException('salaryMin cannot be greater than salaryMax');
    }

    const job = await this.prisma.$transaction(async (tx) => {
      const created = await tx.job.create({
        data: {
          employerId: employer.id,
          title: dto.title?.trim() || suggestedJob.title,
          description: dto.description?.trim() || suggestedJob.description,
          city: suggestedJob.city,
          district: suggestedJob.district || undefined,
          state: suggestedJob.state,
          pincode: suggestedJob.pincode || undefined,
          salaryMin: dto.salaryMin ?? undefined,
          salaryMax: dto.salaryMax ?? undefined,
          salaryType: dto.salaryType as any,
          openings: suggestedJob.openings,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: 'DRAFT' as any,
        },
      });

      for (const skill of normalized.skills) {
        await tx.jobSkill.create({
          data: {
            jobId: created.id,
            skillId: skill.id,
            required: true,
          },
        });
      }

      await tx.$executeRaw`
        INSERT INTO "job_ai_requirements"
          ("jobId", "minimumExperienceYears", "minimumSkillLevel", "availability", "mobility", "willingToRelocate", "willingToTravel", "accommodationAvailable")
        VALUES
          (${created.id}::uuid, ${normalized.minimumExperienceYears}, ${normalized.minimumSkillLevel}, ${normalized.availability}, ${normalized.mobility}, ${normalized.willingToRelocate}, ${normalized.willingToTravel}, ${normalized.accommodationAvailable})
      `;

      for (const language of normalized.languages) {
        await tx.$executeRaw`
          INSERT INTO "job_ai_requirement_languages" ("jobId", "languageId")
          VALUES (${created.id}::uuid, ${language.id}::uuid)
        `;
      }

      return tx.job.findUnique({
        where: { id: created.id },
        include: { skills: { include: { skill: true } } },
      });
    });

    if (!job) throw new NotFoundException('Created job not found');

    const requirements = await this.prisma.$queryRaw<Array<{
      minimumExperienceYears: unknown;
      minimumSkillLevel: string | null;
      availability: string | null;
      mobility: string | null;
      willingToRelocate: boolean | null;
      willingToTravel: boolean | null;
      accommodationAvailable: boolean;
    }>>`
      SELECT "minimumExperienceYears", "minimumSkillLevel", "availability", "mobility",
             "willingToRelocate", "willingToTravel", "accommodationAvailable"
      FROM "job_ai_requirements"
      WHERE "jobId" = ${job.id}::uuid
    `;

    const languages = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT l."id", l."name"
      FROM "job_ai_requirement_languages" jl
      JOIN "Language" l ON l."id" = jl."languageId"
      WHERE jl."jobId" = ${job.id}::uuid
      ORDER BY l."name"
    `;

    return {
      parsed,
      job,
      aiRequirements: {
        ...(requirements[0] ?? {}),
        minimumExperienceYears: requirements[0]?.minimumExperienceYears == null
          ? null
          : Number(requirements[0].minimumExperienceYears),
        languages,
      },
    };
  }
}
