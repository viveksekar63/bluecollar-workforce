import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendedJobs(userId: string, city?: string, limit = 20) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: {
        id: true,
        professionCategory: true,
        profession: true,
        experienceYears: true,
        skills: {
          select: { skill: { select: { name: true } } },
        },
        addresses: {
          where: { isCurrent: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { city: true, district: true, state: true },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    const workerProfession = worker.profession?.trim().toLowerCase() ?? '';
    const workerCategory = worker.professionCategory?.trim().toLowerCase() ?? '';
    const workerSkills = worker.skills.map((item) => item.skill.name.trim().toLowerCase());
    const workerCity =
      city?.trim().toLowerCase() ||
      worker.addresses[0]?.city?.trim().toLowerCase() ||
      '';

    const jobs = await this.prisma.job.findMany({
      where: {
        status: { not: 'DRAFT' as any },
        openings: { gt: 0 },
        ...(workerCity
          ? { city: { contains: workerCity, mode: 'insensitive' } }
          : {}),
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        district: true,
        state: true,
        pincode: true,
        salaryMin: true,
        salaryMax: true,
        salaryType: true,
        openings: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        employer: {
          select: { id: true, companyName: true, status: true },
        },
        skills: {
          select: {
            required: true,
            skill: { select: { name: true } },
          },
        },
        applications: {
          where: { workerId: worker.id },
          take: 1,
          select: { status: true },
        },
      },
    });

    const ranked = jobs
      .map((job) => {
        const title = job.title.toLowerCase();
        const requiredSkills = job.skills.map((item) => item.skill.name.trim().toLowerCase());
        const matchedSkills = requiredSkills.filter((skill) =>
          workerSkills.some(
            (workerSkill) =>
              workerSkill === skill ||
              workerSkill.includes(skill) ||
              skill.includes(workerSkill),
          ),
        ).length;
        const professionMatch = !!workerProfession && title.includes(workerProfession);
        const categoryMatch = !!workerCategory && title.includes(workerCategory);
        const locationMatch = !!workerCity && job.city.toLowerCase() === workerCity;
        const score =
          (professionMatch ? 50 : 0) +
          (categoryMatch ? 20 : 0) +
          matchedSkills * 15 +
          (locationMatch ? 10 : 0);

        return {
          ...job,
          matchScore: Math.min(score, 100),
          matchedSkills,
          applied: job.applications.length > 0,
          applicationStatus: job.applications[0]?.status ?? null,
        };
      })
      .sort((a, b) =>
        b.matchScore !== a.matchScore
          ? b.matchScore - a.matchScore
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, Math.max(1, Math.min(limit, 50)));

    return {
      items: ranked,
      total: ranked.length,
      location: workerCity || null,
    };
  }

  async findOneForWorker(userId: string, jobId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        district: true,
        state: true,
        pincode: true,
        latitude: true,
        longitude: true,
        salaryMin: true,
        salaryMax: true,
        salaryType: true,
        openings: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
          select: {
            required: true,
            skill: { select: { id: true, name: true, category: true } },
          },
        },
        applications: {
          where: { workerId: worker.id },
          take: 1,
          select: { id: true, status: true, appliedAt: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      ...job,
      applied: job.applications.length > 0,
      application: job.applications[0] ?? null,
    };
  }

  async applyForJob(userId: string, jobId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, openings: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (String(job.status) === 'DRAFT') {
      throw new BadRequestException('This job is not open for applications');
    }

    if (job.openings <= 0) {
      throw new BadRequestException('No openings are available for this job');
    }

    const existing = await this.prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: worker.id,
        },
      },
      select: { id: true, status: true, appliedAt: true },
    });

    if (existing) {
      return {
        alreadyApplied: true,
        application: existing,
      };
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        workerId: worker.id,
      },
      select: {
        id: true,
        jobId: true,
        workerId: true,
        status: true,
        appliedAt: true,
      },
    });

    return {
      alreadyApplied: false,
      application,
    };
  }
}
