import { Injectable } from '@nestjs/common';
import { EmployerWorkerDiscoveryService } from '../workers/employer-worker-discovery.service';
import { WorkersQueryDto } from '../workers/dto/workers-query.dto';
import { RequirementParserService } from './requirement-parser.service';
import {
  MasterDataNotFoundError,
  WorkerRequirementNormalizerService,
} from './worker-requirement-normalizer.service';

export interface MatchBreakdown { profession: number; skills: number; location: number; experience: number; availability: number; verified: number; verificationScore: number; }
export interface MatchSkillDetail { required: string; matched: boolean; }
export interface MatchLanguageDetail { required: string; matched: boolean; }

@Injectable()
export class WorkerSearchService {
  constructor(
    private readonly parser: RequirementParserService,
    private readonly normalizer: WorkerRequirementNormalizerService,
    private readonly discovery: EmployerWorkerDiscoveryService,
  ) {}

  async search(query: string) {
    const parsed = await this.parser.parse(query);
    if (parsed.clarificationRequired) return { status: 'CLARIFICATION_REQUIRED' as const, query, requirement: parsed, results: null };

    let normalized;
    try {
      normalized = await this.normalizer.normalize(parsed);
    } catch (error) {
      if (error instanceof MasterDataNotFoundError) {
        return { status: 'MASTER_DATA_NOT_FOUND' as const, query, requirement: parsed, results: null, missingMasterData: [{ type: error.masterType, value: error.value }] };
      }
      throw error;
    }

    const requestedCount = Math.min(Math.max(normalized.workerCount ?? 20, 1), 100);
    const discoveryQuery: WorkersQueryDto = {
      profession: normalized.profession?.name ?? undefined,
      professionCategory: normalized.professionCategory?.name ?? undefined,
      city: normalized.location?.type === 'CITY' ? normalized.location.name : undefined,
      district: normalized.location?.type === 'DISTRICT' ? normalized.location.name : undefined,
      state: normalized.location?.type === 'STATE' ? normalized.location.name : undefined,
      skill: undefined,
      skillIds: normalized.skills.map((skill) => skill.id),
      languages: normalized.languages.map((language) => language.name).join(','),
      minimumExperienceYears: normalized.minimumExperienceYears ?? undefined,
      availability: this.toAvailabilityFilter(normalized.availability),
      mobility: normalized.mobility ?? undefined,
      page: 1,
      limit: 100,
    };

    const candidateResults = await this.discovery.findAll(discoveryQuery);
    const scoredItems = candidateResults.items.map((worker) => {
      const match = this.calculateMatchScore(worker, normalized);
      return { ...worker, matchScore: match.score, matchBreakdown: match.breakdown, matchReasons: match.reasons, matchDetails: { skills: match.skillDetails, languages: match.languageDetails } };
    }).sort((a, b) => b.matchScore - a.matchScore || b.verificationScore - a.verificationScore || b.experienceYears - a.experienceYears || a.id.localeCompare(b.id));

    const selectedItems = scoredItems.slice(0, requestedCount);
    return {
      status: 'MATCHED' as const,
      query,
      requirement: parsed,
      normalizedRequirement: normalized,
      results: { items: selectedItems, page: 1, limit: requestedCount, total: scoredItems.length, totalPages: scoredItems.length ? 1 : 0, candidateTotal: candidateResults.total },
    };
  }

  private calculateMatchScore(worker: any, normalized: any) {
    const breakdown: MatchBreakdown = { profession: 0, skills: 0, location: 0, experience: 0, availability: 0, verified: 0, verificationScore: 0 };
    const reasons: string[] = [];

    if (normalized.profession?.name && worker.profession?.trim().toLowerCase() === normalized.profession.name.trim().toLowerCase()) {
      breakdown.profession = 30;
      reasons.push(`Exact profession match: ${worker.profession}`);
    }

    const workerSkills = new Set<string>((Array.isArray(worker.skills) ? worker.skills : []).map((skill: unknown) => String(skill).trim().toLowerCase()).filter(Boolean));
    const skillDetails: MatchSkillDetail[] = normalized.skills.map((skill: any) => ({ required: skill.name, matched: workerSkills.has(skill.name.trim().toLowerCase()) }));
    if (normalized.skills.length === 0) {
      breakdown.skills = 25;
      reasons.push('No specific skill requested');
    } else {
      const matchedCount = skillDetails.filter((skill) => skill.matched).length;
      breakdown.skills = Math.round((matchedCount / normalized.skills.length) * 25 * 100) / 100;
      if (matchedCount === normalized.skills.length) reasons.push(`All ${matchedCount} required skills matched`);
      else if (matchedCount > 0) reasons.push(`${matchedCount} of ${normalized.skills.length} required skills matched`);
      else reasons.push('No required skills matched');
    }

    if (normalized.location?.name) {
      const requested = normalized.location.name.trim().toLowerCase();
      const city = worker.city?.trim().toLowerCase();
      const district = worker.district?.trim().toLowerCase();
      const state = worker.state?.trim().toLowerCase();
      if (city === requested || district === requested || state === requested) { breakdown.location = 20; reasons.push(`Exact location match: ${worker.city}`); }
      else if (worker.mobility === 'ANYWHERE_INDIA') { breakdown.location = 10; reasons.push('Broader mobility: Anywhere India'); }
    }

    if (normalized.minimumExperienceYears === null || worker.experienceYears >= normalized.minimumExperienceYears) {
      breakdown.experience = 10;
      reasons.push(normalized.minimumExperienceYears === null ? `${worker.experienceYears} years experience` : `${worker.experienceYears} years experience meets minimum ${normalized.minimumExperienceYears}`);
    }

    if (normalized.availability === null || (normalized.availability === 'IMMEDIATE' && worker.availability === 'AVAILABLE') || normalized.availability === worker.availability) {
      breakdown.availability = 5;
      if (worker.availability === 'AVAILABLE') reasons.push('Currently available');
    }

    if (worker.verificationStatus === 'VERIFIED') { breakdown.verified = 5; reasons.push('Identity/background verification completed'); }
    if (worker.verificationScore > 0) breakdown.verificationScore = Math.min(5, Math.round(worker.verificationScore / 20));

    const languageDetails: MatchLanguageDetail[] = normalized.languages.map((language: any) => ({ required: language.name, matched: true }));
    if (languageDetails.length) reasons.push(`All ${languageDetails.length} required languages matched`);

    const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    return { score, breakdown, reasons, skillDetails, languageDetails };
  }

  private toAvailabilityFilter(value: string | null) {
    switch (value) {
      case 'IMMEDIATE':
      case 'AVAILABLE': return 'AVAILABLE';
      default: return undefined;
    }
  }
}
