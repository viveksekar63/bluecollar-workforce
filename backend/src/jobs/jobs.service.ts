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
    if (String(employer.status) !== 'ACTIVE') {
      throw new BadRequestException('Employer account is not active');
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
    const skillNames = [...new Set((dto.skillNames ?? []).map((x: string) => x.trim()).filter(Boolean))];

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

    const skillNames = dto.skillNames
      ? [...new Set(dto.skillNames.map((x: string) => x.trim()).filter(Boolean))]
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

    return this.prisma.job.update({ where: { id: jobId }, data: { status: 'OPEN' as any } });
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

  async updateApplicationStatus(userId: string, applicationId: string, status: 'SHORTLISTED' | 'REJECTED') {
    const employer = await this.getEmployer(userId);
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, job: { employerId: employer.id } },
      select: { id: true, status: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: status === 'SHORTLISTED'
        ? { status: status as any, shortlistedAt: new Date() }
        : { status: status as any, rejectedAt: new Date() },
    });
  }

  async getRecommendedJobs(userId: string, city?: string, limit = 20) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: {
        id: true, professionCategory: true, profession: true, experienceYears: true,
        skills: { select: { skill: { select: { name: true } } } },
        addresses: { where: { isCurrent: true }, orderBy: { createdAt: 'desc' }, take: 1, select: { city: true, district: true, state: true } },
      },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const workerProfession = worker.profession?.trim().toLowerCase() ?? '';
    const workerCategory = worker.professionCategory?.trim().toLowerCase() ?? '';
    const workerSkills = worker.skills.map((item) => item.skill.name.trim().toLowerCase());
    const workerCity = city?.trim().toLowerCase() || worker.addresses[0]?.city?.trim().toLowerCase() || '';

    const jobs = await this.prisma.job.findMany({
      where: { status: { not: 'DRAFT' as any }, openings: { gt: 0 }, ...(workerCity ? { city: { contains: workerCity, mode: 'insensitive' } } : {}) },
      take: 100, orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, description: true, city: true, district: true, state: true, pincode: true,
        salaryMin: true, salaryMax: true, salaryType: true, openings: true, startDate: true, endDate: true, status: true, createdAt: true,
        employer: { select: { id: true, companyName: true, status: true } },
        skills: { select: { required: true, skill: { select: { name: true } } } },
        applications: { where: { workerId: worker.id }, take: 1, select: { status: true } },
      },
    });

    const ranked = jobs.map((job) => {
      const title = job.title.toLowerCase();
      const requiredSkills = job.skills.map((item) => item.skill.name.trim().toLowerCase());
      const matchedSkills = requiredSkills.filter((skill) => workerSkills.some((workerSkill) => workerSkill === skill || workerSkill.includes(skill) || skill.includes(workerSkill))).length;
      const score = (workerProfession && title.includes(workerProfession) ? 50 : 0) + (workerCategory && title.includes(workerCategory) ? 20 : 0) + matchedSkills * 15 + (workerCity && job.city.toLowerCase() === workerCity ? 10 : 0);
      return { ...job, matchScore: Math.min(score, 100), matchedSkills, applied: job.applications.length > 0, applicationStatus: job.applications[0]?.status ?? null };
    }).sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, Math.max(1, Math.min(limit, 50)));

    return { items: ranked, total: ranked.length, location: workerCity || null };
  }

  async findOneForWorker(userId: string, jobId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId }, select: { id: true } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true, title: true, description: true, city: true, district: true, state: true, pincode: true, latitude: true, longitude: true,
        salaryMin: true, salaryMax: true, salaryType: true, openings: true, startDate: true, endDate: true, status: true, createdAt: true, updatedAt: true,
        employer: { select: { id: true, companyName: true, companyType: true, description: true, status: true } },
        skills: { select: { required: true, skill: { select: { id: true, name: true, category: true } } } },
        applications: { where: { workerId: worker.id }, take: 1, select: { id: true, status: true, appliedAt: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return { ...job, applied: job.applications.length > 0, application: job.applications[0] ?? null };
  }

  async applyForJob(userId: string, jobId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId }, select: { id: true } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { id: true, status: true, openings: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) === 'DRAFT') throw new BadRequestException('This job is not open for applications');
    if (job.openings <= 0) throw new BadRequestException('No openings are available for this job');
    const existing = await this.prisma.jobApplication.findUnique({ where: { jobId_workerId: { jobId, workerId: worker.id } }, select: { id: true, status: true, appliedAt: true } });
    if (existing) return { alreadyApplied: true, application: existing };
    const application = await this.prisma.jobApplication.create({ data: { jobId, workerId: worker.id }, select: { id: true, jobId: true, workerId: true, status: true, appliedAt: true } });
    return { alreadyApplied: false, application };
  }
}
