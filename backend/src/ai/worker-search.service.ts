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

    // The existing discovery service remains responsible for deterministic
    // candidate filtering. The AI layer only supplies normalized requirements.
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

    if (normalized.languages.length) {
      const languageIds = normalized.languages.map((language) => language.id);
      const languageRows = await this.prisma.$queryRaw<Array<{ workerId: string }>>`
        SELECT DISTINCT "workerId"
        FROM "WorkerLanguage"
        WHERE "languageId" IN (${Prisma.join(languageIds)})`;
      const languageWorkerIds = new Set(languageRows.map((row) => row.workerId));
      items = items.filter((worker) => languageWorkerIds.has(worker.id));
    }

    const scoredItems = items
      .map((worker) => {
        const match = this.calculateMatchScore(worker, normalized);
        return {
          ...worker,
          matchScore: match.score,
          matchBreakdown: match.breakdown,
          matchReasons: match.reasons,
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

  private calculateMatchScore(worker: any, normalized: any) {
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

    // 30 points: exact normalized profession match.
    if (
      normalized.profession?.name &&
      worker.profession?.trim().toLowerCase() === normalized.profession.name.trim().toLowerCase()
    ) {
      breakdown.profession = 30;
      reasons.push(`Exact profession match: ${worker.profession}`);
    }

    // 25 points: all explicitly requested skills must be present.
    // The current discovery contract exposes the primary skill, so one
    // required skill is fully scored today; multi-skill scoring can be added
    // without changing the scoring contract later.
    if (normalized.skills.length === 0) {
      breakdown.skills = 25;
      reasons.push('No specific skill requested');
    } else if (
      normalized.skills.length === 1 &&
      worker.primarySkill?.toLowerCase() === normalized.skills[0].name.toLowerCase()
    ) {
      breakdown.skills = 25;
      reasons.push(`Required skill match: ${worker.primarySkill}`);
    }

    // 20 points: exact requested location. Workers with broader mobility are
    // still eligible through discovery, but receive a lower location score.
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

    // 10 points: minimum experience requirement.
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

    // 5 points: availability requirement.
    if (
      normalized.availability === null ||
      (normalized.availability === 'IMMEDIATE' && worker.availability === 'AVAILABLE') ||
      normalized.availability === worker.availability
    ) {
      breakdown.availability = 5;
      if (worker.availability === 'AVAILABLE') reasons.push('Currently available');
    }

    // 5 points: verified worker.
    if (worker.verificationStatus === 'VERIFIED') {
      breakdown.verified = 5;
      reasons.push('Identity/background verification completed');
    }

    // 5 points: normalized verification score (0-100 -> 0-5).
    if (worker.verificationScore > 0) {
      breakdown.verificationScore = Math.min(5, Math.round(worker.verificationScore / 20));
    }

    const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    return { score, breakdown, reasons };
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
