import { Injectable } from '@nestjs/common';
import { RequirementParserService } from './requirement-parser.service';
import { WorkerRequirementNormalizerService } from './worker-requirement-normalizer.service';

@Injectable()
export class JobRequirementService {
  constructor(
    private readonly parser: RequirementParserService,
    private readonly normalizer: WorkerRequirementNormalizerService,
  ) {}

  async parse(query: string) {
    const requirement = await this.parser.parse(query);

    if (requirement.clarificationRequired) {
      return {
        status: 'CLARIFICATION_REQUIRED' as const,
        query,
        requirement,
        normalizedRequirement: null,
        suggestedJob: null,
      };
    }

    const normalizedRequirement = await this.normalizer.normalize(requirement);
    const profession = normalizedRequirement.profession?.name ?? 'Worker';
    const openings = normalizedRequirement.workerCount ?? 1;
    const location = normalizedRequirement.location;

    return {
      status: 'READY' as const,
      query,
      requirement,
      normalizedRequirement,
      suggestedJob: {
        title: `${openings > 1 ? `${openings} ` : ''}${profession} Required`,
        description: query.trim(),
        city: location?.type === 'CITY' ? location.name : '',
        district: location?.type === 'DISTRICT' ? location.name : location?.parentName ?? '',
        state:
          location?.type === 'STATE'
            ? location.name
            : location?.parentName ?? '',
        pincode: location?.pincode ?? '',
        openings,
        skillNames: normalizedRequirement.skills.map((skill) => skill.name),
        minimumSkillLevel: normalizedRequirement.minimumSkillLevel,
        minimumExperienceYears: normalizedRequirement.minimumExperienceYears,
        languages: normalizedRequirement.languages.map((language) => language.name),
        availability: normalizedRequirement.availability,
        mobility: normalizedRequirement.mobility,
        willingToRelocate: normalizedRequirement.willingToRelocate,
        willingToTravel: normalizedRequirement.willingToTravel,
        accommodationAvailable: normalizedRequirement.accommodationAvailable,
      },
    };
  }
}
