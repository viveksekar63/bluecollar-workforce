import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkersQueryDto } from './dto/workers-query.dto';

@Injectable()
export class EmployerWorkerDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: WorkersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim() || null;
    const freeTextLocation = query.location?.trim() || null;
    const city = query.city?.trim() || null;
    const district = query.district?.trim() || null;
    const state = query.state?.trim() || null;
    const skill = query.skill?.trim() || null;
    const professionCategory = query.professionCategory?.trim() || null;
    const profession = query.profession?.trim() || null;
    const mobility = query.mobility?.trim().toUpperCase() || null;
    const minimumExperienceYears = query.minimumExperienceYears ?? null;
    const requestedLanguages = [
      ...(query.language ? [query.language] : []),
      ...(query.languages ? query.languages.split(',') : []),
    ].map((value) => value.trim()).filter(Boolean);

    const filters: Prisma.Sql[] = [];

    if (query.verificationStatus?.trim()) {
      filters.push(Prisma.sql`w."verificationStatus" = ${query.verificationStatus.trim()}`);
    }

    if (query.verifiedOnly) {
      filters.push(Prisma.sql`w."verificationStatus" = 'VERIFIED'`);
    }

    if (query.availability?.trim()) {
      filters.push(Prisma.sql`w."availabilityStatus" = ${query.availability.trim()}`);
    }

    if (query.availableOnly) {
      filters.push(Prisma.sql`w."availabilityStatus" = 'AVAILABLE'`);
    }

    if (minimumExperienceYears !== null) {
      filters.push(Prisma.sql`w."experienceYears" >= ${minimumExperienceYears}`);
    }

    if (professionCategory) {
      filters.push(Prisma.sql`w."professionCategory" ILIKE ${`%${professionCategory}%`}`);
    }

    if (profession) {
      filters.push(Prisma.sql`w."profession" ILIKE ${`%${profession}%`}`);
    }

    if (skill) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "WorkerSkill" ws
        JOIN "Skill" sk ON sk."id" = ws."skillId"
        WHERE ws."workerId" = w."id"
          AND sk."name" ILIKE ${`%${skill}%`}
      )`);
    }

    if (requestedLanguages.length) {
      const languagePatterns = requestedLanguages.map((value) => `%${value}%`);
      filters.push(Prisma.sql`(
        SELECT COUNT(DISTINCT l."id")
        FROM "WorkerLanguage" wl
        JOIN "Language" l ON l."id" = wl."languageId"
        WHERE wl."workerId" = w."id"
          AND (${Prisma.join(
            languagePatterns.map((pattern) => Prisma.sql`l."name" ILIKE ${pattern}`),
            ' OR ',
          )})
      ) = ${requestedLanguages.length}`);
    }

    const currentAddressMatches = (parts: Prisma.Sql[]) => Prisma.sql`EXISTS (
      SELECT 1 FROM "WorkerAddress" wa
      WHERE wa."workerId" = w."id"
        AND wa."isCurrent" = true
        AND (${Prisma.join(parts, ' AND ')})
    )`;

    const preferredLocationMatches = (parts: Prisma.Sql[]) => Prisma.sql`EXISTS (
      SELECT 1 FROM "worker_preferred_locations" pl
      WHERE pl."workerId" = w."id"
        AND (${Prisma.join(parts, ' AND ')})
    )`;

    const hierarchyParts: Prisma.Sql[] = [];
    if (city) hierarchyParts.push(Prisma.sql`wa."city" ILIKE ${`%${city}%`}`);
    if (district) hierarchyParts.push(Prisma.sql`COALESCE(wa."district", '') ILIKE ${`%${district}%`}`);
    if (state) hierarchyParts.push(Prisma.sql`wa."state" ILIKE ${`%${state}%`}`);

    if (hierarchyParts.length) {
      const preferredParts: Prisma.Sql[] = [];
      if (city) preferredParts.push(Prisma.sql`pl."city" ILIKE ${`%${city}%`}`);
      if (district) preferredParts.push(Prisma.sql`COALESCE(pl."district", '') ILIKE ${`%${district}%`}`);
      if (state) preferredParts.push(Prisma.sql`pl."state" ILIKE ${`%${state}%`}`);

      filters.push(Prisma.sql`(
        ${currentAddressMatches(hierarchyParts)}
        OR ${preferredLocationMatches(preferredParts)}
        OR EXISTS (
          SELECT 1 FROM "worker_work_preferences" wp_hierarchy
          WHERE wp_hierarchy."workerId" = w."id"
            AND wp_hierarchy."mobility" = 'ANYWHERE_INDIA'
        )
      )`);
    }

    if (freeTextLocation) {
      const locationPattern = `%${freeTextLocation}%`;
      filters.push(Prisma.sql`(
        EXISTS (
          SELECT 1 FROM "WorkerAddress" wa
          WHERE wa."workerId" = w."id"
            AND wa."isCurrent" = true
            AND (
              wa."city" ILIKE ${locationPattern}
              OR COALESCE(wa."district", '') ILIKE ${locationPattern}
              OR wa."state" ILIKE ${locationPattern}
              OR wa."pincode" ILIKE ${locationPattern}
            )
        )
        OR EXISTS (
          SELECT 1 FROM "worker_preferred_locations" pl
          WHERE pl."workerId" = w."id"
            AND (
              pl."city" ILIKE ${locationPattern}
              OR COALESCE(pl."district", '') ILIKE ${locationPattern}
              OR pl."state" ILIKE ${locationPattern}
            )
        )
        OR EXISTS (
          SELECT 1 FROM "worker_work_preferences" wp_anywhere
          WHERE wp_anywhere."workerId" = w."id"
            AND wp_anywhere."mobility" = 'ANYWHERE_INDIA'
        )
      )`);
    }

    if (mobility) {
      switch (mobility) {
        case 'LOCAL':
          filters.push(Prisma.sql`EXISTS (
            SELECT 1 FROM "worker_work_preferences" wp_local
            WHERE wp_local."workerId" = w."id"
              AND wp_local."mobility" = 'LOCAL'
          )`);
          break;
        case 'WITHIN_RADIUS':
        case 'WITHIN_STATE':
        case 'SPECIFIC_LOCATIONS':
          filters.push(Prisma.sql`EXISTS (
            SELECT 1 FROM "worker_work_preferences" wp_mobility
            WHERE wp_mobility."workerId" = w."id"
              AND wp_mobility."mobility" IN (${mobility}, 'ANYWHERE_INDIA')
          )`);
          break;
        case 'ANYWHERE_INDIA':
          filters.push(Prisma.sql`EXISTS (
            SELECT 1 FROM "worker_work_preferences" wp_any
            WHERE wp_any."workerId" = w."id"
              AND wp_any."mobility" = 'ANYWHERE_INDIA'
          )`);
          break;
      }
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
          WHERE ws2."workerId" = w."id"
            AND sk2."name" ILIKE ${pattern}
        )
        OR EXISTS (
          SELECT 1 FROM "WorkerAddress" wa2
          WHERE wa2."workerId" = w."id"
            AND wa2."isCurrent" = true
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
      ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
      : Prisma.empty;

    const rankingLocation = city || district || state || freeTextLocation;
    const rankingPattern = rankingLocation ? `%${rankingLocation}%` : null;

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
      district: string | null;
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
        addr."district",
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
        SELECT wa."city", wa."district", wa."state"
        FROM "WorkerAddress" wa
        WHERE wa."workerId" = w."id" AND wa."isCurrent" = true
        ORDER BY wa."createdAt" DESC
        LIMIT 1
      ) addr ON true
      LEFT JOIN "worker_work_preferences" wp ON wp."workerId" = w."id"
      ${where}
      ORDER BY
        CASE
          WHEN ${rankingPattern}::text IS NOT NULL AND EXISTS (
            SELECT 1 FROM "WorkerAddress" wa3
            WHERE wa3."workerId" = w."id" AND wa3."isCurrent" = true
              AND (wa3."city" ILIKE ${rankingPattern}
                OR COALESCE(wa3."district", '') ILIKE ${rankingPattern}
                OR wa3."state" ILIKE ${rankingPattern})
          ) THEN 0
          WHEN ${rankingPattern}::text IS NOT NULL AND EXISTS (
            SELECT 1 FROM "worker_preferred_locations" pl3
            WHERE pl3."workerId" = w."id"
              AND (pl3."city" ILIKE ${rankingPattern}
                OR COALESCE(pl3."district", '') ILIKE ${rankingPattern}
                OR pl3."state" ILIKE ${rankingPattern})
          ) THEN 1
          WHEN wp."mobility" = 'ANYWHERE_INDIA' THEN 2
          ELSE 3
        END,
        CASE WHEN w."verificationStatus" = 'VERIFIED' THEN 0 ELSE 1 END,
        CASE WHEN w."availabilityStatus" = 'AVAILABLE' THEN 0 ELSE 1 END,
        COALESCE(w."verificationScore", 0) DESC,
        w."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
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
        lastName: worker.lastName ?? '',
        profileImageUrl: worker.profileImageUrl,
        primarySkill: worker.primarySkill ?? 'Not specified',
        professionCategory: worker.professionCategory,
        profession: worker.profession,
        experienceYears: Number(worker.experienceYears ?? 0),
        city: worker.city ?? 'Not specified',
        district: worker.district ?? 'Not specified',
        state: worker.state ?? 'Not specified',
        verificationScore: worker.verificationScore ?? 0,
        verificationStatus: worker.verificationStatus,
        availability: worker.availability,
        mobility: worker.mobility ?? 'LOCAL',
        willingToRelocate: worker.willingToRelocate ?? false,
        willingToTravel: worker.willingToTravel ?? false,
        preferredLocations: Array.isArray(worker.preferredLocations)
          ? worker.preferredLocations
          : [],
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
