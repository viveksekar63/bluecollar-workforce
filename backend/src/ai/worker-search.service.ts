import { Injectable } from '@nestjs/common';
import { EmployerWorkerDiscoveryService } from '../workers/employer-worker-discovery.service';
import { WorkersQueryDto } from '../workers/dto/workers-query.dto';
import { RequirementParserService } from './requirement-parser.service';
import { MasterDataNotFoundError, WorkerRequirementNormalizerService } from './worker-requirement-normalizer.service';

export interface MatchBreakdown { profession: number; skills: number; location: number; experience: number; availability: number; verified: number; verificationScore: number; }
export interface MatchSkillDetail { required: string; matched: boolean; experienceYears: number | null; skillLevel: string | null; verified: boolean; }
export interface MatchLanguageDetail { required: string; matched: boolean; }
export type PreferenceMatchStatus = 'MATCHED' | 'PARTIAL' | 'NOT_MATCHED' | 'NOT_REQUESTED' | 'NOT_SPECIFIED' | 'OFFERED';
export interface PreferenceMatch { mobility: PreferenceMatchStatus; relocation: PreferenceMatchStatus; travel: PreferenceMatchStatus; accommodation: PreferenceMatchStatus; }

interface WorkerSearchGeoContext { latitude?: number; longitude?: number; radiusKm?: number; }

@Injectable()
export class WorkerSearchService {
  private static readonly MAX_RANKING_CANDIDATES = 500;

  constructor(private readonly parser: RequirementParserService, private readonly normalizer: WorkerRequirementNormalizerService, private readonly discovery: EmployerWorkerDiscoveryService) {}

  async search(query: string, geo: WorkerSearchGeoContext = {}, pagination: { page?: number; limit?: number } = {}) {
    const parsed = await this.parser.parse(query);
    if (parsed.clarificationRequired) return { status: 'CLARIFICATION_REQUIRED' as const, query, requirement: parsed, results: null };

    let normalized;
    try {
      normalized = await this.normalizer.normalize(parsed);
    } catch (error) {
      if (error instanceof MasterDataNotFoundError) return { status: 'MASTER_DATA_NOT_FOUND' as const, query, requirement: parsed, results: null, missingMasterData: [{ type: error.masterType, value: error.value }] };
      throw error;
    }

    const requestedCount = Math.min(Math.max(normalized.workerCount ?? 20, 1), 100);
    const page = Math.max(pagination.page ?? 1, 1);
    const limit = Math.min(Math.max(pagination.limit ?? requestedCount, 1), 50);
    const rankingOffset = (page - 1) * limit;
    const candidateLimit = Math.min(Math.max(100, rankingOffset + limit, requestedCount), WorkerSearchService.MAX_RANKING_CANDIDATES);

    // A semantic destination is normally a hard discovery filter. When the employer
    // explicitly accepts relocation/travel, however, the destination becomes a soft
    // ranking preference so capable workers from other cities remain eligible.
    const flexibleLocation = normalized.willingToRelocate === true || normalized.willingToTravel === true;
    const discoveryQuery: WorkersQueryDto = {
      profession: normalized.profession?.name ?? undefined,
      professionCategory: normalized.professionCategory?.name ?? undefined,
      city: !flexibleLocation && normalized.location?.type === 'CITY' ? normalized.location.name : undefined,
      district: !flexibleLocation && normalized.location?.type === 'DISTRICT' ? normalized.location.name : undefined,
      state: !flexibleLocation && normalized.location?.type === 'STATE' ? normalized.location.name : undefined,
      skillIds: normalized.skills.map((skill) => skill.id),
      languages: normalized.languages.map((language) => language.name).join(','),
      minimumExperienceYears: normalized.minimumExperienceYears ?? undefined,
      availability: this.toAvailabilityFilter(normalized.availability),
      latitude: geo.latitude, longitude: geo.longitude, radiusKm: geo.radiusKm,
      page: 1, limit: candidateLimit,
    };

    const candidateResults = await this.discovery.findAll(discoveryQuery);
    const scoredItems = candidateResults.items.map((worker) => {
      const match = this.calculateMatchScore(worker, normalized, geo);
      return {
        ...worker,
        matchScore: match.score,
        preferenceScore: match.preferenceScore,
        matchBreakdown: match.breakdown,
        matchReasons: match.reasons,
        matchDetails: { skills: match.skillDetails, languages: match.languageDetails, preferences: match.preferenceMatch, preferenceScore: match.preferenceScore },
        preferenceMatch: match.preferenceMatch,
      };
    }).sort((a, b) => b.matchScore - a.matchScore || b.preferenceScore - a.preferenceScore || b.verificationScore - a.verificationScore || b.experienceYears - a.experienceYears || a.id.localeCompare(b.id));

    const selectedItems = scoredItems.slice(rankingOffset, rankingOffset + limit);
    const total = candidateResults.total;
    const totalPages = total ? Math.ceil(total / limit) : 0;
    return { status: 'MATCHED' as const, query, requirement: parsed, normalizedRequirement: normalized, results: { items: selectedItems, page, limit, total, totalPages, candidateTotal: candidateResults.total, rankingCandidateLimit: candidateResults.items.length, hasNext: page < totalPages } };
  }

