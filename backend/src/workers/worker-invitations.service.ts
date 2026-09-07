import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type WorkerInvitationResponse = 'ACCEPT' | 'DECLINE';

@Injectable()
export class WorkerInvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getWorker(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');
    return worker;
  }

  async list(userId: string, page = 1, limit = 20) {
    const worker = await this.getWorker(userId);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        SELECT
          a."id" AS "invitationId", a."job_id" AS "jobId",
          a."match_score" AS "matchScore", a."match_tier" AS "matchTier",
          a."match_explanation" AS "matchExplanation",
          a."invited_at" AS "invitedAt", a."response_status" AS "responseStatus",
          a."responded_at" AS "respondedAt",
          j."title" AS "jobTitle", j."city", j."district", j."state",
          j."salaryMin", j."salaryMax", j."salaryType", j."startDate",
          e."id" AS "employerId", e."companyName"
        FROM "job_worker_actions" a
        JOIN "Job" j ON j."id" = a."job_id"
        JOIN "Employer" e ON e."id" = a."employer_id"
        WHERE a."worker_id" = ${worker.id} AND a."action_type" = 'INVITED'
        ORDER BY a."invited_at" DESC NULLS LAST, a."created_at" DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "total"
        FROM "job_worker_actions"
        WHERE "worker_id" = ${worker.id} AND "action_type" = 'INVITED'
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
        hasNext: safePage * safeLimit < total,
        hasPrevious: safePage > 1,
      },
    };
  }

  async respond(userId: string, invitationId: string, response: WorkerInvitationResponse) {
    if (response !== 'ACCEPT' && response !== 'DECLINE') {
      throw new BadRequestException('response must be ACCEPT or DECLINE');
    }

    const worker = await this.getWorker(userId);
    const result = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "job_worker_actions"
      SET "response_status" = ${response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'},
          "responded_at" = CURRENT_TIMESTAMP,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${invitationId}
        AND "worker_id" = ${worker.id}
        AND "action_type" = 'INVITED'
        AND ("response_status" IS NULL OR "response_status" = 'PENDING')
      RETURNING "id" AS "invitationId", "job_id" AS "jobId", "worker_id" AS "workerId",
        "response_status" AS "responseStatus", "responded_at" AS "respondedAt"
    `);

    if (!result[0]) {
      const existing = await this.prisma.$queryRaw<Array<{ id: string; response_status: string | null }>>(Prisma.sql`
        SELECT "id", "response_status"
        FROM "job_worker_actions"
        WHERE "id" = ${invitationId} AND "worker_id" = ${worker.id} AND "action_type" = 'INVITED'
        LIMIT 1
      `);
      if (!existing[0]) throw new NotFoundException('Invitation not found');
      throw new BadRequestException('Invitation has already been responded to');
    }

    return { success: true, ...result[0] };
  }
}
