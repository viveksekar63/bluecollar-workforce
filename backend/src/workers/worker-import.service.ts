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
          SELECT id
          FROM work_categories
          WHERE name = ${row.professionCategory}
            AND "isActive" = true
          LIMIT 1
        `;

        const location = await this.prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM work_locations
          WHERE city = ${row.city}
            AND state = ${row.state}
            AND "isActive" = true
          LIMIT 1
        `;

        if (!category.length) {
          throw new Error(`Unknown work category: ${row.professionCategory}`);
        }
        if (!location.length) {
          throw new Error(`Unknown work location: ${row.city}, ${row.state}`);
        }

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
          const masterLocation = await this.prisma.$queryRaw<
            Array<{ city: string; state: string; district: string | null }>
          >`
            SELECT city, state, district
            FROM work_locations
            WHERE city = ${preferred.city}
              AND state = ${preferred.state}
              AND "isActive" = true
            LIMIT 1
          `;

          if (!masterLocation.length) {
            throw new Error(`Unknown preferred work location: ${preferred.city}, ${preferred.state}`);
          }

          preferredLocationRows.push({
            city: masterLocation[0].city,
            state: masterLocation[0].state,
            district: masterLocation[0].district || undefined,
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
                  city: row.city,
                  district: row.district || undefined,
                  state: row.state,
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
      'WKR-0002,9876543211,worker2@example.com,Suresh,Yadav,Plumbing,Plumber,5,Station Road,Patna,Patna,Bihar,800001,SPECIFIC_LOCATIONS,"Chennai, Tamil Nadu|Coimbatore, Tamil Nadu",true,true',
      '',
    ].join('\n');
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
