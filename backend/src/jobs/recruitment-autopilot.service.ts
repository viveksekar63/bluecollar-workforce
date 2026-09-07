import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

export type RecruitmentAction = 'CONTACT_NOW' | 'FOLLOW_UP_NOW' | 'FOLLOW_UP_LATER' | 'REVIEW' | 'STOP_CONTACT';
export type ConversionBand = 'HIGH' | 'MEDIUM' | 'LOW';

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
  positiveEvents: number;
  noResponseEvents: number;
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

    if (status === 'NOT_CONTACTED') { priority += 25; reasons.push('Not contacted yet'); }
    else if (['INTERESTED', 'INTERVIEW', 'SELECTED'].includes(status)) { priority += 25; reasons.push(`Candidate is ${status.toLowerCase().replace('_', ' ')}`); }
    else if (['NO_RESPONSE', 'CONTACTED'].includes(status)) { priority += 10; reasons.push('Requires another outreach attempt'); }

    if (candidate.nextFollowUpAt && candidate.nextFollowUpAt.getTime() <= now && !['HIRED', 'NOT_INTERESTED', 'WRONG_NUMBER'].includes(status)) { priority += 30; reasons.push('Follow-up is due'); }
    else if (candidate.nextFollowUpAt && candidate.nextFollowUpAt.getTime() > now) { priority += 5; reasons.push('Follow-up already scheduled'); }
    if (candidate.verificationStatus === 'VERIFIED') { priority += 8; reasons.push('Worker is verified'); }
    if (Number(candidate.verificationScore ?? 0) >= 80) { priority += 5; reasons.push('Strong verification score'); }
    if (attempts >= 3 && ['NO_RESPONSE', 'CONTACTED'].includes(status)) { priority -= 20; reasons.push('Multiple unsuccessful contact attempts'); }

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

  private conversionIntelligence(candidate: CandidateRow) {
    const status = candidate.status || 'NOT_CONTACTED';
    if (status === 'HIRED') return { conversionScore: 100, conversionBand: 'HIGH' as ConversionBand, conversionReasons: ['Already hired'] };
    if (['NOT_INTERESTED', 'WRONG_NUMBER'].includes(status)) return { conversionScore: 0, conversionBand: 'LOW' as ConversionBand, conversionReasons: ['Outreach should stop'] };

    let score = Math.round(Math.max(0, Math.min(100, Number(candidate.matchScore ?? 0))) * 0.5);
    const reasons: string[] = [];
    if (['INTERESTED', 'INTERVIEW', 'SELECTED'].includes(status)) { score += 30; reasons.push(`Positive pipeline status: ${status}`); }
    else if (status === 'CONTACTED') { score += 12; reasons.push('Previously contacted'); }
    else if (status === 'NO_RESPONSE') { score -= 5; reasons.push('No response so far'); }
    if (candidate.positiveEvents > 0) { score += Math.min(15, candidate.positiveEvents * 5); reasons.push('Positive outreach history'); }
    if (candidate.noResponseEvents >= 2) { score -= Math.min(20, candidate.noResponseEvents * 3); reasons.push('Repeated no-response history'); }
    if (candidate.verificationStatus === 'VERIFIED') { score += 5; reasons.push('Verified worker'); }
    if (Number(candidate.verificationScore ?? 0) >= 80) { score += 5; reasons.push('Strong verification score'); }
    if (candidate.nextFollowUpAt && candidate.nextFollowUpAt.getTime() <= Date.now()) { score += 8; reasons.push('Follow-up is actionable now'); }
    score = Math.max(0, Math.min(100, score));
    const conversionBand: ConversionBand = score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';
    if (reasons.length === 0) reasons.push('Insufficient engagement history');
    return { conversionScore: score, conversionBand, conversionReasons: reasons };
  }

  private async loadCandidates(employerId: string, jobId: string) {
    return this.prisma.$queryRaw<CandidateRow[]>(Prisma.sql`
      SELECT a."worker_id" AS "workerId", a."match_score" AS "matchScore", a."match_tier" AS "matchTier",
        COALESCE(o."status", 'NOT_CONTACTED') AS "status", COALESCE(o."contact_attempts", 0) AS "contactAttempts",
        o."last_contacted_at" AS "lastContactedAt", o."next_follow_up_at" AS "nextFollowUpAt", o."outcome",
        w."workerCode", w."profession", w."experienceYears", w."verificationStatus", w."verificationScore",
        u."firstName", u."lastName", u."phone", u."email",
        (SELECT COUNT(*)::int FROM "job_worker_outreach_events" e WHERE e."job_id"=a."job_id" AND e."worker_id"=a."worker_id"
          AND e."employer_id"=a."employer_id" AND e."event_type"='STATUS_CHANGE' AND e."outcome" IN ('INTERESTED','INTERVIEW','SELECTED','HIRED')) AS "positiveEvents",
        (SELECT COUNT(*)::int FROM "job_worker_outreach_events" e WHERE e."job_id"=a."job_id" AND e."worker_id"=a."worker_id"
          AND e."employer_id"=a."employer_id" AND e."event_type"='CONTACT_ATTEMPT' AND e."outcome"='NO_RESPONSE') AS "noResponseEvents"
      FROM "job_worker_actions" a JOIN "Worker" w ON w."id"=a."worker_id" JOIN "User" u ON u."id"=w."userId"
      LEFT JOIN "job_worker_outreach" o ON o."job_id"=a."job_id" AND o."worker_id"=a."worker_id"
      WHERE a."employer_id"=${employerId} AND a."job_id"=${jobId} AND a."action_type"='SHORTLISTED'
      ORDER BY a."match_score" DESC NULLS LAST, a."created_at" DESC LIMIT 500
    `);
  }

  private present(candidate: CandidateRow) {
    return {
      workerId: candidate.workerId, workerCode: candidate.workerCode, name: `${candidate.firstName} ${candidate.lastName}`.trim(),
      profession: candidate.profession, experienceYears: candidate.experienceYears, phone: candidate.phone, email: candidate.email,
      matchScore: candidate.matchScore, matchTier: candidate.matchTier, verificationStatus: candidate.verificationStatus, verificationScore: candidate.verificationScore,
      outreach: { status: candidate.status, contactAttempts: candidate.contactAttempts, lastContactedAt: candidate.lastContactedAt, nextFollowUpAt: candidate.nextFollowUpAt, outcome: candidate.outcome },
    };
  }

  async recommendations(userId: string, jobId: string, limit = 20) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const rows = await this.loadCandidates(employer.id, job.id);
    const recommendations = rows.map((candidate) => ({ ...this.present(candidate), ...this.scoreCandidate(candidate), ...this.conversionIntelligence(candidate) }))
      .sort((a, b) => b.priorityScore - a.priorityScore || b.conversionScore - a.conversionScore || Number(b.matchScore ?? 0) - Number(a.matchScore ?? 0));
    return {
      success: true, mode: 'AI_RECRUITMENT_AUTOPILOT', job: { id: job.id, title: job.title }, recommendations: recommendations.slice(0, safeLimit),
      summary: {
        candidatesEvaluated: rows.length,
        contactNow: recommendations.filter((r) => r.action === 'CONTACT_NOW').length,
        followUpNow: recommendations.filter((r) => r.action === 'FOLLOW_UP_NOW').length,
        followUpLater: recommendations.filter((r) => r.action === 'FOLLOW_UP_LATER').length,
        highConversion: recommendations.filter((r) => r.conversionBand === 'HIGH').length,
        mediumConversion: recommendations.filter((r) => r.conversionBand === 'MEDIUM').length,
        lowConversion: recommendations.filter((r) => r.conversionBand === 'LOW').length,
        stopContact: recommendations.filter((r) => r.action === 'STOP_CONTACT').length,
      },
    };
  }

  async conversionRecommendations(userId: string, jobId: string, limit = 20) {
    const { employer, job } = await this.getOwnedJob(userId, jobId);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const rows = await this.loadCandidates(employer.id, job.id);
    const recommendations = rows.map((candidate) => ({ ...this.present(candidate), ...this.conversionIntelligence(candidate), ...this.scoreCandidate(candidate) }))
      .sort((a, b) => b.conversionScore - a.conversionScore || b.priorityScore - a.priorityScore);
    return { success: true, mode: 'AI_CONVERSION_INTELLIGENCE', job: { id: job.id, title: job.title }, recommendations: recommendations.slice(0, safeLimit), summary: { candidatesEvaluated: rows.length, highConversion: recommendations.filter((r) => r.conversionBand === 'HIGH').length, mediumConversion: recommendations.filter((r) => r.conversionBand === 'MEDIUM').length, lowConversion: recommendations.filter((r) => r.conversionBand === 'LOW').length } };
  }

  async nextAction(userId: string, jobId: string) {
    const result = await this.recommendations(userId, jobId, 50);
    const candidate = result.recommendations.find((item) => item.action !== 'STOP_CONTACT');
    return { success: true, job: result.job, nextAction: candidate ?? null, generatedFrom: 'match_score + outreach_status + follow_up + verification + contact_history + conversion_intelligence' };
  }
}
