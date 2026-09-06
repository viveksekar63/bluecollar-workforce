export type MatchTier = 'BEST_MATCH' | 'STRONG_MATCH' | 'GOOD_MATCH' | 'PARTIAL_MATCH' | 'NOT_RECOMMENDED';

export interface MatchExplanation {
  matchScore: number;
  matchTier: MatchTier;
  strengths: string[];
  missingRequirements: string[];
  concerns: string[];
  recommendation: string;
}

export function getMatchTier(score: number): MatchTier {
  if (score >= 90) return 'BEST_MATCH';
  if (score >= 75) return 'STRONG_MATCH';
  if (score >= 60) return 'GOOD_MATCH';
  if (score >= 40) return 'PARTIAL_MATCH';
  return 'NOT_RECOMMENDED';
}

export function buildMatchExplanation(input: {
  score: number;
  breakdown: { profession: number; skills: number; location: number; experience: number; availability: number; verified: number; verificationScore: number };
  skillDetails: Array<{ required: string; matched: boolean; minimumLevelMet: boolean | null; experienceYears: number | null; skillLevel: string | null; verified: boolean }>;
  languageDetails: Array<{ required: string; matched: boolean; matchedAs: string | null }>;
  preferenceMatch: { mobility: string; relocation: string; travel: string; accommodation: string };
  normalized: any;
}): MatchExplanation {
  const strengths: string[] = [];
  const missingRequirements: string[] = [];
  const concerns: string[] = [];
  const { breakdown, skillDetails, languageDetails, preferenceMatch, normalized, score } = input;

  if (breakdown.profession === 30) strengths.push('Exact profession match');
  else if (normalized.profession?.name) missingRequirements.push(`Profession does not exactly match ${normalized.profession.name}`);

  const qualifiedSkills = skillDetails.filter((skill) => skill.matched && (skill.minimumLevelMet === null || skill.minimumLevelMet));
  const missingSkills = skillDetails.filter((skill) => !skill.matched).map((skill) => skill.required);
  const belowLevelSkills = skillDetails.filter((skill) => skill.matched && skill.minimumLevelMet === false).map((skill) => skill.required);
  if (skillDetails.length === 0) strengths.push('No specific skills required');
  else if (qualifiedSkills.length === skillDetails.length) strengths.push('All required skills matched');
  else if (qualifiedSkills.length > 0) strengths.push(`${qualifiedSkills.length} of ${skillDetails.length} required skills matched`);
  if (missingSkills.length) missingRequirements.push(`Missing skills: ${missingSkills.join(', ')}`);
  if (belowLevelSkills.length) concerns.push(`Below minimum skill level: ${belowLevelSkills.join(', ')}`);

  const matchedLanguages = languageDetails.filter((language) => language.matched);
  const unmatchedLanguages = languageDetails.filter((language) => !language.matched).map((language) => language.required);
  if (languageDetails.length === 0) strengths.push('No specific languages required');
  else if (matchedLanguages.length === languageDetails.length) strengths.push('All required languages matched');
  else if (matchedLanguages.length > 0) strengths.push(`${matchedLanguages.length} of ${languageDetails.length} required languages matched`);
  if (unmatchedLanguages.length) missingRequirements.push(`Missing languages: ${unmatchedLanguages.join(', ')}`);

  if (normalized.minimumExperienceYears == null || breakdown.experience === 10) strengths.push(normalized.minimumExperienceYears == null ? 'Experience requirement not specified' : `${normalized.minimumExperienceYears}+ years experience requirement met`);
  else missingRequirements.push(`Minimum ${normalized.minimumExperienceYears} years experience not met`);
  if (breakdown.location === 20) strengths.push('Location requirement matched');
  else if (normalized.location?.name) concerns.push(`Location is not an exact match for ${normalized.location.name}`);
  if (breakdown.availability === 5) strengths.push('Availability requirement met');
  else if (normalized.availability) missingRequirements.push('Availability requirement not met');
  if (breakdown.verified === 5) strengths.push('Identity/background verification completed');
  else concerns.push('Worker is not fully verified');

  if (preferenceMatch.relocation === 'MATCHED') strengths.push('Relocation preference matched');
  else if (preferenceMatch.relocation === 'NOT_MATCHED') concerns.push('Worker is not willing to relocate');
  if (preferenceMatch.travel === 'MATCHED') strengths.push('Travel preference matched');
  else if (preferenceMatch.travel === 'NOT_MATCHED') concerns.push('Worker is not willing to travel');
  if (preferenceMatch.accommodation === 'MATCHED') strengths.push('Accommodation requirement satisfied');
  else if (preferenceMatch.accommodation === 'NOT_MATCHED') concerns.push('Accommodation requirement is not satisfied');
  else if (preferenceMatch.accommodation === 'OFFERED') strengths.push('Accommodation is available from the employer');

  const matchTier = getMatchTier(score);
  const recommendation = matchTier === 'BEST_MATCH' ? 'Highly recommended' : matchTier === 'STRONG_MATCH' ? 'Recommended' : matchTier === 'GOOD_MATCH' ? 'Good candidate' : matchTier === 'PARTIAL_MATCH' ? 'Review for partial match' : 'Not recommended';
  return { matchScore: score, matchTier, strengths: [...new Set(strengths)], missingRequirements: [...new Set(missingRequirements)], concerns: [...new Set(concerns)], recommendation };
}
