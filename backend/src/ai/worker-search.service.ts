import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployerWorkerDiscoveryService } from '../workers/employer-worker-discovery.service';
import { WorkersQueryDto } from '../workers/dto/workers-query.dto';
import { RequirementParserService } from './requirement-parser.service';
import { WorkerRequirementNormalizerService } from './worker-requirement-normalizer.service';

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

    const normalized = await this.normalizer.normalize(parsed);

    // The existing discovery service remains the source of deterministic
    // profession/location/skill/availability matching. We fetch a candidate
    // pool first, then apply the additional AI-normalized constraints that are
    // not yet part of its legacy query contract.
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

    const requestedCount = Math.min(Math.max(normalized.workerCount ?? 20, 1), 100);
    items = items.slice(0, requestedCount);

    return {
      status: 'MATCHED' as const,
      query,
      requirement: parsed,
      normalizedRequirement: normalized,
      results: {
        items,
        page: 1,
        limit: requestedCount,
        total: items.length,
        totalPages: items.length ? 1 : 0,
        candidateTotal: candidateResults.total,
      },
    };
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
