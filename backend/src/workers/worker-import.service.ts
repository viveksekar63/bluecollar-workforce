import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type WorkerImportRow = {
  workerCode: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName?: string;
  professionCategory: string;
  profession: string;
  experienceYears?: number;
  addressLine1?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  workPreference?: string;
  preferredLocations?: string;
  willingToRelocate?: boolean | string;
  willingToTravel?: boolean | string;
};

const VALID_MOBILITIES = new Set([
  'LOCAL',
  'WITHIN_RADIUS',
  'WITHIN_STATE',
  'SPECIFIC_LOCATIONS',
  'ANYWHERE_INDIA',
]);

@Injectable()
export class WorkerImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importRows(rows: WorkerImportRow[]) {
    if (!rows.length) throw new BadRequestException('No worker rows supplied');
    if (rows.length > 5000) throw new BadRequestException('Maximum 5000 workers per import');

    const result = {
      total: rows.length,
      imported: 0,
      duplicate: 0,
      failed: 0,
      errors: [] as Array<{ row: number; reason: string }>,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const reason = this.validate(row);
        if (reason) throw new Error(reason);

        const existing = await this.prisma.user.findFirst({
          where: {
            OR: [
              { phone: row.phone },
              ...(row.email ? [{ email: row.email }] : []),
            ],
          },
          select: { id: true },
        });

        const existingCode = await this.prisma.worker.findUnique({
          where: { workerCode: row.workerCode },
          select: { id: true },
        });

        if (existing || existingCode) {
          result.duplicate++;
          continue;
        }

        const category = await this.prisma.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "work_categories"
          WHERE "name" = ${row.professionCategory}
            AND "isActive" = true
          LIMIT 1
        `;

        if (!category.length) {
          throw new Error(`Unknown work category: ${row.professionCategory}`);
        }

        // work_locations is hierarchical: CITY -> DISTRICT -> STATE.
        // Resolve the CSV city/state against that hierarchy instead of
        // assuming city/state columns exist on the table.
        const location = await this.resolveLocation(row.city, row.state, row.district);

        const mobility = row.workPreference?.trim() || 'LOCAL';
        if (!VALID_MOBILITIES.has(mobility)) {
          throw new Error(
            `Invalid workPreference: ${mobility}. Allowed values: ${Array.from(VALID_MOBILITIES).join(', ')}`,
          );
        }

        const preferredLocations = this.parsePreferredLocations(row.preferredLocations);
        if (mobility === 'SPECIFIC_LOCATIONS' && !preferredLocations.length) {
          throw new Error('preferredLocations is required when workPreference is SPECIFIC_LOCATIONS');
        }

        const preferredLocationRows: Array<{ city: string; state: string; district?: string }> = [];
        for (const preferred of preferredLocations) {
          const masterLocation = await this.resolveLocation(preferred.city, preferred.state);
          preferredLocationRows.push({
            city: masterLocation.city,
            state: masterLocation.state,
            district: masterLocation.district || undefined,
          });
        }

        await this.prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              phone: row.phone,
              email: row.email || undefined,
              firstName: row.firstName,
              lastName: row.lastName || undefined,
            },
          });

          const worker = await tx.worker.create({
            data: {
              userId: user.id,
              workerCode: row.workerCode,
              professionCategory: row.professionCategory,
              profession: row.profession,
              experienceYears: row.experienceYears ?? undefined,
              verificationStatus: 'PENDING',
              availabilityStatus: 'AVAILABLE',
              addresses: {
                create: {
                  type: 'CURRENT',
                  addressLine1: row.addressLine1 || row.city,
                  city: location.city,
                  district: location.district || row.district || undefined,
                  state: location.state,
                  pincode: row.pincode,
                  isCurrent: true,
                },
              },
              workPreferences: {
                create: {
                  mobility,
                  willingToRelocate: this.parseBoolean(row.willingToRelocate),
                  willingToTravel: this.parseBoolean(row.willingToTravel),
                },
              },
            },
          });

          if (preferredLocationRows.length) {
            await tx.workerPreferredLocation.createMany({
              data: preferredLocationRows.map((preferred) => ({
                workerId: worker.id,
                city: preferred.city,
                district: preferred.district,
                state: preferred.state,
                country: 'India',
              })),
            });
          }
        });

        result.imported++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          reason: error?.message || 'Import failed',
        });
      }
    }

    return result;
  }

  template() {
    return [
      'workerCode,phone,email,firstName,lastName,professionCategory,profession,experienceYears,addressLine1,city,district,state,pincode,workPreference,preferredLocations,willingToRelocate,willingToTravel',
      'WKR-0001,9876543210,worker@example.com,Ravi,Kumar,Hotel & Restaurant,Parota Master,6,Main Road,Thanjavur,Thanjavur,Tamil Nadu,613001,ANYWHERE_INDIA,,true,true',
      'WKR-0002,9876543211,worker2@example.com,Suresh,Yadav,Hotel & Restaurant,Kitchen Helper,5,Station Road,Thanjavur,Thanjavur,Tamil Nadu,613001,SPECIFIC_LOCATIONS,"Chennai, Tamil Nadu|Kumbakonam, Tamil Nadu",true,true',
      '',
    ].join('\n');
  }

  private async resolveLocation(city: string, state: string, district?: string) {
    const cities = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; parentId: string | null }>
    >`
      SELECT "id", "name", "parentId"
      FROM "work_locations"
      WHERE "type" = 'CITY'
        AND "name" = ${city}
        AND "isActive" = true
      LIMIT 10
    `;

    if (!cities.length) {
      throw new Error(`Unknown work location: ${city}, ${state}`);
    }

    for (const cityRow of cities) {
      if (!cityRow.parentId) continue;

      const districts = await this.prisma.$queryRaw<
        Array<{ id: string; name: string; parentId: string | null }>
      >`
        SELECT "id", "name", "parentId"
        FROM "work_locations"
        WHERE "id" = ${cityRow.parentId}
          AND "type" = 'DISTRICT'
          AND "isActive" = true
        LIMIT 1
      `;

      if (!districts.length || !districts[0].parentId) continue;
      const districtRow = districts[0];

      if (district && district.trim() && district.trim() !== districtRow.name) continue;

      const states = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT "id", "name"
        FROM "work_locations"
        WHERE "id" = ${districtRow.parentId}
          AND "type" = 'STATE'
          AND "isActive" = true
        LIMIT 1
      `;

      if (states.length && states[0].name === state) {
        return {
          id: cityRow.id,
          city: cityRow.name,
          district: districtRow.name,
          state: states[0].name,
        };
      }
    }

