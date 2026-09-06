import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobWorkerSearchService } from './job-worker-search.service';

describe('JobWorkerSearchService', () => {
  const prisma = {
    employer: { findUnique: jest.fn() },
    job: { findFirst: jest.fn() },
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
    expect(prisma.job.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'job-1', employerId: 'emp-1' },
    }));
  });

  it('loads persisted AI requirements and sends the normalized job requirement to the existing ranked search engine', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'emp-1', status: 'VERIFIED' });
    prisma.job.findFirst.mockResolvedValue({
      id: 'job-1',
      title: '5 Electricians Required',
      status: 'DRAFT',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: null,
      openings: 5,
      skills: [
        { skill: { id: 'skill-1', name: 'Electrical Wiring' } },
        { skill: { id: 'skill-2', name: 'Panel Installation' } },
      ],
    });
    aiRequirements.getRequirements.mockResolvedValue({
      profession: 'Electrician',
      professionCategory: 'Electrical',
      minimumExperienceYears: 5,
      minimumSkillLevel: 'EXPERT',
      availability: 'IMMEDIATE',
      mobility: 'LOCAL',
      willingToRelocate: false,
      willingToTravel: false,
      accommodationAvailable: true,
      languages: [{ id: 'lang-1', name: 'Tamil' }],
    });
    workerSearchService.searchNormalizedRequirement.mockResolvedValue({
      status: 'MATCHED',
      results: { items: [], page: 1, limit: 5, total: 0, totalPages: 0, candidateTotal: 0, rankingCandidateLimit: 0, hasNext: false },
    });

    const result = await service.findWorkers('user-1', 'job-1', { page: 1, limit: 5 });

    const normalized = workerSearchService.searchNormalizedRequirement.mock.calls[0][0];
    expect(normalized.workerCount).toBe(5);
    expect(normalized.profession.name).toBe('Electrician');
    expect(normalized.minimumExperienceYears).toBe(5);
    expect(normalized.minimumSkillLevel).toBe('EXPERT');
    expect(normalized.languages).toEqual([{ id: 'lang-1', name: 'Tamil' }]);
    expect(normalized.skills).toEqual([
      { id: 'skill-1', name: 'Electrical Wiring' },
      { id: 'skill-2', name: 'Panel Installation' },
    ]);
    expect(normalized.location).toEqual(expect.objectContaining({ type: 'CITY', name: 'Chennai', stateName: 'Tamil Nadu' }));
    expect(result.job.id).toBe('job-1');
    expect(result.aiRequirements.minimumSkillLevel).toBe('EXPERT');
  });
});
