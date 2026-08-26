import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

type PaymentMethodType = 'CARD' | 'UPI' | 'BANK_ACCOUNT';

type PaymentMethodRow = {
  id: string;
  type: PaymentMethodType;
  label: string;
  provider: string | null;
  providerPaymentMethodId: string | null;
  last4: string | null;
  upiId: string | null;
  isDefault: boolean;
  status: string;
  createdAt: Date;
};

@Injectable()
export class EmployerPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  private async getEmployerId(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') {
      throw new BadRequestException('Employer account is not verified');
    }

    return employer.id;
  }

  async list(userId: string) {
    const employerId = await this.getEmployerId(userId);

    return this.prisma.$queryRaw<PaymentMethodRow[]>`
      SELECT
        "id",
        "type",
        "label",
        "provider",
        "providerPaymentMethodId",
        "last4",
        "upiId",
        "isDefault",
        "status",
        "createdAt"
      FROM "employer_payment_methods"
      WHERE "employerId" = ${employerId}
        AND "status" = 'ACTIVE'
      ORDER BY "isDefault" DESC, "createdAt" DESC
    `;
  }

  async hasActiveMethod(userId: string) {
    const employerId = await this.getEmployerId(userId);
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "employer_payment_methods"
      WHERE "employerId" = ${employerId}
        AND "status" = 'ACTIVE'
    `;
    return Number(rows[0]?.count ?? 0) > 0;
  }

  async create(userId: string, input: {
    type: PaymentMethodType;
    label: string;
    provider?: string;
    providerPaymentMethodId?: string;
    last4?: string;
    upiId?: string;
  }) {
    const employerId = await this.getEmployerId(userId);
    const type = input.type;
    const label = String(input.label ?? '').trim();

    if (!['CARD', 'UPI', 'BANK_ACCOUNT'].includes(type)) {
      throw new BadRequestException('Select a valid payment method');
    }
    if (!label) throw new BadRequestException('Payment method name is required');

    const last4 = input.last4?.trim();
    const upiId = input.upiId?.trim();

    if (type === 'CARD' && (!last4 || !/^\d{4}$/.test(last4))) {
      throw new BadRequestException('Enter the last 4 digits of the card');
    }
    if (type === 'UPI' && (!upiId || !upiId.includes('@'))) {
      throw new BadRequestException('Enter a valid UPI ID');
    }
    if (type === 'BANK_ACCOUNT' && (!last4 || !/^\d{4}$/.test(last4))) {
      throw new BadRequestException('Enter the last 4 digits of the bank account');
    }

    const id = randomUUID();

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "employer_payment_methods"
        SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "employerId" = ${employerId} AND "status" = 'ACTIVE'
      `;

      const rows = await tx.$queryRaw<PaymentMethodRow[]>`
        INSERT INTO "employer_payment_methods"
          ("id", "employerId", "type", "label", "provider", "providerPaymentMethodId", "last4", "upiId", "isDefault", "status")
        VALUES
          (${id}, ${employerId}, ${type}, ${label}, ${input.provider?.trim() || null}, ${input.providerPaymentMethodId?.trim() || null}, ${last4 || null}, ${upiId || null}, true, 'ACTIVE')
        RETURNING
          "id", "type", "label", "provider", "providerPaymentMethodId", "last4", "upiId", "isDefault", "status", "createdAt"
      `;

      return rows[0];
    });
  }

  private razorpayConfig() {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const feeInr = Number(process.env.EMPLOYER_JOB_PUBLISH_FEE_INR ?? '99');

    if (!keyId || !keySecret) {
      throw new BadRequestException('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    if (!Number.isFinite(feeInr) || feeInr <= 0) {
      throw new BadRequestException('EMPLOYER_JOB_PUBLISH_FEE_INR must be greater than zero');
    }

    return { keyId, keySecret, feeInr };
  }

  async createJobPublishOrder(userId: string, jobId: string) {
    const employerId = await this.getEmployerId(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
      select: { id: true, title: true, status: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) !== 'DRAFT') throw new BadRequestException('Only draft jobs can be published');

    const { keyId, keySecret, feeInr } = this.razorpayConfig();
    const amount = Math.round(feeInr * 100);

    try {
      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount,
          currency: 'INR',
          receipt: `job_${job.id}_${Date.now()}`.slice(0, 40),
          notes: { jobId: job.id, employerId },
          capture: 'automatic',
        },
        { auth: { username: keyId, password: keySecret } },
      );

      return {
        keyId,
        orderId: response.data.id as string,
        amount,
        amountInr: feeInr,
        currency: 'INR',
        jobId: job.id,
        jobTitle: job.title,
      };
    } catch (error: any) {
      const message = error?.response?.data?.error?.description || 'Unable to create Razorpay order';
      throw new BadRequestException(message);
    }
  }

  async verifyJobPublishPayment(
    userId: string,
    jobId: string,
    input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    const employerId = await this.getEmployerId(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
      select: { id: true, status: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) !== 'DRAFT') throw new BadRequestException('Job is already published or closed');

    const { keySecret } = this.razorpayConfig();
    const orderId = input.razorpayOrderId?.trim();
    const paymentId = input.razorpayPaymentId?.trim();
    const signature = input.razorpaySignature?.trim();
    if (!orderId || !paymentId || !signature) throw new BadRequestException('Incomplete payment response');

    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new BadRequestException('Payment signature verification failed');
    }

    try {
      const paymentResponse = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        auth: { username: process.env.RAZORPAY_KEY_ID!.trim(), password: keySecret },
      });
      const payment = paymentResponse.data;

      if (payment.order_id !== orderId) throw new BadRequestException('Payment order mismatch');
      if (!['captured', 'authorized'].includes(String(payment.status))) {
        throw new BadRequestException(`Payment is not successful: ${payment.status}`);
      }

      if (String(payment.status) === 'authorized') {
        await axios.post(
          `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
          { amount: payment.amount, currency: payment.currency },
          { auth: { username: process.env.RAZORPAY_KEY_ID!.trim(), password: keySecret } },
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const message = error?.response?.data?.error?.description || 'Unable to verify payment with Razorpay';
      throw new BadRequestException(message);
    }

    return { paid: true, jobId: job.id };
  }
}
