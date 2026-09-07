import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

export type RecruitmentAction = 'CONTACT_NOW' | 'FOLLOW_UP_NOW' | 'FOLLOW_UP_LATER' | 'REVIEW' | 'STOP_CONTACT';

interface CandidateRow {
  workerId: string;
  matchScore: number | null;
  matchTier: string | null;
  status: string;
  contactAttempts: number;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  outcome: string | null;
  workerCode: string;
  profession: string;
  experienceYears: number | null;
  verificationStatus: string;
  verificationScore: number | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

@Injectable()
export class RecruitmentAutopilotService {
  constructor(private readonly prisma: PrismaService, private readonly jobsService: JobsService) {}

  private async getOwnedJob(userId: string, jobId: string) {
    const employer = await this.jobsService.getEmployer(userId);
    const job = await this.prisma.job.findFirst({ where: { id: jobId, employerId: employer.id }, select: { id: true, title: true, status: true } });
    if (!job) throw new NotFoundException('Job not found');
    return { employer, job };
  }

  private scoreCandidate(candidate: CandidateRow) {
    const now = Date.now();
    const match = Math.max(0, Math.min(100, Number(candidate.matchScore ?? 0)));
    const status = candidate.status || 'NOT_CONTACTED';
    const attempts = Number(candidate.contactAttempts || 0);
    let priority = Math.round(match * 0.6);
    const reasons: string[] = [];

    if (status === 'NOT_CONTACTED') {
      priority += 25;
      reasons.push('Not contacted yet');
    } else if (status === 'INTERESTED' || status === 'INTERVIEW' || status === 'SELECTED') {
      priority += 25;
      reasons.push(`Candidate is ${status.toLowerCase().replace('_', ' ')}`);
    } else if (status === 'NO_RESPONSE' || status === 'CONTACTED') {
      priority += 10;
      reasons.push('Requires another outreach attempt');
    }

    if (candidate.nextFollowUpAt && candidate.nextFollowUpAt.getTime() <= now && !['HIRED', 'NOT_INTERESTED', 'WRONG_NUMBER'].includes(status)) {
      priority += 30;
      reasons.push('Follow-up is due');
    } else if (candidate.nextFollowUpAt && candidate.nextFollowUpAt.getTime() > now) {
      priority += 5;
      reasons.push('Follow-up already scheduled');
    }

    if (candidate.verificationStatus === 'VERIFIED') {
      priority += 8;
      reasons.push('Worker is verified');
    }
    if (Number(candidate.verificationScore ?? 0) >= 80) {
      priority += 5;
      reasons.push('Strong verification score');
    }
    if (attempts >= 3 && ['NO_RESPONSE', 'CONTACTED'].includes(status)) {
      priority -= 20;
      reasons.push('Multiple unsuccessful contact attempts');
    }

    priority = Math.max(0, Math.min(100, priority));
    let action: RecruitmentAction = 'REVIEW';
    if (['HIRED', 'NOT_INTERESTED', 'WRONG_NUMBER'].includes(status)) action = 'STOP_CONTACT';
    else if (candidate.nextFollowUpAt && candidate.nextFollowUpAt.getTime() <= now) action = 'FOLLOW_UP_NOW';
    else if (status === 'NOT_CONTACTED' && match >= 75) action = 'CONTACT_NOW';
    else if (candidate.nextFollowUpAt) action = 'FOLLOW_UP_LATER';
    else if (match >= 60) action = 'CONTACT_NOW';

    if (reasons.length === 0) reasons.push('Candidate needs review');
    return { priorityScore: priority, action, reasons };
  }

  async recommendations(userId: string, jobId: string, limit = 20) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const rows = await this.prisma.$queryRaw<CandidateRow[]>(Prisma.sql`
      SELECT a."worker_id" AS "workerId", a."match_score" AS "matchScore", a."match_tier" AS "matchTier",
        COALESCE(o."status", 'NOT_CONTACTED') AS "status", COALESCE(o."contact_attempts", 0) AS "contactAttempts",
        o."last_contacted_at" AS "lastContactedAt", o."next_follow_up_at" AS "nextFollowUpAt", o."outcome",
        w."workerCode", w."profession", w."experienceYears", w."verificationStatus", w."verificationScore",
        u."firstName", u."lastName", u."phone", u."email"
      FROM "job_worker_actions" a
      JOIN "Worker" w ON w."id"=a."worker_id"
      JOIN "User" u ON u."id"=w."userId"
      LEFT JOIN "job_worker_outreach" o ON o."job_id"=a."job_id" AND o."worker_id"=a."worker_id"
      WHERE a."employer_id"=${employer.id} AND a."job_id"=${job.id}
        AND a."action_type"='SHORTLISTED'
      ORDER BY a."match_score" DESC NULLS LAST, a."created_at" DESC
      LIMIT 500
    `);

    const recommendations = rows.map((candidate) => {
      const decision = this.scoreCandidate(candidate);
      return {
        workerId: candidate.workerId,
        workerCode: candidate.workerCode,
        name: `${candidate.firstName} ${candidate.lastName}`.trim(),
        profession: candidate.profession,
        experienceYears: candidate.experienceYears,
        phone: candidate.phone,
        email: candidate.email,
        matchScore: candidate.matchScore,
        matchTier: candidate.matchTier,
        verificationStatus: candidate.verificationStatus,
        verificationScore: candidate.verificationScore,
        outreach: {
          status: candidate.status,
          contactAttempts: candidate.contactAttempts,
          lastContactedAt: candidate.lastContactedAt,
          nextFollowUpAt: candidate.nextFollowUpAt,
          outcome: candidate.outcome,
        },
        ...decision,
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore || Number(b.matchScore ?? 0) - Number(a.matchScore ?? 0));

    return {
      success: true,
      mode: 'AI_RECRUITMENT_AUTOPILOT',
      job: { id: job.id, title: job.title },
      recommendations: recommendations.slice(0, safeLimit),
      summary: {
        candidatesEvaluated: rows.length,
        contactNow: recommendations.filter((r) => r.action === 'CONTACT_NOW').length,
        followUpNow: recommendations.filter((r) => r.action === 'FOLLOW_UP_NOW').length,
        followUpLater: recommendations.filter((r) => r.action === 'FOLLOW_UP_LATER').length,
        review: recommendations.filter((r) => r.action === 'REVIEW').length,
        stopContact: recommendations.filter((r) => r.action === 'STOP_CONTACT').length,
      },
    };
  }

  async nextAction(userId: string, jobId: string) {
    const result = await this.recommendations(userId, jobId, 50);
    const candidate = result.recommendations.find((item) => item.action !== 'STOP_CONTACT');
    return { success: true, job: result.job, nextAction: candidate ?? null, generatedFrom: 'match_score + outreach_status + follow_up + verification + contact_history' };
  }
}
