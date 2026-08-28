import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  async categories(includeInactive = false) {
    return this.prisma.$queryRaw`
      SELECT "id", "code", "name", "isActive", "createdAt", "updatedAt"
      FROM "work_categories"
      ${includeInactive ? this.prisma.$queryRaw`` : this.prisma.$queryRaw`WHERE "isActive" = true`}
      ORDER BY "name" ASC`;
  }

  async professions(categoryId?: string, includeInactive = false) {
    return this.prisma.$queryRaw`
      SELECT p."id", p."code", p."name", p."isActive", p."categoryId", c."name" AS "categoryName"
      FROM "work_professions" p
      JOIN "work_categories" c ON c."id" = p."categoryId"
      WHERE (${categoryId || null}::text IS NULL OR p."categoryId" = ${categoryId || null})
        AND (${includeInactive} OR p."isActive" = true)
      ORDER BY c."name", p."name"`;
  }

  async locations(type?: string, parentId?: string, includeInactive = false) {
    const normalizedType = type ? type.toUpperCase() : null;
    if (normalizedType && !['STATE', 'DISTRICT', 'CITY'].includes(normalizedType)) {
      throw new BadRequestException('Invalid location type');
    }
    return this.prisma.$queryRaw`
      SELECT l."id", l."type", l."name", l."code", l."parentId", l."pincode", l."isActive",
             p."name" AS "parentName"
      FROM "work_locations" l
      LEFT JOIN "work_locations" p ON p."id" = l."parentId"
      WHERE (${normalizedType}::text IS NULL OR l."type" = ${normalizedType})
        AND (${parentId || null}::text IS NULL OR l."parentId" = ${parentId || null})
        AND (${includeInactive} OR l."isActive" = true)
      ORDER BY l."type", l."name"`;
  }

  async createCategory(code: string, name: string) {
    this.requireText(code, 'Category code');
    this.requireText(name, 'Category name');
    try {
      const rows = await this.prisma.$queryRaw<Array<any>>`
        INSERT INTO "work_categories" ("code", "name") VALUES (${code.trim().toUpperCase()}, ${name.trim()})
        RETURNING "id", "code", "name", "isActive"`;
      return rows[0];
    } catch (e) {
      throw new BadRequestException('Category code or name already exists');
    }
  }

  async createProfession(categoryId: string, code: string, name: string) {
    this.requireText(categoryId, 'Category');
    this.requireText(code, 'Profession code');
    this.requireText(name, 'Profession name');
    const category = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "work_categories" WHERE "id" = ${categoryId} AND "isActive" = true LIMIT 1`;
    if (!category[0]) throw new NotFoundException('Active category not found');
    try {
      const rows = await this.prisma.$queryRaw<Array<any>>`
        INSERT INTO "work_professions" ("categoryId", "code", "name")
        VALUES (${categoryId}, ${code.trim().toUpperCase()}, ${name.trim()})
        RETURNING "id", "categoryId", "code", "name", "isActive"`;
      return rows[0];
    } catch (e) {
      throw new BadRequestException('Profession code or category/name already exists');
    }
  }

  async createLocation(type: string, name: string, parentId?: string, code?: string, pincode?: string) {
    const normalizedType = String(type || '').toUpperCase();
    if (!['STATE', 'DISTRICT', 'CITY'].includes(normalizedType)) throw new BadRequestException('Invalid location type');
    this.requireText(name, 'Location name');
    if (normalizedType === 'STATE' && parentId) throw new BadRequestException('State cannot have a parent');
    if (normalizedType !== 'STATE' && !parentId) throw new BadRequestException(`${normalizedType} requires a parent location`);
    if (normalizedType === 'CITY' && !pincode) throw new BadRequestException('City pincode is required');
    if (parentId) {
      const expectedParent = normalizedType === 'DISTRICT' ? 'STATE' : 'DISTRICT';
      const parent = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "work_locations" WHERE "id" = ${parentId} AND "type" = ${expectedParent} AND "isActive" = true LIMIT 1`;
      if (!parent[0]) throw new BadRequestException(`Parent must be an active ${expectedParent.toLowerCase()}`);
    }
    try {
      const rows = await this.prisma.$queryRaw<Array<any>>`
        INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode")
        VALUES (${normalizedType}, ${name.trim()}, ${code?.trim() || null}, ${parentId || null}, ${pincode?.trim() || null})
        RETURNING "id", "type", "name", "code", "parentId", "pincode", "isActive"`;
      return rows[0];
    } catch (e) {
      throw new BadRequestException('Location already exists at this level');
    }
  }

  async setActive(kind: 'category' | 'profession' | 'location', id: string, isActive: boolean) {
    const table = kind === 'category' ? 'work_categories' : kind === 'profession' ? 'work_professions' : 'work_locations';
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM ${this.prisma.$queryRawUnsafe(`"${table}"`)} WHERE "id" = ${id} LIMIT 1`;
    if (!rows[0]) throw new NotFoundException(`${kind} not found`);
    await this.prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "isActive" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
      isActive,
      id,
    );
    return { success: true, id, isActive };
  }

  private requireText(value: string, label: string) {
    if (!String(value || '').trim()) throw new BadRequestException(`${label} is required`);
  }
}
