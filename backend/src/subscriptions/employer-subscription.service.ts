import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type PlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceInr: number;
  currency: string;
  billingInterval: string;
  jobLimit: number;
  razorpayPlanId: string | null;
};

type SubscriptionRow = {
  id: string;
  employerId: string;
  planId: string;
  razorpaySubscriptionId: string | null;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  jobsUsed: number;
  jobLimit: number;
  cancelAtPeriodEnd: boolean;
  endedAt: Date | null;
  planCode: string;
  planName: string;
  priceInr: number;
  billingInterval: string;
};

const ACTIVE_STATUSES = new Set(['active']);
const PENDING_STATUSES = new Set(['created', 'authenticated', 'pending']);
const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'expired', 'halted', 'failed']);

@Injectable()
export class EmployerSubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  private razorpayConfig() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!keyId || !keySecret) throw new BadRequestException('Razorpay credentials are not configured');
    return { keyId, keySecret, webhookSecret };
  }

  private isActiveStatus(status: string) {
    return ACTIVE_STATUSES.has(status);
  }

  private isKnownStatus(status: string) {
    return ACTIVE_STATUSES.has(status) || PENDING_STATUSES.has(status) || TERMINAL_STATUSES.has(status);
  }

  async syncRazorpaySubscription(subscription: any) {
    const status = String(subscription.status ?? 'created');
    if (!this.isKnownStatus(status)) {
      throw new BadRequestException(`Unsupported Razorpay subscription status: ${status}`);
    }

    const currentStart = subscription.current_start
      ? new Date(Number(subscription.current_start) * 1000)
      : null;
    const currentEnd = subscription.current_end
      ? new Date(Number(subscription.current_end) * 1000)
      : null;
    const endedAt = subscription.ended_at
      ? new Date(Number(subscription.ended_at) * 1000)
      : null;

    const resetUsage = status === 'active' && (
      subscription.status === 'active' ||
      Boolean(subscription.current_start)
    );

    const rows = await this.prisma.$queryRaw<Array<{ employerId: string }>>`
      SELECT "employerId"
      FROM "employer_subscriptions"
      WHERE "razorpaySubscriptionId" = ${String(subscription.id)}
      LIMIT 1
    `;

    await this.prisma.$executeRaw`
      UPDATE "employer_subscriptions"
      SET "status" = ${status},
          "currentPeriodStart" = ${currentStart},
          "currentPeriodEnd" = ${currentEnd},
          "endedAt" = ${endedAt},
          "jobsUsed" = CASE WHEN ${resetUsage} THEN 0 ELSE "jobsUsed" END,
          "cancelAtPeriodEnd" = CASE
            WHEN ${TERMINAL_STATUSES.has(status)} THEN false
            ELSE "cancelAtPeriodEnd"
          END,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "razorpaySubscriptionId" = ${String(subscription.id)}
    `;

    if (this.isActiveStatus(status) && rows[0]) {
      await this.markFreeCompleted(rows[0].employerId);
    }
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    eventId: string | undefined,
  ) {
    const { webhookSecret } = this.razorpayConfig();
    if (!webhookSecret) throw new BadRequestException('RAZORPAY_WEBHOOK_SECRET is not configured');
    if (!signature) throw new BadRequestException('Missing Razorpay webhook signature');
    if (!eventId) throw new BadRequestException('Missing Razorpay event id');

    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const eb = Buffer.from(expected, 'utf8');
    const rb = Buffer.from(signature, 'utf8');
    if (eb.length !== rb.length || !timingSafeEqual(eb, rb)) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as any;
    const eventName = String(event.event ?? '');
    if (!eventName.startsWith('subscription.')) {
      return { received: true, ignored: true };
    }

    return this.prisma.$transaction(async (tx) => {
      const inserted = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "employer_subscription_webhook_events"
          ("id", "eventId", "event", "payload")
        VALUES (${randomUUID()}, ${eventId}, ${eventName}, ${event})
        ON CONFLICT ("eventId") DO NOTHING
        RETURNING "id"
      `;
      if (!inserted[0]) return { received: true, duplicate: true };

      const subscription = event?.payload?.subscription?.entity;
      if (subscription?.id) {
        const status = String(subscription.status ?? 'created');
        if (!this.isKnownStatus(status)) {
          throw new BadRequestException(`Unsupported Razorpay subscription status: ${status}`);
        }

        const currentStart = subscription.current_start
          ? new Date(Number(subscription.current_start) * 1000)
          : null;
        const currentEnd = subscription.current_end
          ? new Date(Number(subscription.current_end) * 1000)
          : null;
        const endedAt = subscription.ended_at
          ? new Date(Number(subscription.ended_at) * 1000)
          : null;
        const resetUsage = eventName === 'subscription.activated' || eventName === 'subscription.charged';

        const employerRows = await tx.$queryRaw<Array<{ employerId: string }>>`
          SELECT "employerId"
          FROM "employer_subscriptions"
          WHERE "razorpaySubscriptionId" = ${String(subscription.id)}
          LIMIT 1
        `;

        await tx.$executeRaw`
          UPDATE "employer_subscriptions"
          SET "status" = ${status},
              "currentPeriodStart" = ${currentStart},
              "currentPeriodEnd" = ${currentEnd},
              "endedAt" = ${endedAt},
              "jobsUsed" = CASE WHEN ${resetUsage} THEN 0 ELSE "jobsUsed" END,
              "cancelAtPeriodEnd" = CASE
                WHEN ${TERMINAL_STATUSES.has(status)} THEN false
                ELSE "cancelAtPeriodEnd"
              END,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "razorpaySubscriptionId" = ${String(subscription.id)}
        `;

        if (status === 'active' && employerRows[0]) {
          await tx.$executeRaw`
            UPDATE "employer_subscriptions"
            SET "status" = 'completed',
                "endedAt" = CURRENT_TIMESTAMP,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "employerId" = ${employerRows[0].employerId}
              AND "razorpaySubscriptionId" <> ${String(subscription.id)}
              AND "status" = 'active'
          `;
        }
      }

      await tx.$executeRaw`
        UPDATE "employer_subscription_webhook_events"
        SET "processedAt" = CURRENT_TIMESTAMP
        WHERE "eventId" = ${eventId}
      `;

      return { received: true, event: eventName };
    });
  }

  private async markFreeCompleted(employerId: string) {
    await this.prisma.$executeRaw`
      UPDATE "employer_subscriptions"
      SET "status" = 'completed',
          "endedAt" = COALESCE("endedAt", CURRENT_TIMESTAMP),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "employerId" = ${employerId}
        AND "planId" IN (
          SELECT "id" FROM "employer_subscription_plans" WHERE "code" = 'FREE'
        )
        AND "status" IN ('active', 'pending', 'created', 'authenticated')
    `;
  }
}