  private calculateMatchScore(worker: any, normalized: any, geo: WorkerSearchGeoContext) {
    const breakdown: MatchBreakdown = { profession: 0, skills: 0, location: 0, experience: 0, availability: 0, verified: 0, verificationScore: 0 };
    const reasons: string[] = [];

    if (normalized.profession?.name && worker.profession?.trim().toLowerCase() === normalized.profession.name.trim().toLowerCase()) {
      breakdown.profession = 30;
      reasons.push(`Exact profession match: ${worker.profession}`);
    }

    const workerSkillDetails = Array.isArray(worker.skillDetails) ? worker.skillDetails : [];
    const workerSkillsByName = new Map<string, any>(workerSkillDetails.map((skill: any) => [String(skill.name).trim().toLowerCase(), skill]));
    const skillDetails: MatchSkillDetail[] = normalized.skills.map((required: any) => {
      const matched = workerSkillsByName.get(required.name.trim().toLowerCase());
      return { required: required.name, matched: Boolean(matched), experienceYears: matched?.experienceYears == null ? null : Number(matched.experienceYears), skillLevel: matched?.skillLevel ?? null, verified: Boolean(matched?.verified) };
    });

    if (normalized.skills.length === 0) {
      breakdown.skills = 25;
      reasons.push('No specific skill requested');
    } else {
      const matched = skillDetails.filter((skill) => skill.matched);
      const coverageScore = (matched.length / normalized.skills.length) * 15;
      const levelWeights: Record<string, number> = { BEGINNER: 0.25, INTERMEDIATE: 0.5, ADVANCED: 0.75, EXPERT: 1 };
      const proficiencyScore = matched.length ? (matched.reduce((sum, skill) => sum + (levelWeights[skill.skillLevel ?? 'BEGINNER'] ?? 0.25), 0) / matched.length) * 3 : 0;
      const experienceScore = matched.length ? (matched.reduce((sum, skill) => sum + Math.min(Math.max(skill.experienceYears ?? 0, 0), 10) / 10, 0) / matched.length) * 2 : 0;
      const skillVerificationScore = (matched.filter((skill) => skill.verified).length / normalized.skills.length) * 5;
      breakdown.skills = Math.round((coverageScore + proficiencyScore + experienceScore + skillVerificationScore) * 100) / 100;
      if (matched.length === normalized.skills.length) reasons.push(`All ${matched.length} required skills matched`);
      else if (matched.length > 0) reasons.push(`${matched.length} of ${normalized.skills.length} required skills matched`);
      else reasons.push('No required skills matched');
      const verifiedSkills = matched.filter((skill) => skill.verified).length;
      if (verifiedSkills) reasons.push(`${verifiedSkills} required skill${verifiedSkills === 1 ? '' : 's'} verified`);
      const advancedSkills = matched.filter((skill) => skill.skillLevel === 'ADVANCED' || skill.skillLevel === 'EXPERT').length;
      if (advancedSkills) reasons.push(`${advancedSkills} matched skill${advancedSkills === 1 ? '' : 's'} at advanced/expert level`);
    }

    const locationMatched = this.scoreLocation(worker, normalized, geo, breakdown, reasons);

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

    const preference = this.calculatePreferenceMatch(worker, normalized, geo, locationMatched, reasons);
    const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0) * 100) / 100;
    return { score, breakdown, reasons, skillDetails, languageDetails, preferenceMatch: preference.match, preferenceScore: preference.score };
  }

  private scoreLocation(worker: any, normalized: any, geo: WorkerSearchGeoContext, breakdown: MatchBreakdown, reasons: string[]) {
    if (normalized.location?.name) {
      const requested = normalized.location.name.trim().toLowerCase();
      const city = worker.city?.trim().toLowerCase(); const district = worker.district?.trim().toLowerCase(); const state = worker.state?.trim().toLowerCase();
      const exact = city === requested || district === requested || state === requested;
      if (exact) { breakdown.location = 20; reasons.push(`Exact location match: ${worker.city}`); return true; }
      if (worker.mobility === 'ANYWHERE_INDIA') { breakdown.location = 10; reasons.push('Broader mobility: Anywhere India'); }
      return false;
    }
    if (geo.radiusKm && worker.distanceKm !== null && worker.distanceKm !== undefined) {
      const distance = Number(worker.distanceKm); const radius = geo.radiusKm;
      if (distance <= radius * 0.25) breakdown.location = 20; else if (distance <= radius * 0.5) breakdown.location = 15; else if (distance <= radius * 0.75) breakdown.location = 10; else breakdown.location = 5;
      reasons.push(`${distance.toFixed(1)} km from employer location`);
      return distance <= radius;
    }
    return false;
  }

  private calculatePreferenceMatch(worker: any, normalized: any, geo: WorkerSearchGeoContext, locationMatched: boolean, reasons: string[]) {
    const requestedMobility = normalized.mobility as string | null;
    let mobility: PreferenceMatchStatus = 'NOT_REQUESTED';
    if (requestedMobility) {
      const workerMobility = String(worker.mobility ?? 'LOCAL').toUpperCase();
      const mobilityCompatible = requestedMobility === workerMobility || workerMobility === 'ANYWHERE_INDIA'
        || (requestedMobility === 'WITHIN_RADIUS' && workerMobility === 'WITHIN_STATE')
        || (requestedMobility === 'SPECIFIC_LOCATIONS' && workerMobility === 'WITHIN_STATE');
      mobility = mobilityCompatible ? 'MATCHED' : 'PARTIAL';
      if (mobility === 'MATCHED') reasons.push(`Mobility preference matched: ${workerMobility}`);
      else reasons.push(`Mobility preference differs: requested ${requestedMobility}, worker ${workerMobility}`);
    }

    const relocationRequested = normalized.willingToRelocate === true;
    const travelRequested = normalized.willingToTravel === true;
    const workerRelocates = Boolean(worker.willingToRelocate);
    const workerTravels = Boolean(worker.willingToTravel);
    const relocation = !relocationRequested ? 'NOT_REQUESTED' : workerRelocates || worker.mobility === 'ANYWHERE_INDIA' ? 'MATCHED' : locationMatched ? 'PARTIAL' : 'NOT_MATCHED';
    const travel = !travelRequested ? 'NOT_REQUESTED' : workerTravels || worker.mobility === 'ANYWHERE_INDIA' ? 'MATCHED' : 'NOT_MATCHED';

    if (relocation === 'MATCHED') reasons.push('Worker is willing to relocate');
    else if (relocation === 'NOT_MATCHED') reasons.push('Worker is not marked willing to relocate');
    if (travel === 'MATCHED') reasons.push('Worker is willing to travel');
    else if (travel === 'NOT_MATCHED') reasons.push('Worker is not marked willing to travel');

    let accommodation: PreferenceMatchStatus = 'NOT_SPECIFIED';
    if (normalized.accommodationAvailable === true) {
      accommodation = 'OFFERED';
      reasons.push('Accommodation is available from the employer');
    } else if (normalized.accommodationAvailable === false) {
      accommodation = 'NOT_REQUESTED';
    }

    let score = 0;
    if (relocation === 'MATCHED') score += 1;
    if (travel === 'MATCHED') score += 1;
    if (mobility === 'MATCHED') score += 1;

    return { match: { mobility, relocation, travel, accommodation } as PreferenceMatch, score };
  }

  private toAvailabilityFilter(value: string | null) {
    switch (value) { case 'IMMEDIATE': case 'AVAILABLE': return 'AVAILABLE'; default: return undefined; }
  }
}
