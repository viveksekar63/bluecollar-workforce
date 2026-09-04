import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkerSearchRequirement } from './requirement-parser.types';

export type MissingMasterType =
  | 'PROFESSION'
  | 'PROFESSION_CATEGORY'
  | 'LOCATION'
  | 'SKILL'
  | 'LANGUAGE';

export class MasterDataNotFoundError extends Error {
  constructor(
    public readonly masterType: MissingMasterType,
    public readonly value: string,
  ) {
    super(`Master data not found: ${masterType}=${value}`);
    this.name = 'MasterDataNotFoundError';
  }
}

export interface NormalizedWorkerRequirement {
  workerCount: number | null;
  profession: { id: string; name: string; categoryId: string; categoryName: string } | null;
  professionCategory: { id: string; name: string } | null;
  location: {
    id: string;
    type: 'CITY' | 'DISTRICT' | 'STATE';
    name: string;
    parentId: string | null;
    parentName: string | null;
    pincode: string | null;
  } | null;
  minimumExperienceYears: number | null;
  skills: Array<{ id: string; name: string }>;
  languages: Array<{ id: string; name: string }>;
  availability: WorkerSearchRequirement['availability'];
  mobility: WorkerSearchRequirement['mobility'];
  willingToRelocate: boolean | null;
  willingToTravel: boolean | null;
  accommodationAvailable: boolean | null;
}

@Injectable()
export class WorkerRequirementNormalizerService {
  constructor(private readonly prisma: PrismaService) {}

  async normalize(requirement: WorkerSearchRequirement): Promise<NormalizedWorkerRequirement> {
    const profession = requirement.profession
      ? await this.resolveProfession(requirement.profession)
      : null;

    const professionCategory = requirement.professionCategory
      ? await this.resolveCategory(requirement.professionCategory)
      : profession
        ? { id: profession.categoryId, name: profession.categoryName }
        : null;

    const location = await this.resolveLocation(requirement);
    const skills = await this.resolveSkills(requirement.skills);
    const languages = await this.resolveLanguages(requirement.languages);

    return {
      workerCount: requirement.workerCount,
      profession,
      professionCategory,
      location,
      minimumExperienceYears: requirement.minimumExperienceYears,
      skills,
      languages,
      availability: requirement.availability,
      mobility: requirement.mobility,
      willingToRelocate: requirement.willingToRelocate,
      willingToTravel: requirement.willingToTravel,
      accommodationAvailable: requirement.accommodationAvailable,
    };
  }

  private async resolveProfession(value: string) {
    const normalized = value.trim();
    const rows = await this.prisma.$queryRaw<Array<{
      id: string; name: string; categoryId: string; categoryName: string;
    }>>`
      SELECT p."id", p."name", p."categoryId", c."name" AS "categoryName"
      FROM "work_professions" p
      JOIN "work_categories" c ON c."id" = p."categoryId"
      WHERE p."isActive" = true
        AND (p."name" ILIKE ${normalized} OR p."code" ILIKE ${normalized})
      ORDER BY CASE WHEN LOWER(p."name") = LOWER(${normalized}) THEN 0 ELSE 1 END
      LIMIT 1`;

    if (!rows[0]) {
      throw new MasterDataNotFoundError('PROFESSION', normalized);
    }

    return rows[0];
  }

  private async resolveCategory(value: string) {
    const normalized = value.trim();
    const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT "id", "name"
      FROM "work_categories"
      WHERE "isActive" = true
        AND ("name" ILIKE ${normalized} OR "code" ILIKE ${normalized})
      ORDER BY CASE WHEN LOWER("name") = LOWER(${normalized}) THEN 0 ELSE 1 END
      LIMIT 1`;

    if (!rows[0]) {
      throw new MasterDataNotFoundError('PROFESSION_CATEGORY', normalized);
    }

    return rows[0];
  }

  private async resolveLocation(requirement: WorkerSearchRequirement) {
    const { city, district, state, pincode } = requirement.location;
    const value = city || district || state || pincode;
    if (!value) return null;

    const type = city ? 'CITY' : district ? 'DISTRICT' : state ? 'STATE' : 'CITY';
    const rows = await this.prisma.$queryRaw<Array<{
      id: string; type: 'CITY' | 'DISTRICT' | 'STATE'; name: string;
      parentId: string | null; parentName: string | null; pincode: string | null;
    }>>`
      SELECT l."id", l."type", l."name", l."parentId", p."name" AS "parentName", l."pincode"
      FROM "work_locations" l
      LEFT JOIN "work_locations" p ON p."id" = l."parentId"
      WHERE l."isActive" = true
        AND l."type" = ${type}
        AND (
          (${city || null}::text IS NOT NULL AND l."name" ILIKE ${city || ''})
          OR (${district || null}::text IS NOT NULL AND l."name" ILIKE ${district || ''})
          OR (${state || null}::text IS NOT NULL AND l."name" ILIKE ${state || ''})
          OR (${pincode || null}::text IS NOT NULL AND l."pincode" = ${pincode || ''})
        )
      ORDER BY CASE WHEN LOWER(l."name") = LOWER(${value}) THEN 0 ELSE 1 END
      LIMIT 1`;

    if (!rows[0]) {
      throw new MasterDataNotFoundError('LOCATION', value.trim());
    }

    return rows[0];
  }

  private async resolveSkills(values: string[]) {
    if (!values.length) return [];
    const resolved: Array<{ id: string; name: string }> = [];

    for (const value of values) {
      const normalized = value.trim();
      const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT "id", "name" FROM "Skill"
        WHERE "name" ILIKE ${normalized}
        ORDER BY CASE WHEN LOWER("name") = LOWER(${normalized}) THEN 0 ELSE 1 END
        LIMIT 1`;
      if (!rows[0]) throw new MasterDataNotFoundError('SKILL', normalized);
      resolved.push(rows[0]);
    }

    return resolved;
  }

  private async resolveLanguages(values: string[]) {
    if (!values.length) return [];
    const resolved: Array<{ id: string; name: string }> = [];

    for (const value of values) {
      const normalized = value.trim();
      const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT "id", "name" FROM "Language"
        WHERE "name" ILIKE ${normalized}
        ORDER BY CASE WHEN LOWER("name") = LOWER(${normalized}) THEN 0 ELSE 1 END
        LIMIT 1`;
      if (!rows[0]) throw new MasterDataNotFoundError('LANGUAGE', normalized);
      resolved.push(rows[0]);
    }

    return resolved;
  }
}
