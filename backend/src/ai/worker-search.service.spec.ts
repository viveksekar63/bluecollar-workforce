import { WorkerSearchService } from './worker-search.service';
import { MasterDataNotFoundError } from './worker-requirement-normalizer.service';

describe('WorkerSearchService matching', () => {
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
    skills: [
      { id: 'skill-1', name: 'Electrical Wiring' },
      { id: 'skill-2', name: 'Panel Installation' },
      { id: 'skill-3', name: 'Industrial Electrical' },
    ],
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
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    experienceYears: 8,
    availability: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    verificationScore: 90,
    mobility: 'LOCAL',
    willingToRelocate: false,
    willingToTravel: false,
    distanceKm: 5,
    skills: ['Electrical Wiring', 'Panel Installation', 'Industrial Electrical'],
    skillDetails: [
      { id: 'skill-1', name: 'Electrical Wiring', experienceYears: 10, skillLevel: 'EXPERT', verified: true },
      { id: 'skill-2', name: 'Panel Installation', experienceYears: 10, skillLevel: 'EXPERT', verified: true },
      { id: 'skill-3', name: 'Industrial Electrical', experienceYears: 10, skillLevel: 'EXPERT', verified: true },
    ],
    ...overrides,
  });

  it('scores a fully matched expert/verified worker highly', async () => {
    const normalized = requirement();
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker()], total: 1 });

    const result = await service.search('electrician search');
    const match = result.results!.items[0];

    expect(match.matchBreakdown).toEqual({ profession: 30, skills: 25, location: 20, experience: 10, availability: 5, verified: 5, verificationScore: 5 });
    expect(match.matchScore).toBe(100);
    expect(match.matchDetails.skills).toHaveLength(3);
    expect(match.matchReasons).toEqual(expect.arrayContaining(['All 3 required skills matched', '3 required skills verified', '3 matched skills at advanced/expert level']));
  });

  it('ranks 3/3 verified advanced skills above 2/3 unverified intermediate skills', async () => {
    const normalized = requirement();
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ id: 'worker-2', skillDetails: [
      { id: 'skill-1', name: 'Electrical Wiring', experienceYears: 4, skillLevel: 'INTERMEDIATE', verified: false },
      { id: 'skill-2', name: 'Panel Installation', experienceYears: 4, skillLevel: 'INTERMEDIATE', verified: false },
    ] }), worker({ id: 'worker-1' })], total: 2 });

    const result = await service.search('electrician search');
    expect(result.results!.items.map((item) => item.id)).toEqual(['worker-1', 'worker-2']);
    expect(result.results!.items[0].matchScore).toBeGreaterThan(result.results!.items[1].matchScore);
  });

  it('gives the full skill score when no specific skills are requested', async () => {
    const normalized = requirement({ skills: [] });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker()], total: 1 });
    const result = await service.search('electrician without skill requirements');
    const match = result.results!.items[0];
    expect(match.matchBreakdown.skills).toBe(25);
    expect(match.matchDetails.skills).toEqual([]);
    expect(match.matchReasons).toContain('No specific skill requested');
  });

  it('does not award skill points for a completely unmatched skill requirement', async () => {
    const normalized = requirement({ skills: [{ id: 'skill-x', name: 'Masonry' }] });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker()], total: 1 });
    const result = await service.search('electrician with masonry');
    const match = result.results!.items[0];
    expect(match.matchBreakdown.skills).toBe(0);
    expect(match.matchDetails.skills).toEqual([{ required: 'Masonry', matched: false, experienceYears: null, skillLevel: null, verified: false }]);
    expect(match.matchReasons).toContain('No required skills matched');
  });

  it('caps worker verification contribution at 5 points', async () => {
    const normalized = requirement();
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ verificationScore: 100 })], total: 1 });
    const result = await service.search('verified electrician');
    expect(result.results!.items[0].matchBreakdown.verificationScore).toBe(5);
  });

  it('does not apply radius location scoring when the worker has no distance', async () => {
    const normalized = requirement({ location: null });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ distanceKm: null })], total: 1 });
    const result = await service.search('electrician search', { latitude: 13.0827, longitude: 80.2707, radiusKm: 25 });
    expect(result.results!.items[0].matchBreakdown.location).toBe(0);
    expect(result.results!.items[0].matchReasons).not.toContain(expect.stringContaining('km from employer location'));
  });

  it('uses employer coordinates and radius for location scoring when semantic location is absent', async () => {
    const normalized = requirement({ location: null });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ id: 'near', distanceKm: 4 }), worker({ id: 'far', distanceKm: 20 })], total: 2 });
    const result = await service.search('electrician search', { latitude: 13.0827, longitude: 80.2707, radiusKm: 25 });
    const near = result.results!.items.find((item) => item.id === 'near')!;
    const far = result.results!.items.find((item) => item.id === 'far')!;
    expect(near.matchBreakdown.location).toBe(20);
    expect(far.matchBreakdown.location).toBe(5);
    expect(near.matchReasons).toContain('4.0 km from employer location');
    expect(far.matchReasons).toContain('20.0 km from employer location');
  });

  it('matches state-level semantic locations', async () => {
    const normalized = requirement({ location: { name: 'Tamil Nadu', type: 'STATE' } });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker()], total: 1 });
    const result = await service.search('electrician in Tamil Nadu');
    expect(result.results!.items[0].matchBreakdown.location).toBe(20);
    expect(result.results!.items[0].matchReasons).toContain('Exact location match: Chennai');
  });

  it('matches relocation-capable workers for a different semantic location', async () => {
    const normalized = requirement({ location: { name: 'Bengaluru', type: 'CITY' }, willingToRelocate: true });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ city: 'Chennai', mobility: 'WITHIN_STATE', willingToRelocate: true })], total: 1 });
    const result = await service.search('electrician in Bengaluru willing to relocate');
    const match = result.results!.items[0];
    expect(match.preferenceMatch.relocation).toBe('MATCHED');
    expect(match.matchReasons).toContain('Worker is willing to relocate');
    expect(match.matchBreakdown.location).toBe(0);
  });

  it('matches travel-capable workers when travel is requested', async () => {
    const normalized = requirement({ willingToTravel: true });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ willingToTravel: true })], total: 1 });
    const result = await service.search('electrician willing to travel');
    const match = result.results!.items[0];
    expect(match.preferenceMatch.travel).toBe('MATCHED');
    expect(match.matchReasons).toContain('Worker is willing to travel');
  });

  it('returns mobility compatibility and employer accommodation offer without changing the 100-point score', async () => {
    const normalized = requirement({ mobility: 'ANYWHERE_INDIA', willingToRelocate: true, willingToTravel: true, accommodationAvailable: true });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ mobility: 'ANYWHERE_INDIA', willingToRelocate: true, willingToTravel: true })], total: 1 });
    const result = await service.search('electrician anywhere in India, willing to relocate and travel, accommodation available');
    const match = result.results!.items[0];
    expect(match.matchScore).toBe(100);
    expect(match.preferenceMatch).toEqual({ mobility: 'MATCHED', relocation: 'MATCHED', travel: 'MATCHED', accommodation: 'OFFERED' });
    expect(match.matchDetails.preferences).toEqual(match.preferenceMatch);
    expect(match.matchReasons).toEqual(expect.arrayContaining(['Mobility preference matched: ANYWHERE_INDIA', 'Worker is willing to relocate', 'Worker is willing to travel', 'Accommodation is available from the employer']));
  });

  it('does not hard-filter AI candidates by mobility preference', async () => {
    const normalized = requirement({ mobility: 'WITHIN_STATE' });
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    normalizer.normalize.mockResolvedValue(normalized);
    discovery.findAll.mockResolvedValue({ items: [worker({ mobility: 'LOCAL' })], total: 1 });
    await service.search('electrician within state');
    expect(discovery.findAll).toHaveBeenCalledWith(expect.objectContaining({ mobility: undefined }));
  });

  it('returns clarification without querying master data or workers', async () => {
    parser.parse.mockResolvedValue({ clarificationRequired: true, clarificationQuestion: 'Which profession?' });
    const result = await service.search('I need workers');
    expect(result.status).toBe('CLARIFICATION_REQUIRED');
    expect(result.results).toBeNull();
    expect(normalizer.normalize).not.toHaveBeenCalled();
    expect(discovery.findAll).not.toHaveBeenCalled();
  });

  it('returns master-data-not-found without querying workers', async () => {
    parser.parse.mockResolvedValue({ clarificationRequired: false });
    const error = new MasterDataNotFoundError('PROFESSION', 'Electrician');
    normalizer.normalize.mockRejectedValue(error);
    const result = await service.search('I need electricians');
    expect(result.status).toBe('MASTER_DATA_NOT_FOUND');
    expect(result.missingMasterData).toEqual([{ type: 'PROFESSION', value: 'Electrician' }]);
    expect(discovery.findAll).not.toHaveBeenCalled();
  });
});
