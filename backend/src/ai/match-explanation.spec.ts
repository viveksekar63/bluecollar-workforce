import { buildMatchExplanation, getMatchTier } from './match-explanation';

describe('match explanation', () => {
  const base = {
    breakdown: { profession: 30, skills: 25, location: 20, experience: 10, availability: 5, verified: 5, verificationScore: 5 },
    skillDetails: [
      { required: 'Electrical Wiring', matched: true, minimumLevelMet: null, experienceYears: 5, skillLevel: 'EXPERT', verified: true },
    ],
    languageDetails: [{ required: 'Tamil', matched: true, matchedAs: 'Tamil' }],
    preferenceMatch: { mobility: 'NOT_REQUESTED', relocation: 'NOT_REQUESTED', travel: 'NOT_REQUESTED', accommodation: 'MATCHED' },
    normalized: { profession: { name: 'Electrician' }, minimumExperienceYears: 3, location: { name: 'Chennai' }, availability: 'IMMEDIATE' },
  };

  it.each([
    [90, 'BEST_MATCH'], [75, 'STRONG_MATCH'], [60, 'GOOD_MATCH'], [40, 'PARTIAL_MATCH'], [39, 'NOT_RECOMMENDED'],
  ])('maps %s to %s', (score, tier) => {
    expect(getMatchTier(score)).toBe(tier);
  });

  it('explains a fully matched candidate', () => {
    const result = buildMatchExplanation({ ...base, score: 100 });
    expect(result).toEqual(expect.objectContaining({ matchScore: 100, matchTier: 'BEST_MATCH', recommendation: 'Highly recommended' }));
    expect(result.strengths).toEqual(expect.arrayContaining(['Exact profession match', 'All required skills matched', 'All required languages matched', 'Accommodation requirement satisfied']));
    expect(result.missingRequirements).toEqual([]);
    expect(result.concerns).toEqual([]);
  });

  it('surfaces missing language and below-level skill concerns', () => {
    const result = buildMatchExplanation({
      ...base,
      score: 55,
      skillDetails: [{ required: 'Panel Installation', matched: true, minimumLevelMet: false, experienceYears: 2, skillLevel: 'BEGINNER', verified: false }],
      languageDetails: [{ required: 'Tamil', matched: false, matchedAs: null }, { required: 'Hindi', matched: true, matchedAs: 'Hindi' }],
      preferenceMatch: { mobility: 'NOT_REQUESTED', relocation: 'NOT_MATCHED', travel: 'NOT_REQUESTED', accommodation: 'NOT_MATCHED' },
      breakdown: { ...base.breakdown, profession: 30, skills: 0, location: 0, experience: 0, verified: 0, verificationScore: 0 },
      normalized: { ...base.normalized, minimumExperienceYears: 5 },
    });
    expect(result.matchTier).toBe('PARTIAL_MATCH');
    expect(result.missingRequirements).toEqual(expect.arrayContaining(['Missing languages: Tamil', 'Minimum 5 years experience not met']));
    expect(result.concerns).toEqual(expect.arrayContaining(['Below minimum skill level: Panel Installation', 'Worker is not willing to relocate', 'Accommodation requirement is not satisfied']));
  });
});
