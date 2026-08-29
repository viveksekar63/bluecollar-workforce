import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EmployerWorkerShortlistService {
  constructor(private readonly prisma: PrismaService) {}

  private async employerForUser(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!employer) throw new NotFoundException("Employer profile not found");
    if (String(employer.status) !== "VERIFIED") {
      throw new ConflictException("Employer account is not verified");
    }
    return employer;
  }

  async status(userId: string, workerId: string) {
    const employer = await this.employerForUser(userId);
    const item = await this.prisma.employerWorkerShortlist.findUnique({
      where: { employerId_workerId: { employerId: employer.id, workerId } },
      select: { id: true, createdAt: true },
    });
    return { shortlisted: Boolean(item), createdAt: item?.createdAt ?? null };
  }

  async add(userId: string, workerId: string) {
    const employer = await this.employerForUser(userId);
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId }, select: { id: true } });
    if (!worker) throw new NotFoundException("Worker not found");

    const existing = await this.prisma.employerWorkerShortlist.findUnique({
      where: { employerId_workerId: { employerId: employer.id, workerId } },
      select: { id: true, createdAt: true },
    });
    if (existing) return { success: true, alreadyShortlisted: true, shortlisted: true, createdAt: existing.createdAt };

    const item = await this.prisma.employerWorkerShortlist.create({
      data: { employerId: employer.id, workerId },
      select: { id: true, createdAt: true },
    });
    return { success: true, alreadyShortlisted: false, shortlisted: true, createdAt: item.createdAt };
  }

  async remove(userId: string, workerId: string) {
    const employer = await this.employerForUser(userId);
    const existing = await this.prisma.employerWorkerShortlist.findUnique({
      where: { employerId_workerId: { employerId: employer.id, workerId } },
      select: { id: true },
    });
    if (!existing) return { success: true, shortlisted: false };
    await this.prisma.employerWorkerShortlist.delete({ where: { id: existing.id } });
    return { success: true, shortlisted: false };
  }

  async list(userId: string, page = 1, limit = 20) {
    const employer = await this.employerForUser(userId);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.employerWorkerShortlist.findMany({
        where: { employerId: employer.id },
        skip,
        take: safeLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          worker: {
            select: {
              id: true, workerCode: true, professionCategory: true, profession: true,
              experienceYears: true, verificationScore: true, verificationStatus: true,
              availabilityStatus: true,
              user: { select: { firstName: true, lastName: true, profilePhotoUrl: true } },
              addresses: { where: { isCurrent: true }, orderBy: { createdAt: "desc" }, take: 1,
                select: { city: true, district: true, state: true } },
              skills: { orderBy: { skill: { name: "asc" } }, take: 1, select: { skill: { select: { name: true } } } },
              workPreferences: { select: { mobility: true, willingToRelocate: true, willingToTravel: true } },
            },
          },
        },
      }),
      this.prisma.employerWorkerShortlist.count({ where: { employerId: employer.id } }),
    ]);
    return {
      items: rows.map((row) => ({
        shortlistId: row.id,
        shortlistedAt: row.createdAt,
        id: row.worker.id,
        workerCode: row.worker.workerCode,
        firstName: row.worker.user.firstName,
        lastName: row.worker.user.lastName ?? "",
        profileImageUrl: row.worker.user.profilePhotoUrl,
        professionCategory: row.worker.professionCategory,
        profession: row.worker.profession,
        experienceYears: Number(row.worker.experienceYears ?? 0),
        verificationScore: row.worker.verificationScore ?? 0,
        verificationStatus: row.worker.verificationStatus,
        availability: row.worker.availabilityStatus,
        primarySkill: row.worker.skills[0]?.skill.name ?? "Not specified",
        city: row.worker.addresses[0]?.city ?? "Not specified",
        district: row.worker.addresses[0]?.district ?? null,
        state: row.worker.addresses[0]?.state ?? "Not specified",
        mobility: row.worker.workPreferences?.mobility ?? "LOCAL",
        willingToRelocate: row.worker.workPreferences?.willingToRelocate ?? false,
        willingToTravel: row.worker.workPreferences?.willingToTravel ?? false,
      })),
      page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit),
    };
  }
}
