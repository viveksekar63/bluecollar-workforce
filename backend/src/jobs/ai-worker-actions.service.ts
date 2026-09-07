import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

type MatchTier =
  | 'BEST_MATCH'
  | 'STRONG_MATCH'
  | 'GOOD_MATCH'
  | 'PARTIAL_MATCH'
  | 'NOT_RECOMMENDED';

export interface WorkerActionSnapshot {
  matchScore?: number;
  matchTier?: MatchTier;
  matchExplanation?: Record<string, unknown>;
}

@Injectable()
export class AiWorkerActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  private async assertWorker(workerId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        workerCode: true,
        experienceYears: true,
        profession: true,
        professionCategory: true,
        verificationStatus: true,
        verificationScore: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  private validateSnapshot(snapshot: WorkerActionSnapshot) {
    if (snapshot.matchScore !== undefined &&
      (!Number.isInteger(snapshot.matchScore) || snapshot.matchScore < 0 || snapshot.matchScore > 100)) {
      throw new BadRequestException('matchScore must be an integer between 0 and 100');
    }
  }

  async shortlist(
    userId: string,
    jobId: string,
    workerId: string,
    snapshot: WorkerActionSnapshot = {},
  ) {
    const employer = await this.jobsService.getEmployer(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId: employer.id },
      select: { id: true, title: true, status: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) === 'CLOSED' || String(job.status) === 'CANCELLED') {
      throw new BadRequestException('Cannot shortlist a worker for a closed job');
    }

    await this.assertWorker(workerId);
    this.validateSnapshot(snapshot);

    const rows = await this.prisma.$queryRaw<Array<{ id: string; created_at: Date }>>(Prisma.sql`
      INSERT INTO "job_worker_actions"
        ("employer_id", "job_id", "worker_id", "action_type", "match_score", "match_tier", "match_explanation")
      VALUES
        (${employer.id}, ${jobId}, ${workerId}, 'SHORTLISTED', ${snapshot.matchScore ?? null}, ${snapshot.matchTier ?? null}, ${snapshot.matchExplanation ? JSON.stringify(snapshot.matchExplanation) : null}::jsonb)
      ON CONFLICT ("job_id", "worker_id", "action_type")
      DO UPDATE SET
        "match_score" = EXCLUDED."match_score",
        "match_tier" = EXCLUDED."match_tier",
        "match_explanation" = EXCLUDED."match_explanation",
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id", "created_at"
    `);

    return {
      success: true,
      action: 'SHORTLISTED',
      jobId,
      workerId,
      actionId: rows[0].id,
      shortlistedAt: rows[0].created_at,
      matchScore: snapshot.matchScore ?? null,
      matchTier: snapshot.matchTier ?? null,
      matchExplanation: snapshot.matchExplanation ?? null,
    };
  }

  async listShortlisted(
    userId: string,
    jobId: string,
    page = 1,
    limit = 20,
  ) {
    const employer = await this.jobsService.getEmployer(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId: employer.id },
      select: { id: true },
    });
    if (!job) throw new NotFoundException('Job not found');

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const offset = (safePage - 1) * safeLimit;

    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          a."id" AS "actionId",
          a."worker_id" AS "workerId",
          a."match_score" AS "matchScore",
          a."match_tier" AS "matchTier",
          a."match_explanation" AS "matchExplanation",
          a."created_at" AS "shortlistedAt",
          w."workerCode",
          w."experienceYears",
          w."profession",
          w."professionCategory",
          w."verificationStatus",
          w."verificationScore",
          u."firstName",
          u."lastName",
          u."profilePhotoUrl"
        FROM "job_worker_actions" a
        JOIN "Worker" w ON w."id" = a."worker_id"
        JOIN "User" u ON u."id" = w."userId"
        WHERE a."employer_id" = ${employer.id}
          AND a."job_id" = ${jobId}
          AND a."action_type" = 'SHORTLISTED'
        ORDER BY a."match_score" DESC NULLS LAST, a."created_at" DESC, a."worker_id" ASC
        LIMIT ${safeLimit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "total"
        FROM "job_worker_actions"
        WHERE "employer_id" = ${employer.id}
          AND "job_id" = ${jobId}
          AND "action_type" = 'SHORTLISTED'
      `),
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async removeShortlist(userId: string, jobId: string, workerId: string) {
    const employer = await this.jobsService.getEmployer(userId);
    const result = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM "job_worker_actions"
      WHERE "employer_id" = ${employer.id}
        AND "job_id" = ${jobId}
        AND "worker_id" = ${workerId}
        AND "action_type" = 'SHORTLISTED'
    `);
    if (result === 0) throw new NotFoundException('Shortlisted worker not found');
    return { success: true, action: 'SHORTLIST_REMOVED', jobId, workerId };
  }

  async invite(
    userId: string,
    jobId: string,
    workerId: string,
    snapshot: WorkerActionSnapshot = {},
  ) {
    const employer = await this.jobsService.getEmployer(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId: employer.id },
      select: { id: true, title: true, status: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (String(job.status) !== 'PUBLISHED') {
      throw new BadRequestException('Worker invitations are only allowed for published jobs');
    }

    await this.assertWorker(workerId);
    this.validateSnapshot(snapshot);

    const rows = await this.prisma.$queryRaw<Array<{ id: string; invited_at: Date }>>(Prisma.sql`
      INSERT INTO "job_worker_actions"
        ("employer_id", "job_id", "worker_id", "action_type", "match_score", "match_tier", "match_explanation", "invited_at")
      VALUES
        (${employer.id}, ${jobId}, ${workerId}, 'INVITED', ${snapshot.matchScore ?? null}, ${snapshot.matchTier ?? null}, ${snapshot.matchExplanation ? JSON.stringify(snapshot.matchExplanation) : null}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT ("job_id", "worker_id", "action_type")
      DO UPDATE SET
        "match_score" = EXCLUDED."match_score",
        "match_tier" = EXCLUDED."match_tier",
        "match_explanation" = EXCLUDED."match_explanation",
        "invited_at" = CURRENT_TIMESTAMP,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id", "invited_at"
    `);

    return {
      success: true,
      action: 'INVITED',
      jobId,
      workerId,
      actionId: rows[0].id,
      invitedAt: rows[0].invited_at,
      matchScore: snapshot.matchScore ?? null,
      matchTier: snapshot.matchTier ?? null,
      matchExplanation: snapshot.matchExplanation ?? null,
    };
  }
}
