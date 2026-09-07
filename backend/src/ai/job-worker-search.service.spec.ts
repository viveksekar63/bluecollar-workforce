import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobWorkerSearchService } from './job-worker-search.service';

describe('JobWorkerSearchService', () => {
  const prisma = {
    employer: { findUnique: jest.fn() },
    job: { findFirst: jest.fn() },
    $queryRaw: jest.fn(),
  };
  const aiRequirements = { getRequirements: jest.fn() };
  const workerSearchService = { searchNormalizedRequirement: jest.fn() };
  let service: JobWorkerSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobWorkerSearchService(prisma as any, aiRequirements as any, workerSearchService as any);
  });

  it('rejects an unverified employer', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'emp-1', status: 'PENDING' });
    await expect(service.findWorkers('user-1', 'job-1', {})).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.job.findFirst).not.toHaveBeenCalled();
  });

  it('enforces job ownership through the employer scoped query', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'emp-1', status: 'VERIFIED' });
    prisma.job.findFirst.mockResolvedValue(null);
    await expect(service.findWorkers('user-1', 'job-1', {})).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.job.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'job-1', employerId: 'emp-1' } }));
  });

  it('loads persisted AI requirements, propagates accommodation, and forwards pagination and geo inputs', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'emp-1', status: 'VERIFIED' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: '5 Electricians Required', status: 'DRAFT', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', openings: 5, skills: [{ skill: { id: 'skill-1', name: 'Electrical Wiring' } }, { skill: { id: 'skill-2', name: 'Panel Installation' } }] });
    aiRequirements.getRequirements.mockResolvedValue({ profession: 'Electrician', professionCategory: 'Electrical', minimumExperienceYears: 5, minimumSkillLevel: 'EXPERT', availability: 'IMMEDIATE', mobility: 'LOCAL', willingToRelocate: false, willingToTravel: false, accommodationAvailable: true, languages: [{ id: 'lang-1', name: 'Tamil' }] });
    workerSearchService.searchNormalizedRequirement.mockResolvedValue({ status: 'MATCHED', results: { items: [{ workerId: 'worker-1', matchScore: 94, matchTier: 'BEST_MATCH', matchExplanation: { strengths: ['Profession matches'], missingRequirements: [], concerns: [], recommendation: 'Highly recommended' } }], page: 2, limit: 10, total: 11, totalPages: 2, candidateTotal: 11, rankingCandidateLimit: 100, hasNext: false } });

    const result = await service.findWorkers('user-1', 'job-1', { page: 2, limit: 10, latitude: 13.0827, longitude: 80.2707, radiusKm: 25 });
    const [normalized, query, geo, pagination] = workerSearchService.searchNormalizedRequirement.mock.calls[0];
    expect(normalized.workerCount).toBe(5);
    expect(normalized.profession).toEqual(expect.objectContaining({ name: 'Electrician' }));
    expect(normalized.minimumExperienceYears).toBe(5);
    expect(normalized.minimumSkillLevel).toBe('EXPERT');
    expect(normalized.languages).toEqual([{ id: 'lang-1', name: 'Tamil' }]);
    expect(normalized.skills).toEqual([{ id: 'skill-1', name: 'Electrical Wiring' }, { id: 'skill-2', name: 'Panel Installation' }]);
    expect(normalized.location).toEqual(expect.objectContaining({ type: 'CITY', name: 'Chennai', stateName: 'Tamil Nadu', pincode: '600001' }));
    expect(normalized.accommodationAvailable).toBe(true);
    expect(query).toBe('Job job-1: 5 Electricians Required');
    expect(geo).toEqual({ latitude: 13.0827, longitude: 80.2707, radiusKm: 25 });
    expect(pagination).toEqual({ page: 2, limit: 10 });
    expect(result.job).toEqual(expect.objectContaining({ id: 'job-1', title: '5 Electricians Required', openings: 5 }));
    expect(result.results.items[0]).toEqual(expect.objectContaining({ workerId: 'worker-1', matchScore: 94, matchTier: 'BEST_MATCH', matchExplanation: expect.any(Object) }));
  });

  it('returns AI-ranked contact recommendations without exposing contact details', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'emp-1', status: 'VERIFIED' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electricians', status: 'DRAFT', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: null, openings: 2, skills: [] });
    aiRequirements.getRequirements.mockResolvedValue({ profession: 'Electrician', professionCategory: 'Electrical', minimumExperienceYears: 3, minimumSkillLevel: null, availability: 'IMMEDIATE', mobility: 'LOCAL', willingToRelocate: false, willingToTravel: false, accommodationAvailable: false, languages: [] });
    workerSearchService.searchNormalizedRequirement.mockResolvedValue({ results: { items: [{ id: 'worker-1', workerCode: 'AI-001', firstName: 'Surya', lastName: '', profession: 'Electrician', professionCategory: 'Electrical', experienceYears: 8, profileImageUrl: null, verificationStatus: 'VERIFIED', verificationScore: 90, matchScore: 99, matchTier: 'BEST_MATCH', matchReasons: ['Exact profession match'], matchBreakdown: { profession: 30 }, preferenceScore: 100, languageScore: 100 }, { id: 'worker-2', workerCode: 'AI-002', firstName: 'Prakash', lastName: '', profession: 'Electrician', professionCategory: 'Electrical', experienceYears: 5, profileImageUrl: null, verificationStatus: 'VERIFIED', verificationScore: 82, matchScore: 86, matchTier: 'STRONG_MATCH', matchReasons: ['Strong match'], matchBreakdown: { profession: 30 }, preferenceScore: 90, languageScore: 100 }] } } });
    prisma.$queryRaw.mockResolvedValue([{ workerId: 'worker-2', actionType: 'SHORTLISTED' }]);

    const result = await service.recommendedForContact('user-1', 'job-1', 10);
    expect(result.mode).toBe('AI_CONTACT_RECOMMENDATIONS');
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0]).toEqual(expect.objectContaining({ workerId: 'worker-1', matchScore: 99, recommendationAction: 'CONTACT_NOW', isShortlisted: false, contactLocked: true, contactUnlockRequired: true }));
    expect(result.recommendations[1]).toEqual(expect.objectContaining({ workerId: 'worker-2', isShortlisted: true, recommendationAction: 'HIGH_PRIORITY' }));
    expect(result.recommendations[0]).not.toHaveProperty('phone');
    expect(result.recommendations[0]).not.toHaveProperty('email');
  });
});
