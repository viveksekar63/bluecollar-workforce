import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

export type OutreachChannel = 'PHONE' | 'WHATSAPP' | 'SMS' | 'EMAIL';
export type OutreachStatus = 'NOT_CONTACTED' | 'CONTACTED' | 'NO_RESPONSE' | 'INTERESTED' | 'INTERVIEW' | 'SELECTED' | 'HIRED' | 'NOT_INTERESTED' | 'UNAVAILABLE' | 'WRONG_NUMBER';
export interface LogContactInput { channel: OutreachChannel; status?: OutreachStatus; outcome?: string; notes?: string; nextFollowUpAt?: string | null; }
export interface UpdateOutreachStatusInput { status: OutreachStatus; notes?: string; outcome?: string; nextFollowUpAt?: string | null; }

const VALID_CHANNELS: OutreachChannel[] = ['PHONE', 'WHATSAPP', 'SMS', 'EMAIL'];
const VALID_STATUSES: OutreachStatus[] = ['NOT_CONTACTED', 'CONTACTED', 'NO_RESPONSE', 'INTERESTED', 'INTERVIEW', 'SELECTED', 'HIRED', 'NOT_INTERESTED', 'UNAVAILABLE', 'WRONG_NUMBER'];
const TERMINAL_STATUSES: OutreachStatus[] = ['HIRED', 'NOT_INTERESTED', 'WRONG_NUMBER'];

@Injectable()
export class RecruitmentOutreachService {
  constructor(private readonly prisma: PrismaService, private readonly jobsService: JobsService) {}

  private validateChannel(channel: string): asserts channel is OutreachChannel {
    if (!VALID_CHANNELS.includes(channel as OutreachChannel)) throw new BadRequestException('channel must be PHONE, WHATSAPP, SMS, or EMAIL');
  }

  private validateStatus(status?: string): asserts status is OutreachStatus | undefined {
    if (status && !VALID_STATUSES.includes(status as OutreachStatus)) throw new BadRequestException('Invalid outreach status');
  }

  private validateDate(value?: string | null) {
    if (value && Number.isNaN(new Date(value).getTime())) throw new BadRequestException('nextFollowUpAt must be a valid ISO date');
  }

