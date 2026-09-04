import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployerWorkerDiscoveryService } from '../workers/employer-worker-discovery.service';
import { WorkersQueryDto } from '../workers/dto/workers-query.dto';
import { RequirementParserService } from './requirement-parser.service';
import {
  MasterDataNotFoundError,
  WorkerRequirementNormalizerService,
} from './worker-requirement-normalizer.service';

export interface MatchBreakdown {
  profession: number;
  skills: number;
  location: number;
  experience: number;
  availability: number;
  verified: number;
  verificationScore: number;
}

export interface MatchSkillDetail {
  required: string;
  matched: boolean;
}

export interface MatchLanguageDetail {
  required: string;
  matched: boolean;
}

@Injectable()
export class WorkerSearchService {
  constructor(
    private readonly parser: RequirementParserService,
    private readonly normalizer: WorkerRequirementNormalizerService,
    private readonly discovery: EmployerWorkerDiscoveryService,
    private readonly prisma: PrismaService,
  ) {}

  async search(query: string) {
    const parsed = await this.parser.parse(query);

    if (parsed.clarificationRequired) {
      return {
        status: 'CLARIFICATION_REQUIRED' as const,
        query,
        requirement: parsed,
        results: null,
      };
    }

    let normalized;

    try {
      normalized = await this.normalizer.normalize(parsed);
    } catch (error) {
      if (error instanceof MasterDataNotFoundError) {
        return {
          status: 'MASTER_DATA_NOT_FOUND' as const,
          query,
          requirement: parsed,
          results: null,
          missingMasterData: [
            {
              type: error.masterType,
              value: error.value,
            },
          ],
        };
      }

      throw error;
    }

    const discoveryQuery: WorkersQueryDto = {
      profession: normalized.profession?.name ?? undefined,
      professionCategory: normalized.professionCategory?.name ?? undefined,
      city: normalized.location?.type === 'CITY' ? normalized.location.name : undefined,
      district: normalized.location?.type === 'DISTRICT' ? normalized.location.name : undefined,
      state: normalized.location?.type === 'STATE' ? normalized.location.name : undefined,
      skill: normalized.skills[0]?.name,
      availability: this.toAvailabilityFilter(normalized.availability),
      mobility: normalized.mobility ?? undefined,
      page: 1,
      limit: 100,
    };

    const candidateResults = await this.discovery.findAll(discoveryQuery);
    let items = candidateResults.items;

    if (normalized.minimumExperienceYears !== null) {
      items = items.filter(
        (worker) => worker.experienceYears >= normalized.minimumExperienceYears!,
      );
    }

    const languageIds = normalized.languages.map((language) => language.id);
    const languageRows = languageIds.length
      ? await this.prisma.$queryRaw<Array<{ workerId: string; languageId: string; languageName: string }>>`
          SELECT DISTINCT wl."workerId", wl."languageId", l."name" AS "languageName"
          FROM "WorkerLanguage" wl
          INNER JOIN "Language" l ON l.id = wl."languageId"
          WHERE wl."languageId" IN (${Prisma.join(languageIds)})`
      : [];

    const languagesByWorker = new Map<string, Set<string>>();
    for (const row of languageRows) {
      if (!languagesByWorker.has(row.workerId)) languagesByWorker.set(row.workerId, new Set());
      languagesByWorker.get(row.workerId)!.add(row.languageId);
    }

    // A worker must speak every explicitly requested language to remain an eligible result.
    if (normalized.languages.length) {
      items = items.filter((worker) => {
        const workerLanguages = languagesByWorker.get(worker.id) ?? new Set<string>();
        return normalized.languages.every((language) => workerLanguages.has(language.id));
      });
    }

    const workerSkillRows = normalized.skills.length
      ? await this.prisma.$queryRaw<Array<{ workerId: string; skillId: string; skillName: string }>>`
          SELECT DISTINCT ws."workerId", ws."skillId", s."name" AS "skillName"
          FROM "WorkerSkill" ws
          INNER JOIN "Skill" s ON s.id = ws."skillId"
          WHERE ws."skillId" IN (${Prisma.join(normalized.skills.map((skill) => skill.id))})`
      : [];

    const skillsByWorker = new Map<string, Set<string>>();
    for (const row of workerSkillRows) {
      if (!skillsByWorker.has(row.workerId)) skillsByWorker.set(row.workerId, new Set());
      skillsByWorker.get(row.workerId)!.add(row.skillId);
    }

    const scoredItems = items
      .map((worker) => {
        const match = this.calculateMatchScore(
          worker,
          normalized,
          skillsByWorker.get(worker.id) ?? new Set<string>(),
          languagesByWorker.get(worker.id) ?? new Set<string>(),
        );
        return {
          ...worker,
          matchScore: match.score,
          matchBreakdown: match.breakdown,
          matchReasons: match.reasons,
          matchDetails: {
            skills: match.skillDetails,
            languages: match.languageDetails,
          },
        };
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if (b.verificationScore !== a.verificationScore) {
          return b.verificationScore - a.verificationScore;
        }
        return b.experienceYears - a.experienceYears;
      });

    const requestedCount = Math.min(Math.max(normalized.workerCount ?? 20, 1), 100);
    const selectedItems = scoredItems.slice(0, requestedCount);

    return {
      status: 'MATCHED' as const,
      query,
      requirement: parsed,
      normalizedRequirement: normalized,
      results: {
        items: selectedItems,
        page: 1,
        limit: requestedCount,
        total: scoredItems.length,
        totalPages: scoredItems.length ? 1 : 0,
        candidateTotal: candidateResults.total,
      },
    };
  }

