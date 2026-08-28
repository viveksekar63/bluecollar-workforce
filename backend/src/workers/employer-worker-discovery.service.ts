import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkersQueryDto } from "./dto/workers-query.dto";

@Injectable()
export class EmployerWorkerDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: WorkersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim() || null;
    const location = query.location?.trim() || null;
    const skill = query.skill?.trim() || null;

    const filters: Prisma.Sql[] = [];

    if (query.verificationStatus) {
      filters.push(Prisma.sql`w."verificationStatus" = ${query.verificationStatus}`);
    }

    if (query.availability) {
      filters.push(Prisma.sql`w."availabilityStatus" = ${query.availability}`);
    }

    if (skill) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "WorkerSkill" ws
        JOIN "Skill" sk ON sk."id" = ws."skillId"
        WHERE ws."workerId" = w."id"
          AND sk."name" ILIKE ${`%${skill}%`}
      )`);
    }

    if (location) {
      filters.push(Prisma.sql`(
        EXISTS (
          SELECT 1 FROM "WorkerAddress" wa
          WHERE wa."workerId" = w."id"
            AND wa."isCurrent" = true
            AND (
              wa."city" ILIKE ${`%${location}%`}
              OR COALESCE(wa."district", '') ILIKE ${`%${location}%`}
              OR wa."state" ILIKE ${`%${location}%`}
              OR wa."pincode" ILIKE ${`%${location}%`}
            )
        )
        OR EXISTS (
          SELECT 1 FROM "worker_preferred_locations" pl
          WHERE pl."workerId" = w."id"
            AND (
              pl."city" ILIKE ${`%${location}%`}
              OR COALESCE(pl."district", '') ILIKE ${`%${location}%`}
              OR pl."state" ILIKE ${`%${location}%`}
            )
        )
        OR EXISTS (
          SELECT 1 FROM "worker_work_preferences" wp
          WHERE wp."workerId" = w."id"
            AND wp."mobility" = 'ANYWHERE_INDIA'
        )
      )`);
    }

    if (search) {
      const pattern = `%${search}%`;
      filters.push(Prisma.sql`(
        w."workerCode" ILIKE ${pattern}
        OR u."firstName" ILIKE ${pattern}
        OR COALESCE(u."lastName", '') ILIKE ${pattern}
        OR COALESCE(u."email", '') ILIKE ${pattern}
        OR u."phone" ILIKE ${pattern}
        OR COALESCE(w."bio", '') ILIKE ${pattern}
        OR COALESCE(w."profession", '') ILIKE ${pattern}
        OR COALESCE(w."professionCategory", '') ILIKE ${pattern}
        OR EXISTS (
          SELECT 1 FROM "WorkerSkill" ws2
          JOIN "Skill" sk2 ON sk2."id" = ws2."skillId"
          WHERE ws2."workerId" = w."id" AND sk2."name" ILIKE ${pattern}
        )
        OR EXISTS (
          SELECT 1 FROM "WorkerAddress" wa2
          WHERE wa2."workerId" = w."id" AND wa2."isCurrent" = true
            AND (wa2."city" ILIKE ${pattern} OR wa2."state" ILIKE ${pattern})
        )
        OR EXISTS (
          SELECT 1 FROM "worker_preferred_locations" pl2
          WHERE pl2."workerId" = w."id"
            AND (pl2."city" ILIKE ${pattern} OR pl2."state" ILIKE ${pattern})
        )
      )`);
    }

    const where = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      workerCode: string;
      firstName: string;
      lastName: string | null;
      profileImageUrl: string | null;
      primarySkill: string | null;
      professionCategory: string | null;
      profession: string | null;
      experienceYears: unknown;
      city: string | null;
      state: string | null;
      verificationScore: number | null;
      verificationStatus: string;
      availability: string;
      mobility: string | null;
      willingToRelocate: boolean | null;
      willingToTravel: boolean | null;
      preferredLocations: unknown;
    }>>(Prisma.sql`
      SELECT
        w."id",
        w."workerCode",
        u."firstName",
        u."lastName",
        u."profilePhotoUrl",
        skill."name" AS "primarySkill",
        w."professionCategory",
        w."profession",
        w."experienceYears",
        addr."city",
        addr."state",
        w."verificationScore",
        w."verificationStatus",
        w."availabilityStatus" AS "availability",
        wp."mobility",
        wp."willingToRelocate",
        wp."willingToTravel",
        COALESCE((
          SELECT json_agg(json_build_object(
            'city', pl."city",
            'district', pl."district",
            'state', pl."state",
            'country', pl."country"
          ) ORDER BY pl."city")
          FROM "worker_preferred_locations" pl
          WHERE pl."workerId" = w."id"
        ), '[]'::json) AS "preferredLocations"
      FROM "Worker" w
      JOIN "User" u ON u."id" = w."userId"
      LEFT JOIN LATERAL (
        SELECT sk."name"
        FROM "WorkerSkill" ws
        JOIN "Skill" sk ON sk."id" = ws."skillId"
        WHERE ws."workerId" = w."id"
        ORDER BY sk."name" ASC
        LIMIT 1
      ) skill ON true
      LEFT JOIN LATERAL (
        SELECT wa."city", wa."state"
        FROM "WorkerAddress" wa
        WHERE wa."workerId" = w."id" AND wa."isCurrent" = true
        ORDER BY wa."createdAt" DESC
        LIMIT 1
      ) addr ON true
      LEFT JOIN "worker_work_preferences" wp ON wp."workerId" = w."id"
      ${where}
      ORDER BY
        CASE
          WHEN ${location} IS NOT NULL AND EXISTS (
            SELECT 1 FROM "WorkerAddress" wa3
            WHERE wa3."workerId" = w."id" AND wa3."isCurrent" = true
              AND (wa3."city" ILIKE ${location ? `%${location}%` : ''} OR wa3."state" ILIKE ${location ? `%${location}%` : ''})
          ) THEN 0
          WHEN ${location} IS NOT NULL AND EXISTS (
            SELECT 1 FROM "worker_preferred_locations" pl3
            WHERE pl3."workerId" = w."id"
              AND (pl3."city" ILIKE ${location ? `%${location}%` : ''} OR pl3."state" ILIKE ${location ? `%${location}%` : ''})
          ) THEN 1
          WHEN wp."mobility" = 'ANYWHERE_INDIA' THEN 2
          ELSE 3
        END,
        w."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `);

    const [{ count }] = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Worker" w
      JOIN "User" u ON u."id" = w."userId"
      ${where}
    `);

    const total = Number(count);

    return {
      items: rows.map((worker) => ({
        id: worker.id,
        workerCode: worker.workerCode,
        firstName: worker.firstName,
        lastName: worker.lastName ?? "",
        profileImageUrl: worker.profileImageUrl,
        primarySkill: worker.primarySkill ?? "Not specified",
        professionCategory: worker.professionCategory,
        profession: worker.profession,
        experienceYears: Number(worker.experienceYears ?? 0),
        city: worker.city ?? "Not specified",
        state: worker.state ?? "Not specified",
        verificationScore: worker.verificationScore ?? 0,
        verificationStatus: worker.verificationStatus,
        availability: worker.availability,
        mobility: worker.mobility ?? "LOCAL",
        willingToRelocate: worker.willingToRelocate ?? false,
        willingToTravel: worker.willingToTravel ?? false,
        preferredLocations: Array.isArray(worker.preferredLocations) ? worker.preferredLocations : [],
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
