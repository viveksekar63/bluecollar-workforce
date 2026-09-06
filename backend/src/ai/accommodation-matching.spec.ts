import { calculateAccommodationMatch } from './accommodation-matching';

describe('calculateAccommodationMatch', () => {
  it('matches when employer provides accommodation and worker requires it', () => {
    expect(calculateAccommodationMatch(true, true)).toEqual({
      status: 'MATCHED',
      score: 2,
      reason: 'Accommodation is available and matches the worker accommodation requirement',
    });
  });

  it('marks a worker requiring accommodation as not matched when employer does not provide it', () => {
    expect(calculateAccommodationMatch(false, true).status).toBe('NOT_MATCHED');
    expect(calculateAccommodationMatch(false, true).score).toBe(-2);
  });

  it('reports accommodation as offered when worker does not require it', () => {
    expect(calculateAccommodationMatch(true, false).status).toBe('OFFERED');
  });

  it('does not invent an accommodation requirement when employer did not specify it', () => {
    expect(calculateAccommodationMatch(undefined, true).status).toBe('NOT_SPECIFIED');
  });
});