  private calculateMatchScore(
    worker: any,
    normalized: any,
    matchedSkillIds: Set<string>,
    matchedLanguageIds: Set<string>,
  ) {
    const breakdown: MatchBreakdown = {
      profession: 0,
      skills: 0,
      location: 0,
      experience: 0,
      availability: 0,
      verified: 0,
      verificationScore: 0,
    };

    const reasons: string[] = [];

    if (
      normalized.profession?.name &&
      worker.profession?.trim().toLowerCase() === normalized.profession.name.trim().toLowerCase()
    ) {
      breakdown.profession = 30;
      reasons.push(`Exact profession match: ${worker.profession}`);
    }

    const skillDetails: MatchSkillDetail[] = normalized.skills.map((skill: any) => ({
      required: skill.name,
      matched: matchedSkillIds.has(skill.id),
    }));

    if (normalized.skills.length === 0) {
      // No skill requirement means the criterion is not applicable. Keep the
      // 100-point model normalized by treating the available 25 points as satisfied.
      breakdown.skills = 25;
      reasons.push('No specific skill requested');
    } else {
      const matchedCount = skillDetails.filter((skill) => skill.matched).length;
      breakdown.skills = Math.round((matchedCount / normalized.skills.length) * 25 * 100) / 100;
      if (matchedCount === normalized.skills.length) {
        reasons.push(`All ${matchedCount} required skills matched`);
      } else if (matchedCount > 0) {
        reasons.push(`${matchedCount} of ${normalized.skills.length} required skills matched`);
      } else {
        reasons.push('No required skills matched');
      }
    }

    if (normalized.location?.name) {
      const requested = normalized.location.name.trim().toLowerCase();
      const city = worker.city?.trim().toLowerCase();
      const district = worker.district?.trim().toLowerCase();
      const state = worker.state?.trim().toLowerCase();

      if (city === requested || district === requested || state === requested) {
        breakdown.location = 20;
        reasons.push(`Exact location match: ${worker.city}`);
      } else if (worker.mobility === 'ANYWHERE_INDIA') {
        breakdown.location = 10;
        reasons.push('Broader mobility: Anywhere India');
      }
    }

    if (
      normalized.minimumExperienceYears === null ||
      worker.experienceYears >= normalized.minimumExperienceYears
    ) {
      breakdown.experience = 10;
      reasons.push(
        normalized.minimumExperienceYears === null
          ? `${worker.experienceYears} years experience`
          : `${worker.experienceYears} years experience meets minimum ${normalized.minimumExperienceYears}`,
      );
    }

    if (
      normalized.availability === null ||
      (normalized.availability === 'IMMEDIATE' && worker.availability === 'AVAILABLE') ||
      normalized.availability === worker.availability
    ) {
      breakdown.availability = 5;
      if (worker.availability === 'AVAILABLE') reasons.push('Currently available');
    }

    if (worker.verificationStatus === 'VERIFIED') {
      breakdown.verified = 5;
      reasons.push('Identity/background verification completed');
    }

    if (worker.verificationScore > 0) {
      breakdown.verificationScore = Math.min(5, Math.round(worker.verificationScore / 20));
    }

    const languageDetails: MatchLanguageDetail[] = normalized.languages.map((language: any) => ({
      required: language.name,
      matched: matchedLanguageIds.has(language.id),
    }));

    if (normalized.languages.length) {
      const matchedCount = languageDetails.filter((language) => language.matched).length;
      if (matchedCount === normalized.languages.length) {
        reasons.push(`All ${matchedCount} required languages matched`);
      }
    }

    const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    return { score, breakdown, reasons, skillDetails, languageDetails };
  }

  private toAvailabilityFilter(value: string | null) {
    switch (value) {
      case 'IMMEDIATE':
      case 'AVAILABLE':
        return 'AVAILABLE';
      default:
        return undefined;
    }
  }
}
