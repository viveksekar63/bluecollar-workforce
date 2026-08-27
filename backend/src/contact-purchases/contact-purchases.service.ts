import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactPurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrice() {
    const value = Number(process.env.WORKER_CONTACT_FEE_INR || 25);
    if (!Number.isFinite(value) || value <= 0) throw new BadRequestException('Worker contact fee is not configured');
    return { priceInr: value, currency: 'INR' };
  }

  async createPurchase(employerId: string, workerId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId }, include: { user: true } });
    if (!worker) throw new NotFoundException('Worker not found');
    const { priceInr, currency } = await this.getPrice();
    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "employer_contact_purchases"
      WHERE "employerId" = ${employerId} AND "workerId" = ${workerId} AND "status" = 'PAID' LIMIT 1`;
    if (existing.length) return { alreadyPurchased: true, purchaseId: existing[0].id, priceInr, currency };
    const purchaseId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO "employer_contact_purchases" ("id", "employerId", "workerId", "amountInr", "currency", "status", "createdAt", "updatedAt")
      VALUES (${purchaseId}, ${employerId}, ${workerId}, ${priceInr}, ${currency}, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    return { purchaseId, priceInr, currency, workerId };
  }

  async markPaid(purchaseId: string, employerId: string, paymentId: string) {
    const result = await this.prisma.$executeRaw`
      UPDATE "employer_contact_purchases"
      SET "status" = 'PAID', "razorpayPaymentId" = ${paymentId}, "paidAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${purchaseId} AND "employerId" = ${employerId} AND "status" = 'PENDING'`;
    if (!result) throw new BadRequestException('Purchase is invalid or already completed');
    return { success: true };
  }

  async history(employerId: string) {
    return this.prisma.$queryRaw`
      SELECT p."id", p."workerId", p."amountInr", p."currency", p."status", p."razorpayPaymentId", p."paidAt", p."createdAt",
             u."firstName", u."lastName"
      FROM "employer_contact_purchases" p
      JOIN "Worker" w ON w."id" = p."workerId"
      JOIN "User" u ON u."id" = w."userId"
      WHERE p."employerId" = ${employerId}
      ORDER BY p."createdAt" DESC`;
  }

  async canReveal(employerId: string, workerId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "employer_contact_purchases"
      WHERE "employerId" = ${employerId} AND "workerId" = ${workerId} AND "status" = 'PAID' LIMIT 1`;
    return rows.length > 0;
  }
}