    throw new Error(`Unknown work location: ${city}, ${state}`);
  }

  private parsePreferredLocations(value?: string) {
    if (!value?.trim()) return [];

    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.lastIndexOf(',');
        if (separator <= 0 || separator === item.length - 1) {
          throw new Error(
            `Invalid preferredLocations value: ${item}. Use "City, State|City, State"`,
          );
        }
        return {
          city: item.slice(0, separator).trim(),
          state: item.slice(separator + 1).trim(),
        };
      });
  }

  private parseBoolean(value?: boolean | string) {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === '') return false;

    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;

    throw new Error(`Invalid boolean value: ${value}`);
  }

  private validate(row: WorkerImportRow) {
    if (
      !row.workerCode ||
      !row.phone ||
      !row.firstName ||
      !row.professionCategory ||
      !row.profession ||
      !row.city ||
      !row.state ||
      !/^\d{6}$/.test(row.pincode)
    ) {
      return 'Required fields missing or pincode is invalid';
    }

    if (!/^\d{10,15}$/.test(row.phone.replace(/\D/g, ''))) {
      return 'Invalid phone number';
    }

    if (
      row.experienceYears !== undefined &&
      (Number.isNaN(Number(row.experienceYears)) || Number(row.experienceYears) < 0)
    ) {
      return 'Invalid experienceYears';
    }

    return null;
  }
}
