export interface WorkerSearchRequirement {
  profession: string | null;
  professionCategory: string | null;
  skills: string[];
  workerCount: number | null;

  location: {
    city: string | null;
    district: string | null;
    state: string | null;
    pincode: string | null;
  };

  minimumExperienceYears: number | null;

  languages: string[];

  availability:
    | 'IMMEDIATE'
    | 'AVAILABLE'
    | 'WITHIN_7_DAYS'
    | 'WITHIN_15_DAYS'
    | 'WITHIN_30_DAYS'
    | null;

  mobility:
    | 'LOCAL'
    | 'WITHIN_RADIUS'
    | 'WITHIN_STATE'
    | 'SPECIFIC_LOCATIONS'
    | 'ANYWHERE_INDIA'
    | null;

  willingToRelocate: boolean | null;
  willingToTravel: boolean | null;
  accommodationAvailable: boolean | null;

  clarificationRequired: boolean;
  clarificationQuestion: string | null;
}
