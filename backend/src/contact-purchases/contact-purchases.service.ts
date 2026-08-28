import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditWalletService } from './credit-wallet.service';

@Injectable()
export class ContactPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditWalletService: CreditWalletService,
  ) {}

  async getPrice() {
    const credits = Number(process.env.WORKER_CONTACT_CREDITS || 1);
    return { credits, currency: 'CREDITS' };
  }

  async createPurchase(employerId: string, workerId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return { success: false, message: 'Worker not found' };

    return this.creditWalletService.debitForContact(employerId, workerId);
  }

  async markPaid(purchaseId: string, employerId: string, _paymentId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; workerId: string }>>`
      SELECT "id", "workerId"
      FROM "employer_contact_purchases"
      WHERE "id" = ${purchaseId} AND "employerId" = ${employerId} AND "status" = 'PAID'
      LIMIT 1`;
    return { success: rows.length > 0 };
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
