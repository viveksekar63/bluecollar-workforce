import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type WorkerImportRow = {
  workerCode: string; phone: string; email?: string; firstName: string; lastName?: string;
  professionCategory: string; profession: string; experienceYears?: number;
  addressLine1?: string; city: string; district?: string; state: string; pincode: string;
};

@Injectable()
export class WorkerImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importRows(rows: WorkerImportRow[]) {
    if (!rows.length) throw new BadRequestException('No worker rows supplied');
    if (rows.length > 5000) throw new BadRequestException('Maximum 5000 workers per import');
    const result = { total: rows.length, imported: 0, duplicate: 0, failed: 0, errors: [] as Array<{ row: number; reason: string }> };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const reason = this.validate(row);
        if (reason) throw new Error(reason);
        const existing = await this.prisma.user.findFirst({ where: { OR: [{ phone: row.phone }, ...(row.email ? [{ email: row.email }] : [])] }, select: { id: true } });
        const existingCode = await this.prisma.worker.findUnique({ where: { workerCode: row.workerCode }, select: { id: true } });
        if (existing || existingCode) { result.duplicate++; continue; }
        const category = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM work_categories WHERE name = ${row.professionCategory} AND "isActive" = true LIMIT 1`;
        const location = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM work_locations WHERE city = ${row.city} AND state = ${row.state} AND "isActive" = true LIMIT 1`;
        if (!category.length) throw new Error(`Unknown work category: ${row.professionCategory}`);
        if (!location.length) throw new Error(`Unknown work location: ${row.city}, ${row.state}`);
        await this.prisma.$transaction(async (tx) => {
          const user = await tx.user.create({ data: { phone: row.phone, email: row.email || undefined, firstName: row.firstName, lastName: row.lastName || undefined } });
          await tx.worker.create({ data: { userId: user.id, workerCode: row.workerCode, professionCategory: row.professionCategory, profession: row.profession, experienceYears: row.experienceYears ?? undefined, verificationStatus: 'PENDING', availabilityStatus: 'AVAILABLE', addresses: { create: { type: 'CURRENT', addressLine1: row.addressLine1 || row.city, city: row.city, district: row.district || undefined, state: row.state, pincode: row.pincode, isCurrent: true } } } });
        });
        result.imported++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ row: i + 2, reason: error?.message || 'Import failed' });
      }
    }
    return result;
  }

  template() {
    return 'workerCode,phone,email,firstName,lastName,professionCategory,profession,experienceYears,addressLine1,city,district,state,pincode\nWKR-0001,9876543210,worker@example.com,Ravi,Kumar,Hotel & Restaurant,Parota Master,6,Main Road,Thanjavur,Thanjavur,Tamil Nadu,613001\n';
  }

  private validate(row: WorkerImportRow) {
    if (!row.workerCode || !row.phone || !row.firstName || !row.professionCategory || !row.profession || !row.city || !row.state || !/^\d{6}$/.test(row.pincode)) return 'Required fields missing or pincode is invalid';
    if (!/^\d{10,15}$/.test(row.phone.replace(/\D/g, ''))) return 'Invalid phone number';
    if (row.experienceYears !== undefined && (Number.isNaN(Number(row.experienceYears)) || Number(row.experienceYears) < 0)) return 'Invalid experienceYears';
    return null;
  }
}
