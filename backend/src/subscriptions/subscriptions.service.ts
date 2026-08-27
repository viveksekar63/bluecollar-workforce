import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type PlanRow = { id: string; code: string; name: string; description: string | null; priceInr: number; currency: string; billingInterval: string; jobLimit: number; razorpayPlanId: string | null };
type SubscriptionRow = { id: string; employerId: string; planId: string; razorpaySubscriptionId: string | null; status: string; currentPeriodStart: Date | null; currentPeriodEnd: Date | null; jobsUsed: number; jobLimit: number; cancelAtPeriodEnd: boolean; endedAt: Date | null; planCode: string; planName: string; priceInr: number; billingInterval: string };

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private razorpayConfig() {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim(); const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim(); const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim(); const totalCount = Number(process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT ?? '1200');
    if (!keyId || !keySecret) throw new BadRequestException('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    if (!Number.isInteger(totalCount) || totalCount < 1) throw new BadRequestException('RAZORPAY_SUBSCRIPTION_TOTAL_COUNT must be a positive integer');
    return { keyId, keySecret, webhookSecret, totalCount };
  }

  private async getEmployer(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId }, select: { id: true, status: true, companyName: true } });
    if (!employer) throw new NotFoundException('Employer profile not found');
    if (String(employer.status) !== 'VERIFIED') throw new BadRequestException('Employer account is not verified');
    return employer;
  }

  async listPlans() {
    return this.prisma.$queryRaw<PlanRow[]>`SELECT "id", "code", "name", "description", "priceInr", "currency", "billingInterval", "jobLimit", "razorpayPlanId" FROM "employer_subscription_plans" WHERE "isActive" = true ORDER BY "priceInr" ASC`;
  }

  private async getCurrentForEmployer(employerId: string) {
    const rows = await this.prisma.$queryRaw<SubscriptionRow[]>`SELECT s."id", s."employerId", s."planId", s."razorpaySubscriptionId", s."status", s."currentPeriodStart", s."currentPeriodEnd", s."jobsUsed", s."jobLimit", s."cancelAtPeriodEnd", s."endedAt", p."code" AS "planCode", p."name" AS "planName", p."priceInr", p."billingInterval" FROM "employer_subscriptions" s INNER JOIN "employer_subscription_plans" p ON p."id" = s."planId" WHERE s."employerId" = ${employerId} AND s."status" IN ('created', 'authenticated', 'active', 'pending', 'halted') ORDER BY s."createdAt" DESC LIMIT 1`;
    return rows[0] ?? null;
  }

  private async employerHasAnySubscription(employerId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "employer_subscriptions" WHERE "employerId" = ${employerId} ORDER BY "createdAt" DESC LIMIT 1`;
    return Boolean(rows[0]);
  }

  async ensureFreeSubscription(employerId: string) {
    const current = await this.getCurrentForEmployer(employerId);
    if (current) return current;
    if (await this.employerHasAnySubscription(employerId)) return null;

    const plans = await this.prisma.$queryRaw<PlanRow[]>`SELECT "id", "code", "name", "description", "priceInr", "currency", "billingInterval", "jobLimit", "razorpayPlanId" FROM "employer_subscription_plans" WHERE "code" = 'FREE' AND "isActive" = true LIMIT 1`;
    const plan = plans[0];
    if (!plan) throw new BadRequestException('FREE employer subscription plan is not configured');

    await this.prisma.$executeRaw`INSERT INTO "employer_subscriptions" ("id", "employerId", "planId", "razorpaySubscriptionId", "status", "currentPeriodStart", "currentPeriodEnd", "jobsUsed", "jobLimit", "cancelAtPeriodEnd", "updatedAt") VALUES (${randomUUID()}, ${employerId}, ${plan.id}, NULL, 'active', NULL, NULL, 0, ${plan.jobLimit}, false, CURRENT_TIMESTAMP)`;
    return this.getCurrentForEmployer(employerId);
  }

  async current(userId: string) {
    const employer = await this.getEmployer(userId); const subscription = await this.getCurrentForEmployer(employer.id);
    if (!subscription) return { active: false, subscription: null };
    const active = subscription.status === 'active' && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > Date.now());
    return { active, subscription };
  }

  async create(userId: string, planCode: string) {
    const employer = await this.getEmployer(userId);
    const normalizedCode = planCode.trim().toUpperCase();
    const planRows = await this.prisma.$queryRaw<PlanRow[]>`SELECT "id", "code", "name", "description", "priceInr", "currency", "billingInterval", "jobLimit", "razorpayPlanId" FROM "employer_subscription_plans" WHERE "code" = ${normalizedCode} AND "isActive" = true LIMIT 1`;
    const plan = planRows[0];
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const current = await this.getCurrentForEmployer(employer.id);

    if (plan.code === 'FREE') {
      if (current) return { keyId: null, subscriptionId: null, shortUrl: null, status: 'active', active: true, plan: { code: plan.code, name: plan.name, priceInr: plan.priceInr, currency: plan.currency, billingInterval: plan.billingInterval, jobLimit: plan.jobLimit } };
      await this.ensureFreeSubscription(employer.id);
      return { keyId: null, subscriptionId: null, shortUrl: null, status: 'active', active: true, plan: { code: plan.code, name: plan.name, priceInr: plan.priceInr, currency: plan.currency, billingInterval: plan.billingInterval, jobLimit: plan.jobLimit } };
    }

    if (!plan.razorpayPlanId) throw new BadRequestException('This subscription plan is not configured with Razorpay yet');
    if (current && current.planCode !== 'FREE') throw new BadRequestException('You already have an employer subscription. Manage the current subscription before starting another one.');

    const { keyId, keySecret, totalCount } = this.razorpayConfig();
    try {
      const response = await axios.post('https://api.razorpay.com/v1/subscriptions', { plan_id: plan.razorpayPlanId, total_count: totalCount, quantity: 1, customer_notify: true, notes: { employerId: employer.id, planCode: plan.code } }, { auth: { username: keyId, password: keySecret } });
      const razorpaySubscription = response.data;

      if (current?.planCode === 'FREE') {
        await this.prisma.$executeRaw`UPDATE "employer_subscriptions" SET "status" = 'completed', "endedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${current.id}`;
      }

      await this.prisma.$executeRaw`INSERT INTO "employer_subscriptions" ("id", "employerId", "planId", "razorpaySubscriptionId", "status", "currentPeriodStart", "currentPeriodEnd", "jobsUsed", "jobLimit", "updatedAt") VALUES (${randomUUID()}, ${employer.id}, ${plan.id}, ${razorpaySubscription.id}, ${String(razorpaySubscription.status ?? 'created')}, ${razorpaySubscription.current_start ? new Date(Number(razorpaySubscription.current_start) * 1000) : null}, ${razorpaySubscription.current_end ? new Date(Number(razorpaySubscription.current_end) * 1000) : null}, 0, ${plan.jobLimit}, CURRENT_TIMESTAMP) ON CONFLICT ("razorpaySubscriptionId") DO UPDATE SET "status" = EXCLUDED."status", "currentPeriodStart" = EXCLUDED."currentPeriodStart", "currentPeriodEnd" = EXCLUDED."currentPeriodEnd", "updatedAt" = CURRENT_TIMESTAMP`;
      return { keyId, subscriptionId: razorpaySubscription.id as string, shortUrl: razorpaySubscription.short_url as string | null, status: String(razorpaySubscription.status ?? 'created'), active: String(razorpaySubscription.status ?? 'created') === 'active', plan: { code: plan.code, name: plan.name, priceInr: plan.priceInr, currency: plan.currency, billingInterval: plan.billingInterval, jobLimit: plan.jobLimit } };
    } catch (error: any) { throw new BadRequestException(error?.response?.data?.error?.description || 'Unable to create Razorpay subscription'); }
  }

  async verifyCheckout(userId: string, input: { razorpayPaymentId: string; razorpaySubscriptionId: string; razorpaySignature: string }) {
    const employer = await this.getEmployer(userId); const { keyId, keySecret } = this.razorpayConfig(); const paymentId = input.razorpayPaymentId?.trim(); const subscriptionId = input.razorpaySubscriptionId?.trim(); const signature = input.razorpaySignature?.trim();
    if (!paymentId || !subscriptionId || !signature) throw new BadRequestException('Incomplete subscription payment response');
    const expected = createHmac('sha256', keySecret).update(`${paymentId}|${subscriptionId}`).digest('hex'); const eb = Buffer.from(expected, 'utf8'); const rb = Buffer.from(signature, 'utf8');
    if (eb.length !== rb.length || !timingSafeEqual(eb, rb)) throw new BadRequestException('Subscription payment signature verification failed');
    const owned = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "employer_subscriptions" WHERE "employerId" = ${employer.id} AND "razorpaySubscriptionId" = ${subscriptionId} LIMIT 1`;
    if (!owned[0]) throw new NotFoundException('Subscription not found for this employer');
    try { const response = await axios.get(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, { auth: { username: keyId, password: keySecret } }); await this.syncRazorpaySubscription(response.data); return { verified: true, razorpayPaymentId: paymentId, subscriptionId, status: String(response.data.status), active: String(response.data.status) === 'active' }; }
    catch (error: any) { throw new BadRequestException(error?.response?.data?.error?.description || 'Unable to verify subscription with Razorpay'); }
  }

  private async syncRazorpaySubscription(subscription: any) {
    const status = String(subscription.status ?? 'created'); const currentStart = subscription.current_start ? new Date(Number(subscription.current_start) * 1000) : null; const currentEnd = subscription.current_end ? new Date(Number(subscription.current_end) * 1000) : null; const endedAt = subscription.ended_at ? new Date(Number(subscription.ended_at) * 1000) : null;
    await this.prisma.$executeRaw`UPDATE "employer_subscriptions" SET "status" = ${status}, "currentPeriodStart" = ${currentStart}, "currentPeriodEnd" = ${currentEnd}, "endedAt" = ${endedAt}, "cancelAtPeriodEnd" = CASE WHEN ${status} IN ('cancelled', 'completed', 'expired') THEN false ELSE "cancelAtPeriodEnd" END, "updatedAt" = CURRENT_TIMESTAMP WHERE "razorpaySubscriptionId" = ${String(subscription.id)}`;
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined, eventId: string | undefined) {
    const { webhookSecret } = this.razorpayConfig(); if (!webhookSecret) throw new BadRequestException('RAZORPAY_WEBHOOK_SECRET is not configured'); if (!signature) throw new BadRequestException('Missing Razorpay webhook signature');
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex'); const eb = Buffer.from(expected, 'utf8'); const rb = Buffer.from(signature, 'utf8'); if (eb.length !== rb.length || !timingSafeEqual(eb, rb)) throw new BadRequestException('Invalid Razorpay webhook signature'); if (!eventId) throw new BadRequestException('Missing Razorpay event id');
    const event = JSON.parse(rawBody.toString('utf8')) as any; const eventName = String(event.event ?? ''); if (!eventName.startsWith('subscription.')) return { received: true, ignored: true };
    return this.prisma.$transaction(async (tx) => {
      const inserted = await tx.$queryRaw<Array<{ id: string }>>`INSERT INTO "employer_subscription_webhook_events" ("id", "eventId", "event", "payload") VALUES (${randomUUID()}, ${eventId}, ${eventName}, ${event}) ON CONFLICT ("eventId") DO NOTHING RETURNING "id"`;
      if (!inserted[0]) return { received: true, duplicate: true };
      const subscription = event?.payload?.subscription?.entity;
      if (subscription?.id) {
        const status = String(subscription.status ?? 'created'); const currentStart = subscription.current_start ? new Date(Number(subscription.current_start) * 1000) : null; const currentEnd = subscription.current_end ? new Date(Number(subscription.current_end) * 1000) : null; const endedAt = subscription.ended_at ? new Date(Number(subscription.ended_at) * 1000) : null; const resetUsage = eventName === 'subscription.activated' || eventName === 'subscription.charged';
        await tx.$executeRaw`UPDATE "employer_subscriptions" SET "status" = ${status}, "currentPeriodStart" = ${currentStart}, "currentPeriodEnd" = ${currentEnd}, "endedAt" = ${endedAt}, "jobsUsed" = CASE WHEN ${resetUsage} THEN 0 ELSE "jobsUsed" END, "cancelAtPeriodEnd" = CASE WHEN ${status} IN ('cancelled', 'completed', 'expired') THEN false ELSE "cancelAtPeriodEnd" END, "updatedAt" = CURRENT_TIMESTAMP WHERE "razorpaySubscriptionId" = ${String(subscription.id)}`;
      }
      await tx.$executeRaw`UPDATE "employer_subscription_webhook_events" SET "processedAt" = CURRENT_TIMESTAMP WHERE "eventId" = ${eventId}`;
      return { received: true, event: eventName };
    });
  }

  async reserveJobPublishSlot(employerId: string) {
    let current = await this.getCurrentForEmployer(employerId);
    if (!current) {
      await this.ensureFreeSubscription(employerId);
      current = await this.getCurrentForEmployer(employerId);
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string; jobsUsed: number; jobLimit: number; currentPeriodEnd: Date | null }>>`UPDATE "employer_subscriptions" SET "jobsUsed" = "jobsUsed" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = (SELECT s."id" FROM "employer_subscriptions" s WHERE s."employerId" = ${employerId} AND s."status" = 'active' AND (s."currentPeriodEnd" IS NULL OR s."currentPeriodEnd" > CURRENT_TIMESTAMP) AND s."jobsUsed" < s."jobLimit" ORDER BY s."createdAt" DESC LIMIT 1 FOR UPDATE) RETURNING "id", "jobsUsed", "jobLimit", "currentPeriodEnd"`;
    if (!rows[0]) {
      if (!current) throw new BadRequestException('SUBSCRIPTION_REQUIRED: Choose an employer subscription to publish jobs.');
      if (current.planCode === 'FREE') throw new BadRequestException('JOB_LIMIT_REACHED: Your free plan includes 1 job posting. Choose a paid plan to post more jobs.');
      if (current.status !== 'active') throw new BadRequestException(`SUBSCRIPTION_INACTIVE: Your subscription is ${current.status}. Complete payment or update your payment method.`);
      throw new BadRequestException(`JOB_LIMIT_REACHED: You have used all ${current.jobLimit} job postings in the current billing period.`);
    }
    return rows[0];
  }

  async releaseJobPublishSlot(employerId: string) { await this.prisma.$executeRaw`UPDATE "employer_subscriptions" SET "jobsUsed" = GREATEST("jobsUsed" - 1, 0), "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = (SELECT "id" FROM "employer_subscriptions" WHERE "employerId" = ${employerId} AND "status" = 'active' ORDER BY "createdAt" DESC LIMIT 1)`; }

  async cancelAtPeriodEnd(userId: string) {
    const employer = await this.getEmployer(userId); const current = await this.getCurrentForEmployer(employer.id); if (!current) throw new NotFoundException('No active subscription found'); if (current.planCode === 'FREE') throw new BadRequestException('The FREE plan does not require cancellation.'); if (!current.razorpaySubscriptionId) throw new BadRequestException('Razorpay subscription is not available'); const { keyId, keySecret } = this.razorpayConfig();
    try { const response = await axios.post(`https://api.razorpay.com/v1/subscriptions/${current.razorpaySubscriptionId}/cancel`, { cancel_at_cycle_end: true }, { auth: { username: keyId, password: keySecret } }); await this.syncRazorpaySubscription(response.data); await this.prisma.$executeRaw`UPDATE "employer_subscriptions" SET "cancelAtPeriodEnd" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${current.id}`; return { success: true, subscriptionId: current.razorpaySubscriptionId, cancelAtPeriodEnd: true }; }
    catch (error: any) { throw new BadRequestException(error?.response?.data?.error?.description || 'Unable to cancel subscription'); }
  }
}
