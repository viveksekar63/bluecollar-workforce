import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import { WORKER_REQUIREMENT_SYSTEM_PROMPT } from './prompts/worker-requirement.prompt';
import { WorkerSearchRequirement } from './requirement-parser.types';

@Injectable()
export class RequirementParserService {
  constructor(private readonly aiService: AiService) {}

  async parse(query: string): Promise<WorkerSearchRequirement> {
    const result = await this.aiService.generateJson(
      WORKER_REQUIREMENT_SYSTEM_PROMPT,
      query,
    );

    return this.normalize(result);
  }

  private normalize(
    input: Record<string, unknown>,
  ): WorkerSearchRequirement {
    const location =
      input.location && typeof input.location === 'object'
        ? (input.location as Record<string, unknown>)
        : {};

    return {
      profession: this.stringOrNull(input.profession),
      professionCategory: this.stringOrNull(input.professionCategory),

      skills: this.stringArray(input.skills),
      minimumSkillLevel: this.enumOrNull(input.minimumSkillLevel, [
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED',
        'EXPERT',
      ]),

      workerCount: this.numberOrNull(input.workerCount),

      location: {
        city: this.stringOrNull(location.city),
        district: this.stringOrNull(location.district),
        state: this.stringOrNull(location.state),
        pincode: this.stringOrNull(location.pincode),
      },

      minimumExperienceYears: this.numberOrNull(
        input.minimumExperienceYears,
      ),

      languages: this.stringArray(input.languages),

      availability: this.enumOrNull(input.availability, [
        'IMMEDIATE',
        'AVAILABLE',
        'WITHIN_7_DAYS',
        'WITHIN_15_DAYS',
        'WITHIN_30_DAYS',
      ]),

      mobility: this.enumOrNull(input.mobility, [
        'LOCAL',
        'WITHIN_RADIUS',
        'WITHIN_STATE',
        'SPECIFIC_LOCATIONS',
        'ANYWHERE_INDIA',
      ]),

      willingToRelocate: this.booleanOrNull(input.willingToRelocate),
      willingToTravel: this.booleanOrNull(input.willingToTravel),
      accommodationAvailable: this.booleanOrNull(
        input.accommodationAvailable,
      ),

      clarificationRequired: input.clarificationRequired === true,

      clarificationQuestion: this.stringOrNull(
        input.clarificationQuestion,
      ),
    };
  }

  private stringOrNull(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();

    return trimmed || null;
  }

  private stringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private numberOrNull(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    return null;
  }

  private booleanOrNull(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
  }

  private enumOrNull<T extends string>(
    value: unknown,
    allowed: T[],
  ): T | null {
    return typeof value === 'string' && allowed.includes(value as T)
      ? (value as T)
      : null;
  }
}
