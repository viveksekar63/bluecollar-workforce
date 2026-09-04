import { Injectable } from '@nestjs/common';
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

    const discoveryQuery: WorkersQueryDto = {
      profession: normalized.profession?.name,
      professionCategory: normalized.professionCategory?.name,
      city: normalized.location?.type === 'CITY' ? normalized.location.name : undefined,
      district: normalized.location?.type === 'DISTRICT' ? normalized.location.name : undefined,
      state: normalized.location?.type === 'STATE' ? normalized.location.name : undefined,
      skill: normalized.skills[0]?.name,
      language: normalized.languages[0]?.name,
      availability: this.toAvailabilityFilter(normalized.availability),
      mobility: normalized.mobility ?? undefined,
      minimumExperienceYears: normalized.minimumExperienceYears ?? undefined,
      page: 1,
      limit: Math.min(Math.max(normalized.workerCount ?? 20, 1), 100),
    };

    const results = await this.discovery.findAll(discoveryQuery);

    return {
      status: 'MATCHED' as const,
      query,
      requirement: parsed,
      normalizedRequirement: normalized,
      results,
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
