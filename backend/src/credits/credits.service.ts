import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  private config() {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) throw new BadRequestException('Razorpay is not configured');
    return { keyId, keySecret };
  }

  private async employer(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId }, select: { id: true, status: true } });
    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') throw new BadRequestException('Employer account is not verified');
    return employer;
  }

  private async ensureWallet(employerId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; balance: number }>>`
      INSERT INTO "employer_credit_wallets" ("id", "employerId", "balance", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${employerId}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("employerId") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "balance"`;
    return rows[0];
  }

  async packages() {
    return this.prisma.$queryRaw`
      SELECT "id", "code", "name", "credits", "priceInr", "isActive"
      FROM "employer_credit_packages"
      WHERE "isActive" = true
      ORDER BY "priceInr" ASC`;
  }

  async balance(userId: string) {
    const employer = await this.employer(userId);
    const wallet = await this.ensureWallet(employer.id);
    return { balance: Number(wallet.balance), currency: 'INR' };
  }

  async createOrder(userId: string, credits: number) {
    const employer = await this.employer(userId);
    if (!Number.isInteger(credits) || credits < 1) throw new BadRequestException('Invalid credit quantity');

    const packageRows = await this.prisma.$queryRaw<Array<{ id: string; code: string; credits: number; priceInr: number }>>`
      SELECT "id", "code", "credits", "priceInr"
      FROM "employer_credit_packages"
      WHERE "credits" = ${credits} AND "isActive" = true
      LIMIT 1`;
    const creditPackage = packageRows[0];
    if (!creditPackage) throw new BadRequestException('Credit package is not available');

    const { keyId, keySecret } = this.config();
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: creditPackage.priceInr * 100,
        currency: 'INR',
        receipt: `credit_${Date.now()}_${employer.id.slice(0, 8)}`,
        notes: { employerId: employer.id, packageCode: creditPackage.code, credits: String(creditPackage.credits) },
      },
      { auth: { username: keyId, password: keySecret } },
    );

    return {
      orderId: String(response.data.id),
      amount: Number(response.data.amount),
      currency: response.data.currency,
      keyId,
      packageCode: creditPackage.code,
      credits: creditPackage.credits,
      amountInr: creditPackage.priceInr,
    };
  }

  async verify(userId: string, orderId: string, paymentId: string, signature: string) {
    const employer = await this.employer(userId);
    const { keyId, keySecret } = this.config();
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) throw new BadRequestException('Invalid Razorpay payment signature');

    const orderResponse = await axios.get(`https://api.razorpay.com/v1/orders/${orderId}`, {
      auth: { username: keyId, password: keySecret },
    });
    const order = orderResponse.data;
    const packageCode = String(order.notes?.packageCode || '');
    const creditRows = await this.prisma.$queryRaw<Array<{ credits: number; priceInr: number }>>`
      SELECT "credits", "priceInr" FROM "employer_credit_packages"
      WHERE "code" = ${packageCode} AND "isActive" = true LIMIT 1`;
    const creditPackage = creditRows[0];
    if (!creditPackage) throw new BadRequestException('Credit package for payment not found');
    if (String(order.currency) !== 'INR' || Number(order.amount) !== creditPackage.priceInr * 100) {
      throw new BadRequestException('Payment amount does not match credit package');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ balanceAfter: number }>>`
        SELECT "balanceAfter" FROM "employer_credit_transactions"
        WHERE "employerId" = ${employer.id} AND "referenceType" = 'CREDIT_PURCHASE' AND "referenceId" = ${orderId}
        LIMIT 1`;
      if (existing[0]) return { balance: Number(existing[0].balanceAfter), alreadyProcessed: true };

      await tx.$executeRaw`
        INSERT INTO "employer_credit_wallets" ("id", "employerId", "balance", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${employer.id}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("employerId") DO NOTHING`;
      const walletRows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT "id", "balance" FROM "employer_credit_wallets" WHERE "employerId" = ${employer.id} FOR UPDATE`;
      const wallet = walletRows[0];
      if (!wallet) throw new BadRequestException('Credit wallet could not be created');

      const balanceAfter = Number(wallet.balance) + creditPackage.credits;
      await tx.$executeRaw`
        UPDATE "employer_credit_wallets" SET "balance" = ${balanceAfter}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${wallet.id}`;
      await tx.$executeRaw`
        INSERT INTO "employer_credit_transactions"
          ("id", "employerId", "walletId", "type", "credits", "balanceAfter", "referenceType", "referenceId", "description", "razorpayPaymentId")
        VALUES
          (gen_random_uuid()::text, ${employer.id}, ${wallet.id}, 'CREDIT', ${creditPackage.credits}, ${balanceAfter},
           'CREDIT_PURCHASE', ${orderId}, ${`Purchased ${creditPackage.credits} credits (${packageCode})`}, ${paymentId})`;
      return { balance: balanceAfter, alreadyProcessed: false };
    });

    return { balance: result.balance, currency: 'INR', alreadyProcessed: result.alreadyProcessed };
  }

  async transactions(userId: string) {
    const employer = await this.employer(userId);
    return this.prisma.$queryRaw`
      SELECT "id", "type", "credits", "balanceAfter", "referenceType", "referenceId", "description", "razorpayPaymentId", "createdAt"
      FROM "employer_credit_transactions" WHERE "employerId" = ${employer.id} ORDER BY "createdAt" DESC`;
  }
}
