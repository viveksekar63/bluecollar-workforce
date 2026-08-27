import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId }, select: { id: true, status: true } });
    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') throw new BadRequestException('Employer account is not verified');

    const rows = await this.prisma.$queryRaw<Array<{ id: string; razorpaySubscriptionId: string }>>`
      SELECT "id", "razorpaySubscriptionId"
      FROM "employer_subscriptions"
      WHERE "employerId" = ${employer.id}
        AND "razorpaySubscriptionId" IS NOT NULL
        AND "status" IN ('created', 'authenticated', 'active', 'pending', 'halted')
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    if (!rows[0]) return { synced: false, subscription: null };

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) throw new BadRequestException('Razorpay is not configured');

    try {
      const response = await axios.get(`https://api.razorpay.com/v1/subscriptions/${rows[0].razorpaySubscriptionId}`, { auth: { username: keyId, password: keySecret } });
      const subscription = response.data;
      const status = String(subscription.status ?? 'created');
      const currentStart = subscription.current_start ? new Date(Number(subscription.current_start) * 1000) : null;
      const currentEnd = subscription.current_end ? new Date(Number(subscription.current_end) * 1000) : null;
      const endedAt = subscription.ended_at ? new Date(Number(subscription.ended_at) * 1000) : null;
      await this.prisma.$executeRaw`
        UPDATE "employer_subscriptions"
        SET "status" = ${status}, "currentPeriodStart" = ${currentStart}, "currentPeriodEnd" = ${currentEnd}, "endedAt" = ${endedAt}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${rows[0].id}
      `;
      return { synced: true, subscription: { id: rows[0].id, razorpaySubscriptionId: rows[0].razorpaySubscriptionId, status, currentPeriodStart: currentStart, currentPeriodEnd: currentEnd } };
    } catch (error: any) {
      throw new BadRequestException(error?.response?.data?.error?.description || 'Unable to sync subscription status with Razorpay');
    }
  }
}