  private async getOwnedJob(userId: string, jobId: string) {
    const employer = await this.jobsService.getEmployer(userId);
    const job = await this.prisma.job.findFirst({ where: { id: jobId, employerId: employer.id }, select: { id: true, title: true, status: true, employerId: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) === 'CLOSED' || String(job.status) === 'CANCELLED') throw new BadRequestException('Cannot manage outreach for a closed job');
    return { employer, job };
  }

  private async assertCandidate(employerId: string, jobId: string, workerId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId }, select: { id: true } });
    if (!worker) throw new NotFoundException('Worker not found');
    const action = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "job_worker_actions" WHERE "employer_id" = ${employerId} AND "job_id" = ${jobId}
        AND "worker_id" = ${workerId} AND "action_type" IN ('SHORTLISTED','INVITED') LIMIT 1
    `);
    if (!action[0]) throw new BadRequestException('Worker must be shortlisted or invited before outreach');
  }

  private async getOrCreateOutreach(employerId: string, jobId: string, workerId: string) {
    const inserted = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "job_worker_outreach" ("id","employer_id","job_id","worker_id")
      VALUES (${randomUUID()},${employerId},${jobId},${workerId})
      ON CONFLICT ("job_id","worker_id") DO NOTHING RETURNING "id"
    `);
    if (inserted[0]) return inserted[0].id;
    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "job_worker_outreach" WHERE "employer_id"=${employerId} AND "job_id"=${jobId} AND "worker_id"=${workerId} LIMIT 1
    `);
    if (!existing[0]) throw new NotFoundException('Outreach record not found');
    return existing[0].id;
  }

  async list(userId: string, jobId: string, page = 1, limit = 20, status?: string) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    this.validateStatus(status);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const statusFilter = status ? Prisma.sql`AND COALESCE(o."status", 'NOT_CONTACTED') = ${status}` : Prisma.empty;
    const candidateSource = Prisma.sql`
      SELECT DISTINCT ON (a."worker_id") a."worker_id" AS "workerId"
      FROM "job_worker_actions" a
      WHERE a."employer_id" = ${employer.id} AND a."job_id" = ${job.id}
        AND a."action_type" IN ('SHORTLISTED','INVITED')
      ORDER BY a."worker_id", CASE WHEN a."action_type" = 'SHORTLISTED' THEN 0 ELSE 1 END, a."created_at" DESC
    `;
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT o."id" AS "outreachId", c."workerId", COALESCE(o."status", 'NOT_CONTACTED') AS "status",
          o."preferred_channel" AS "preferredChannel", o."last_channel" AS "lastChannel", COALESCE(o."contact_attempts", 0) AS "contactAttempts",
          o."last_contacted_at" AS "lastContactedAt", o."next_follow_up_at" AS "nextFollowUpAt", o."outcome", o."notes",
          w."workerCode", w."experienceYears", w."profession", w."professionCategory", w."verificationStatus", w."verificationScore",
          u."firstName", u."lastName", u."phone", u."email", u."profilePhotoUrl"
        FROM (${candidateSource}) c JOIN "Worker" w ON w."id" = c."workerId" JOIN "User" u ON u."id" = w."userId"
        LEFT JOIN "job_worker_outreach" o ON o."job_id" = ${job.id} AND o."worker_id" = c."workerId"
        WHERE 1=1 ${statusFilter}
        ORDER BY CASE WHEN COALESCE(o."status", 'NOT_CONTACTED') = 'NOT_CONTACTED' THEN 0 ELSE 1 END,
          o."next_follow_up_at" ASC NULLS LAST, o."updated_at" DESC NULLS LAST, c."workerId" ASC
        LIMIT ${safeLimit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "total" FROM (${candidateSource}) c
        LEFT JOIN "job_worker_outreach" o ON o."job_id" = ${job.id} AND o."worker_id" = c."workerId"
        WHERE 1=1 ${statusFilter}
      `),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return { job: { id: job.id, title: job.title }, items, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit), hasNext: safePage * safeLimit < total, hasPrevious: safePage > 1 } };
  }

  async listFollowUps(userId: string, jobId: string, page = 1, limit = 20) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT o."id" AS "outreachId", o."worker_id" AS "workerId", o."status", o."preferred_channel" AS "preferredChannel",
          o."last_channel" AS "lastChannel", o."contact_attempts" AS "contactAttempts", o."last_contacted_at" AS "lastContactedAt",
          o."next_follow_up_at" AS "nextFollowUpAt", o."outcome", o."notes", w."workerCode", w."profession", w."experienceYears",
          w."verificationStatus", w."verificationScore", u."firstName", u."lastName", u."phone", u."email"
        FROM "job_worker_outreach" o JOIN "Worker" w ON w."id"=o."worker_id" JOIN "User" u ON u."id"=w."userId"
        WHERE o."employer_id"=${employer.id} AND o."job_id"=${job.id} AND o."next_follow_up_at" IS NOT NULL
          AND o."next_follow_up_at" <= CURRENT_TIMESTAMP AND o."status" NOT IN ('HIRED','NOT_INTERESTED','WRONG_NUMBER')
        ORDER BY o."next_follow_up_at" ASC, o."updated_at" ASC
        LIMIT ${safeLimit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "total" FROM "job_worker_outreach" o
        WHERE o."employer_id"=${employer.id} AND o."job_id"=${job.id} AND o."next_follow_up_at" IS NOT NULL
          AND o."next_follow_up_at" <= CURRENT_TIMESTAMP AND o."status" NOT IN ('HIRED','NOT_INTERESTED','WRONG_NUMBER')
      `),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return { job: { id: job.id, title: job.title }, items, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit), hasNext: safePage * safeLimit < total, hasPrevious: safePage > 1 } };
  }

  async initialize(userId: string, jobId: string, workerId: string, preferredChannel?: OutreachChannel) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    if (preferredChannel) this.validateChannel(preferredChannel);
    await this.assertCandidate(employer.id, job.id, workerId);
    const id = randomUUID();
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO "job_worker_outreach" ("id","employer_id","job_id","worker_id","preferred_channel")
      VALUES (${id},${employer.id},${job.id},${workerId},${preferredChannel ?? null})
      ON CONFLICT ("job_id","worker_id") DO UPDATE SET
        "preferred_channel" = COALESCE(EXCLUDED."preferred_channel", "job_worker_outreach"."preferred_channel"), "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id" AS "outreachId", "status", "preferred_channel" AS "preferredChannel"
    `);
    return { success: true, ...rows[0], jobId: job.id, workerId };
  }

  async logContact(userId: string, jobId: string, workerId: string, input: LogContactInput) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    this.validateChannel(input.channel); this.validateStatus(input.status); this.validateDate(input.nextFollowUpAt);
    await this.assertCandidate(employer.id, job.id, workerId);
    const outreachId = await this.getOrCreateOutreach(employer.id, job.id, workerId);
    const nextStatus = input.status ?? 'CONTACTED';
    const eventId = randomUUID();
    const updated = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "job_worker_outreach" SET "status"=${nextStatus}, "last_channel"=${input.channel}, "contact_attempts"="contact_attempts"+1,
        "last_contacted_at"=CURRENT_TIMESTAMP, "next_follow_up_at"=${input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null},
        "outcome"=${input.outcome ?? null}, "notes"=${input.notes ?? null}, "updated_at"=CURRENT_TIMESTAMP
      WHERE "id"=${outreachId} RETURNING "id" AS "outreachId", "status", "contact_attempts" AS "contactAttempts",
        "last_contacted_at" AS "lastContactedAt", "next_follow_up_at" AS "nextFollowUpAt", "outcome", "notes"
    `);
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "job_worker_outreach_events" ("id","outreach_id","employer_id","job_id","worker_id","channel","event_type","outcome","notes")
      VALUES (${eventId},${outreachId},${employer.id},${job.id},${workerId},${input.channel},'CONTACT_ATTEMPT',${input.outcome ?? null},${input.notes ?? null})
    `);
    return { success: true, ...updated[0], eventId };
  }

  async updateStatus(userId: string, jobId: string, workerId: string, input: UpdateOutreachStatusInput) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    this.validateStatus(input.status); this.validateDate(input.nextFollowUpAt);
    await this.assertCandidate(employer.id, job.id, workerId);
    const existing = await this.prisma.$queryRaw<Array<{ id: string; status: OutreachStatus; lastChannel: OutreachChannel | null }>>(Prisma.sql`
      SELECT "id", "status", "last_channel" AS "lastChannel" FROM "job_worker_outreach"
      WHERE "employer_id"=${employer.id} AND "job_id"=${job.id} AND "worker_id"=${workerId} LIMIT 1
    `);
    if (!existing[0]) throw new NotFoundException('Outreach record not found');
    if (existing[0].status === input.status && input.notes === undefined && input.outcome === undefined && input.nextFollowUpAt === undefined) {
      throw new BadRequestException('No outreach changes supplied');
    }
    const eventId = randomUUID();
    const nextFollowUpSql = input.nextFollowUpAt === undefined ? Prisma.sql`"next_follow_up_at"` : input.nextFollowUpAt ? Prisma.sql`${new Date(input.nextFollowUpAt)}` : Prisma.sql`NULL`;
    const updated = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "job_worker_outreach" SET "status"=${input.status}, "next_follow_up_at"=${nextFollowUpSql},
        "outcome"=${input.outcome ?? null}, "notes"=${input.notes ?? null}, "updated_at"=CURRENT_TIMESTAMP
      WHERE "id"=${existing[0].id}
      RETURNING "id" AS "outreachId", "status", "next_follow_up_at" AS "nextFollowUpAt", "outcome", "notes"
    `);
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "job_worker_outreach_events" ("id","outreach_id","employer_id","job_id","worker_id","channel","event_type","outcome","notes")
      VALUES (${eventId},${existing[0].id},${employer.id},${job.id},${workerId},${existing[0].lastChannel ?? 'PHONE'},'STATUS_CHANGE',${input.outcome ?? input.status},${input.notes ?? null})
    `);
    return { success: true, previousStatus: existing[0].status, ...updated[0], eventId, terminal: TERMINAL_STATUSES.includes(input.status) };
  }

  async scheduleFollowUp(userId: string, jobId: string, workerId: string, nextFollowUpAt: string, notes?: string) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    this.validateDate(nextFollowUpAt);
    if (new Date(nextFollowUpAt).getTime() <= Date.now()) throw new BadRequestException('nextFollowUpAt must be in the future');
    await this.assertCandidate(employer.id, job.id, workerId);
    const existing = await this.prisma.$queryRaw<Array<{ id: string; status: OutreachStatus; lastChannel: OutreachChannel | null }>>(Prisma.sql`
      SELECT "id", "status", "last_channel" AS "lastChannel" FROM "job_worker_outreach"
      WHERE "employer_id"=${employer.id} AND "job_id"=${job.id} AND "worker_id"=${workerId} LIMIT 1
    `);
    if (!existing[0]) throw new NotFoundException('Outreach record not found');
    if (TERMINAL_STATUSES.includes(existing[0].status)) throw new BadRequestException('Cannot schedule follow-up for a closed outreach status');
    const eventId = randomUUID();
    const updated = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "job_worker_outreach" SET "next_follow_up_at"=${new Date(nextFollowUpAt)}, "notes"=COALESCE(${notes ?? null}, "notes"), "updated_at"=CURRENT_TIMESTAMP
      WHERE "id"=${existing[0].id} RETURNING "id" AS "outreachId", "status", "next_follow_up_at" AS "nextFollowUpAt", "notes"
    `);
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "job_worker_outreach_events" ("id","outreach_id","employer_id","job_id","worker_id","channel","event_type","outcome","notes")
      VALUES (${eventId},${existing[0].id},${employer.id},${job.id},${workerId},${existing[0].lastChannel ?? 'PHONE'},'FOLLOW_UP_SCHEDULED','FOLLOW_UP_SCHEDULED',${notes ?? null})
    `);
    return { success: true, ...updated[0], eventId };
  }

  async timeline(userId: string, jobId: string, workerId: string) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT o."id" AS "outreachId", o."status", o."preferred_channel" AS "preferredChannel", o."contact_attempts" AS "contactAttempts",
        o."last_contacted_at" AS "lastContactedAt", o."next_follow_up_at" AS "nextFollowUpAt", o."outcome", o."notes", u."firstName", u."lastName", u."phone", u."email"
      FROM "job_worker_outreach" o JOIN "Worker" w ON w."id"=o."worker_id" JOIN "User" u ON u."id"=w."userId"
      WHERE o."employer_id"=${employer.id} AND o."job_id"=${job.id} AND o."worker_id"=${workerId} LIMIT 1
    `);
    if (!rows[0]) throw new NotFoundException('Outreach record not found');
    const events = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT "id" AS "eventId", "channel", "event_type" AS "eventType", "outcome", "notes", "created_at" AS "createdAt"
      FROM "job_worker_outreach_events" WHERE "outreach_id"=${rows[0].outreachId} AND "employer_id"=${employer.id} ORDER BY "created_at" DESC
    `);
    return { ...rows[0], events };
  }
}
