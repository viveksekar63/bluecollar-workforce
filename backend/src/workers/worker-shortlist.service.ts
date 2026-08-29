import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WorkerShortlistService {
  constructor(private readonly prisma: PrismaService) {}

  private async getEmployerId(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!employer) throw new NotFoundException("Employer profile not found");
    if (String(employer.status) !== "VERIFIED") {
      throw new ConflictException("Employer account is not verified");
    }
    return employer.id;
  }

  async add(userId: string, workerId: string) {
    const employerId = await this.getEmployerId(userId);
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId }, select: { id: true } });
    if (!worker) throw new NotFoundException("Worker not found");

    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "employer_worker_shortlists"
      WHERE "employerId" = ${employerId} AND "workerId" = ${workerId}
      LIMIT 1
    `;
    if (existing.length) return { success: true, alreadyShortlisted: true, workerId };

    await this.prisma.$executeRaw`
      INSERT INTO "employer_worker_shortlists" ("id", "employerId", "workerId")
      VALUES (${randomUUID()}, ${employerId}, ${workerId})
      ON CONFLICT ("employerId", "workerId") DO NOTHING
    `;

    return { success: true, alreadyShortlisted: false, workerId };
  }

  async remove(userId: string, workerId: string) {
    const employerId = await this.getEmployerId(userId);
    const deleted = await this.prisma.$executeRaw`
      DELETE FROM "employer_worker_shortlists"
      WHERE "employerId" = ${employerId} AND "workerId" = ${workerId}
    `;
    return { success: true, removed: Number(deleted) > 0, workerId };
  }

  async list(userId: string, page = 1, limit = 20) {
    const employerId = await this.getEmployerId(userId);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT
          s."id" AS "shortlistId",
          s."workerId",
          s."createdAt" AS "shortlistedAt",
          u."firstName",
          u."lastName",
          u."profilePhotoUrl",
          w."workerCode",
          w."professionCategory",
          w."profession",
          w."experienceYears",
          w."verificationStatus",
          w."verificationScore",
          w."availabilityStatus",
          wp."mobility",
          wp."willingToRelocate",
          wp."willingToTravel",
          a."city",
          a."district",
          a."state"
        FROM "employer_worker_shortlists" s
        JOIN "Worker" w ON w."id" = s."workerId"
        JOIN "User" u ON u."id" = w."userId"
        LEFT JOIN "worker_work_preferences" wp ON wp."workerId" = w."id"
        LEFT JOIN LATERAL (
          SELECT "city", "district", "state"
          FROM "WorkerAddress"
          WHERE "workerId" = w."id" AND "isCurrent" = true
          ORDER BY "createdAt" DESC
          LIMIT 1
        ) a ON true
        WHERE s."employerId" = ${employerId}
        ORDER BY s."createdAt" DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS "count"
        FROM "employer_worker_shortlists"
        WHERE "employerId" = ${employerId}
      `,
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    return {
      items: rows.map((row) => ({
        shortlistId: row.shortlistId,
        workerId: row.workerId,
        shortlistedAt: row.shortlistedAt,
        name: [row.firstName, row.lastName].filter(Boolean).join(" "),
        profilePhotoUrl: row.profilePhotoUrl,
        workerCode: row.workerCode,
        professionCategory: row.professionCategory,
        profession: row.profession,
        experienceYears: row.experienceYears == null ? null : Number(row.experienceYears),
        verificationStatus: row.verificationStatus,
        verificationScore: row.verificationScore,
        availabilityStatus: row.availabilityStatus,
        mobility: row.mobility,
        willingToRelocate: row.willingToRelocate ?? false,
        willingToTravel: row.willingToTravel ?? false,
        currentLocation: row.city ? { city: row.city, district: row.district, state: row.state } : null,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNext: safePage * safeLimit < total,
        hasPrevious: safePage > 1,
      },
    };
  }

  async isShortlisted(userId: string, workerId: string) {
    const employerId = await this.getEmployerId(userId);
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "employer_worker_shortlists"
      WHERE "employerId" = ${employerId} AND "workerId" = ${workerId}
      LIMIT 1
    `;
    return { workerId, shortlisted: rows.length > 0 };
  }
}
