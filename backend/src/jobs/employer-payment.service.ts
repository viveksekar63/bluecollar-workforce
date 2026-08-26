import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

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
}
