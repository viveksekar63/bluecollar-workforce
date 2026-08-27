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

  async balance(userId: string) {
    const employer = await this.employer(userId);
    const rows = await this.prisma.$queryRaw<Array<{ balance: number }>>`SELECT "balance" FROM "employer_credit_wallets" WHERE "employerId" = ${employer.id} LIMIT 1`;
    if (!rows[0]) {
      await this.prisma.$executeRaw`INSERT INTO "employer_credit_wallets" ("id","employerId","balance","createdAt","updatedAt") VALUES (gen_random_uuid()::text, ${employer.id}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      return { balance: 0, currency: 'INR' };
    }
    return { balance: Number(rows[0].balance), currency: 'INR' };
  }

  async createOrder(userId: string, credits: number) {
    const employer = await this.employer(userId);
    const amountPerCredit = Number(process.env.CREDIT_PRICE_INR || 25);
    if (!Number.isInteger(credits) || credits < 1) throw new BadRequestException('Invalid credit quantity');
    if (!Number.isFinite(amountPerCredit) || amountPerCredit <= 0) throw new BadRequestException('Credit price is not configured');
    const { keyId, keySecret } = this.config();
    const amount = credits * amountPerCredit * 100;
    const response = await axios.post('https://api.razorpay.com/v1/orders', { amount, currency: 'INR', receipt: `credit_${Date.now()}`, notes: { employerId: employer.id, credits: String(credits) } }, { auth: { username: keyId, password: keySecret } });
    const order = response.data;
    await this.prisma.$executeRaw`INSERT INTO "employer_credit_transactions" ("id","employerId","type","credits","amountInr","razorpayOrderId","status","createdAt") VALUES (gen_random_uuid()::text, ${employer.id}, 'PURCHASE', ${credits}, ${credits * amountPerCredit}, ${String(order.id)}, 'PENDING', CURRENT_TIMESTAMP)`;
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId, credits, amountInr: credits * amountPerCredit };
  }

  async verify(userId: string, orderId: string, paymentId: string, signature: string) {
    const employer = await this.employer(userId);
    const { keySecret } = this.config();
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) throw new BadRequestException('Invalid Razorpay payment signature');
    const rows = await this.prisma.$queryRaw<Array<{ id: string; credits: number; status: string }>>`SELECT "id","credits","status" FROM "employer_credit_transactions" WHERE "employerId" = ${employer.id} AND "razorpayOrderId" = ${orderId} LIMIT 1`;
    const tx = rows[0];
    if (!tx) throw new NotFoundException('Credit purchase not found');
    if (tx.status === 'PAID') return this.balance(userId);
    await this.prisma.$transaction(async (db) => {
      await db.$executeRaw`INSERT INTO "employer_credit_wallets" ("id","employerId","balance","createdAt","updatedAt") VALUES (gen_random_uuid()::text, ${employer.id}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("employerId") DO NOTHING`;
      await db.$executeRaw`UPDATE "employer_credit_wallets" SET "balance" = "balance" + ${tx.credits}, "updatedAt" = CURRENT_TIMESTAMP WHERE "employerId" = ${employer.id}`;
      await db.$executeRaw`UPDATE "employer_credit_transactions" SET "status"='PAID',"razorpayPaymentId"=${paymentId},"razorpaySignature"=${signature},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${tx.id} AND "status"='PENDING'`;
    });
    return this.balance(userId);
  }

  async transactions(userId: string) {
    const employer = await this.employer(userId);
    return this.prisma.$queryRaw`SELECT "id","type","credits","amountInr","razorpayOrderId","razorpayPaymentId","status","createdAt" FROM "employer_credit_transactions" WHERE "employerId"=${employer.id} ORDER BY "createdAt" DESC`;
  }
}
