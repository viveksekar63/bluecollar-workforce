import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditWalletService {
  private readonly contactCost = () => {
    const value = Number(process.env.WORKER_CONTACT_CREDITS || 1);
    if (!Number.isInteger(value) || value <= 0) throw new BadRequestException('Worker contact credit cost is not configured');
    return value;
  };

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(employerId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ balance: number }>>`
      SELECT "balance" FROM "employer_credit_wallets" WHERE "employerId" = ${employerId} LIMIT 1`;
    return { balance: rows[0]?.balance ?? 0, contactCost: this.contactCost() };
  }

  async ensureWallet(employerId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; balance: number }>>`
      INSERT INTO "employer_credit_wallets" ("id", "employerId", "balance", "updatedAt")
      VALUES (${randomUUID()}, ${employerId}, 0, CURRENT_TIMESTAMP)
      ON CONFLICT ("employerId") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "balance"`;
    return rows[0];
  }

  async packages() {
    return this.prisma.$queryRaw`
      SELECT "id", "code", "name", "credits", "priceInr", "isActive"
      FROM "employer_credit_packages" WHERE "isActive" = true ORDER BY "priceInr" ASC`;
  }

  async addCredits(employerId: string, credits: number, referenceId: string, razorpayPaymentId: string) {
    if (!Number.isInteger(credits) || credits <= 0) throw new BadRequestException('Invalid credit amount');
    await this.ensureWallet(employerId);
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT "id", "balance" FROM "employer_credit_wallets" WHERE "employerId" = ${employerId} FOR UPDATE`;
      if (!wallet[0]) throw new BadRequestException('Credit wallet not found');
      const balanceAfter = wallet[0].balance + credits;
      await tx.$executeRaw`
        UPDATE "employer_credit_wallets" SET "balance" = ${balanceAfter}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${wallet[0].id}`;
      await tx.$executeRaw`
        INSERT INTO "employer_credit_transactions" ("id", "employerId", "walletId", "type", "credits", "balanceAfter", "referenceType", "referenceId", "description", "razorpayPaymentId")
        VALUES (${randomUUID()}, ${employerId}, ${wallet[0].id}, 'CREDIT', ${credits}, ${balanceAfter}, 'CREDIT_PURCHASE', ${referenceId}, 'Credit package purchase', ${razorpayPaymentId})`;
      return { balance: balanceAfter };
    });
  }

  async debitForContact(employerId: string, workerId: string) {
    const cost = this.contactCost();
    await this.ensureWallet(employerId);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "employer_contact_purchases"
        WHERE "employerId" = ${employerId} AND "workerId" = ${workerId} AND "status" = 'PAID' LIMIT 1`;
      if (existing.length) return { alreadyUnlocked: true, purchaseId: existing[0].id };

      const wallet = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT "id", "balance" FROM "employer_credit_wallets" WHERE "employerId" = ${employerId} FOR UPDATE`;
      if (!wallet[0] || wallet[0].balance < cost) throw new BadRequestException('Insufficient credits');

      const balanceAfter = wallet[0].balance - cost;
      const purchaseId = randomUUID();
      await tx.$executeRaw`
        UPDATE "employer_credit_wallets" SET "balance" = ${balanceAfter}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${wallet[0].id}`;
      await tx.$executeRaw`
        INSERT INTO "employer_credit_transactions" ("id", "employerId", "walletId", "type", "credits", "balanceAfter", "referenceType", "referenceId", "description")
        VALUES (${randomUUID()}, ${employerId}, ${wallet[0].id}, 'DEBIT', ${-cost}, ${balanceAfter}, 'CONTACT_UNLOCK', ${workerId}, 'Worker contact unlocked')`;
      await tx.$executeRaw`
        INSERT INTO "employer_contact_purchases" ("id", "employerId", "workerId", "amountInr", "currency", "status", "paidAt", "updatedAt")
        VALUES (${purchaseId}, ${employerId}, ${workerId}, 0, 'CREDITS', 'PAID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      return { alreadyUnlocked: false, purchaseId, balance: balanceAfter, creditsUsed: cost };
    });
  }

  async transactions(employerId: string) {
    return this.prisma.$queryRaw`
      SELECT "id", "type", "credits", "balanceAfter", "referenceType", "referenceId", "description", "razorpayPaymentId", "createdAt"
      FROM "employer_credit_transactions" WHERE "employerId" = ${employerId} ORDER BY "createdAt" DESC`;
  }
}
