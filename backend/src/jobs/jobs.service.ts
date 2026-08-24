import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployer(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true, companyName: true },
    });
    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') {
      throw new BadRequestException('Employer account is not verified');
    }
    return employer;
  }

  async getEmployerJobs(userId: string) {
    const employer = await this.getEmployer(userId);
    return this.prisma.job.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        skills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
    });
  }

  async createEmployerJob(userId: string, dto: any) {
    const employer = await this.getEmployer(userId);
    const skillNames: string[] = [...new Set<string>(
      (dto.skillNames ?? [])
        .map((x: unknown) => String(x).trim())
        .filter(Boolean),
    )];

    if (!dto.title?.trim() || !dto.description?.trim() || !dto.city?.trim() || !dto.state?.trim()) {
      throw new BadRequestException('Title, description, city and state are required');
    }

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          employerId: employer.id,
          title: dto.title.trim(),
          description: dto.description.trim(),
          city: dto.city.trim(),
          district: dto.district?.trim() || undefined,
          state: dto.state.trim(),
          pincode: dto.pincode?.trim() || undefined,
          salaryMin: dto.salaryMin ?? undefined,
          salaryMax: dto.salaryMax ?? undefined,
          salaryType: dto.salaryType,
          openings: dto.openings ?? 1,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: 'DRAFT' as any,
        },
      });

      for (const name of skillNames) {
        const skill = await tx.skill.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        await tx.jobSkill.create({
          data: { jobId: job.id, skillId: skill.id, required: true },
        });
      }

      return tx.job.findUnique({
        where: { id: job.id },
        include: { skills: { include: { skill: true } } },
      });
    });
  }

  async updateEmployerJob(userId: string, jobId: string, dto: any) {
    const employer = await this.getEmployer(userId);
    const job = await this.prisma.job.findFirst({ where: { id: jobId, employerId: employer.id } });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) !== 'DRAFT') throw new BadRequestException('Only draft jobs can be edited');

    const skillNames: string[] | null = dto.skillNames
      ? [...new Set<string>(
          dto.skillNames
            .map((x: unknown) => String(x).trim())
            .filter(Boolean),
        )]
      : null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
          ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
          ...(dto.district !== undefined ? { district: dto.district?.trim() || null } : {}),
          ...(dto.state !== undefined ? { state: dto.state.trim() } : {}),
          ...(dto.pincode !== undefined ? { pincode: dto.pincode?.trim() || null } : {}),
          ...(dto.salaryMin !== undefined ? { salaryMin: dto.salaryMin } : {}),
          ...(dto.salaryMax !== undefined ? { salaryMax: dto.salaryMax } : {}),
          ...(dto.salaryType !== undefined ? { salaryType: dto.salaryType } : {}),
          ...(dto.openings !== undefined ? { openings: dto.openings } : {}),
          ...(dto.startDate !== undefined ? { startDate: dto.startDate ? new Date(dto.startDate) : null } : {}),
          ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        },
      });

      if (skillNames) {
        await tx.jobSkill.deleteMany({ where: { jobId } });
        for (const name of skillNames) {
          const skill = await tx.skill.upsert({ where: { name }, update: {}, create: { name } });
          await tx.jobSkill.create({ data: { jobId, skillId: skill.id, required: true } });
        }
      }

      return updated;
    });
  }

  async publishEmployerJob(userId: string, jobId: string) {
    const employer = await this.getEmployer(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId: employer.id },
      include: { skills: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) !== 'DRAFT') throw new BadRequestException('Job is already published or closed');
    if (!job.title || !job.description || !job.city || !job.state) throw new BadRequestException('Complete the job details before publishing');
    if (job.skills.length === 0) throw new BadRequestException('Add at least one required skill before publishing');

    return this.prisma.job.update({ where: { id: jobId }, data: { status: 'PUBLISHED' as any } });
  }

  async getEmployerApplications(userId: string, jobId: string) {
    const employer = await this.getEmployer(userId);
    const job = await this.prisma.job.findFirst({ where: { id: jobId, employerId: employer.id }, select: { id: true } });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { appliedAt: 'desc' },
      include: {
        worker: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, profilePhotoUrl: true } },
            skills: { include: { skill: true } },
            addresses: { where: { isCurrent: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });
  }

  async getAllEmployerApplications(userId: string) {
    const employer = await this.getEmployer(userId);

    return this.prisma.jobApplication.findMany({
      where: { job: { employerId: employer.id } },
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            district: true,
            state: true,
            openings: true,
            status: true,
          },
        },
        worker: {
          select: {
            id: true,
            workerCode: true,
            experienceYears: true,
            professionCategory: true,
            profession: true,
            verificationStatus: true,
            verificationScore: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                profilePhotoUrl: true,
              },
            },
            skills: {
              include: { skill: true },
              orderBy: { skillLevel: 'desc' },
            },
            addresses: {
              where: { isCurrent: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  async updateApplicationStatus(userId: string, applicationId: string, status: 'SHORTLISTED' | 'REJECTED') {
    const employer = await this.getEmployer(userId);
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, job: { employerId: employer.id } },
      select: { id: true, status: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    if (String(application.status) === status) {
      return this.prisma.jobApplication.findUnique({ where: { id: applicationId } });
    }

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: status as any,
        shortlistedAt: status === 'SHORTLISTED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
      },
    });
  }

  async getRecommendedJobs(userId: string, city?: string, limit = 20) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        addresses: { where: { isCurrent: true }, take: 1 },
      },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const workerSkillIds = new Set(worker.skills.map((item) => item.skillId));
    const requestedCity = city?.trim();
    const workerCity = worker.addresses[0]?.city?.trim();

    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'PUBLISHED' as any,
        ...(requestedCity ? { city: requestedCity } : {}),
      },
      take: Math.min(limit, 50),
      orderBy: { createdAt: 'desc' },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            companyType: true,
            description: true,
            status: true,
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    const applications = jobs.length
      ? await this.prisma.jobApplication.findMany({
          where: {
            workerId: worker.id,
            jobId: { in: jobs.map((job) => job.id) },
          },
          select: {
            id: true,
            jobId: true,
            status: true,
            appliedAt: true,
          },
        })
      : [];

    const applicationByJobId = new Map(
      applications.map((application) => [application.jobId, application]),
    );

    const items = jobs
      .map((job) => {
        const matchedSkills = job.skills.filter((item) => workerSkillIds.has(item.skillId)).length;
        const matchScore = job.skills.length > 0
          ? Math.round((matchedSkills / job.skills.length) * 100)
          : 0;
        const application = applicationByJobId.get(job.id);

        return {
          ...job,
          matchScore,
          matchedSkills,
          applied: Boolean(application),
          applicationStatus: application ? String(application.status) : null,
          application: application
            ? {
                id: application.id,
                status: String(application.status),
                appliedAt: application.appliedAt,
              }
            : null,
        };
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return {
      items,
      total: items.length,
      location: requestedCity || workerCity || null,
    };
  }

  async findOneForWorker(userId: string, jobId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            companyType: true,
            description: true,
            status: true,
          },
        },
        skills: { include: { skill: true } },
        applications: {
          where: { workerId: worker.id },
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
          take: 1,
        },
      },
    });

    if (!job) throw new NotFoundException('Job not found');

    const application = job.applications[0] ?? null;
    const { applications: _applications, ...jobData } = job;

    return {
      ...jobData,
      applied: Boolean(application),
      applicationStatus: application ? String(application.status) : null,
      application: application
        ? {
            id: application.id,
            status: String(application.status),
            appliedAt: application.appliedAt,
          }
        : null,
    };
  }

  async applyForJob(userId: string, jobId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId }, select: { id: true } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, openings: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) !== 'PUBLISHED') throw new BadRequestException('Job is not open');

    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: { jobId_workerId: { jobId, workerId: worker.id } },
    });

    if (existingApplication) {
      return {
        alreadyApplied: true,
        application: {
          id: existingApplication.id,
          jobId: existingApplication.jobId,
          workerId: existingApplication.workerId,
          status: String(existingApplication.status),
          appliedAt: existingApplication.appliedAt,
        },
      };
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        workerId: worker.id,
        status: 'APPLIED' as any,
      },
    });

    return {
      alreadyApplied: false,
      application: {
        id: application.id,
        jobId: application.jobId,
        workerId: application.workerId,
        status: String(application.status),
        appliedAt: application.appliedAt,
      },
    };
  }
}
