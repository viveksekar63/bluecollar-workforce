import { WorkerSearchService } from './worker-search.service';

describe('WorkerSearchService language and location regressions', () => {
  const parser = { parse: jest.fn() };
  const normalizer = { normalize: jest.fn() };
  const discovery = { findAll: jest.fn() };
  let service: WorkerSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkerSearchService(parser as any, normalizer as any, discovery as any);
  });

  const requirement = (overrides: Record<string, unknown> = {}) => ({
    profession: { name: 'Electrician' },
    skills: [],
    minimumSkillLevel: null,
    languages: [{ id: 'lang-1', name: 'Tamil' }],
    location: { name: 'Chennai', type: 'CITY' },
    minimumExperienceYears: 5,
    availability: 'IMMEDIATE',
    workerCount: 5,
    mobility: null,
    willingToRelocate: null,
    willingToTravel: null,
    accommodationAvailable: null,
    ...overrides,
  });

  const worker = (overrides: Record<string, unknown> = {}) => ({
    id: 'worker-1',
    workerCode: 'AI-TEST-0001',
    firstName: 'Test',
    lastName: 'Worker',
    profession: 'Electrician',
    experienceYears: 8,
    availability: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    verificationScore: 90,
    mobility: 'LOCAL',
    willingToRelocate: false,
    willingToTravel: false,
    distanceKm: null,
    skillDetails: [],
    ...overrides,
  });

  const search = async (normalized: any, workers: any[]) => {
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: workers, total: workers.length });
    return service.search('electrician search');
  };

  it('uses nested worker.location when flat location fields are absent', async () => {
    const normalized = requirement();
    const result = await search(normalized, [worker({
      location: { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' },
    })]);

    const match = result.results!.items[0];
    expect(match.matchBreakdown.location).toBe(20);
    expect(match.matchReasons).toContain('Exact location match: Chennai');
  });

  it('reports actual language matches instead of assuming every requested language matches', async () => {
    const normalized = requirement({
      languages: [
        { id: 'lang-1', name: 'Tamil' },
        { id: 'lang-2', name: 'Hindi' },
      ],
    });
    const result = await search(normalized, [worker({ languages: ['Tamil', 'English'] })]);

    const match = result.results!.items[0];
    expect(match.matchDetails.languages).toEqual([
      { required: 'Tamil', matched: true, matchedAs: 'Tamil' },
      { required: 'Hindi', matched: false, matchedAs: null },
    ]);
    expect(match.matchDetails.languageScore).toBe(50);
    expect(match.matchDetails.matchedLanguages).toBe(1);
    expect(match.matchDetails.unmatchedLanguages).toEqual(['Hindi']);
    expect(match.matchReasons).toEqual(expect.arrayContaining([
      '1 of 2 required languages matched',
      'Unmatched languages: Hindi',
    ]));
  });

  it('supports case-insensitive and partial language matching', async () => {
    const normalized = requirement({ languages: [{ id: 'lang-1', name: 'Tamil' }] });
    const result = await search(normalized, [worker({ languages: ['tamil language'] })]);

    const match = result.results!.items[0];
    expect(match.matchDetails.languages).toEqual([
      { required: 'Tamil', matched: true, matchedAs: 'tamil language' },
    ]);
    expect(match.matchDetails.languageScore).toBe(100);
    expect(match.matchReasons).toContain('All 1 required languages matched');
  });
});
