export type AccommodationMatchStatus = 'MATCHED' | 'OFFERED' | 'NOT_MATCHED' | 'NOT_SPECIFIED';

export interface AccommodationMatchResult {
  status: AccommodationMatchStatus;
  score: number;
  reason: string;
}

/**
 * Accommodation is a preference signal, not a hard eligibility filter.
 * The employer requirement is authoritative only when explicitly specified.
 */
export function calculateAccommodationMatch(
  employerProvidesAccommodation: boolean | null | undefined,
  workerRequiresAccommodation: boolean | null | undefined,
): AccommodationMatchResult {
  if (employerProvidesAccommodation === true) {
    if (workerRequiresAccommodation === true) {
      return { status: 'MATCHED', score: 2, reason: 'Accommodation is available and matches the worker accommodation requirement' };
    }
    return { status: 'OFFERED', score: 1, reason: 'Accommodation is available from the employer' };
  }

  if (employerProvidesAccommodation === false) {
    if (workerRequiresAccommodation === true) {
      return { status: 'NOT_MATCHED', score: -2, reason: 'Worker requires accommodation but the employer does not provide it' };
    }
    return { status: 'NOT_SPECIFIED', score: 0, reason: 'Accommodation is not required by the worker' };
  }

  return { status: 'NOT_SPECIFIED', score: 0, reason: 'Accommodation requirement was not specified' };
}
