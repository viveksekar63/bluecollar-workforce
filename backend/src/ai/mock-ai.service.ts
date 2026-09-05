import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class MockAiService implements AiProvider {
  async generateJson(
    _systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    const query = userPrompt.toLowerCase();

    const profession =
      query.includes('electrician')
        ? 'Electrician'
        : query.includes('plumber')
          ? 'Plumber'
          : query.includes('carpenter')
            ? 'Carpenter'
            : query.includes('welder')
              ? 'Welder'
              : null;

    const workerCountMatch = query.match(
      /\b(\d+)\s+(?:(?:experienced|skilled|qualified|professional|trained)\s+)?(?:workers?|people|persons?|electricians?|plumbers?|carpenters?|welders?)\b/i,
    );

    const experienceMatch = query.match(
      /(?:at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i,
    );

    const languages: string[] = [];
    if (query.includes('tamil')) languages.push('Tamil');
    if (query.includes('telugu')) languages.push('Telugu');
    if (query.includes('kannada')) languages.push('Kannada');
    if (query.includes('malayalam')) languages.push('Malayalam');
    if (query.includes('hindi')) languages.push('Hindi');
    if (query.includes('english')) languages.push('English');

    const skills: string[] = [];
    const skillPatterns: Array<[RegExp, string]> = [
      [/electrical\s+wiring/i, 'Electrical Wiring'],
      [/panel\s+installation/i, 'Panel Installation'],
      [/industrial\s+electrical(?:\s+work)?/i, 'Industrial Electrical'],
      [/plumbing\s+installation/i, 'Plumbing Installation'],
      [/pipe\s+fitting/i, 'Pipe Fitting'],
      [/carpentry/i, 'Carpentry'],
      [/welding/i, 'Welding'],
    ];

    for (const [pattern, skill] of skillPatterns) {
      if (pattern.test(userPrompt)) skills.push(skill);
    }

    const minimumSkillLevel = /\bexpert\b/i.test(query)
      ? 'EXPERT'
      : /\badvanced\b/i.test(query)
        ? 'ADVANCED'
        : /\bintermediate\b/i.test(query)
          ? 'INTERMEDIATE'
          : /\bbeginner\b/i.test(query)
            ? 'BEGINNER'
            : null;

    const cityMatch = query.match(
      /\bin\s+([a-z]+(?:\s+[a-z]+)*?)(?=\s+(?:with|who|that|and|for|having|speaking|speak|available|availability|accommodation|willing|must|should)\b|[,.]|$)/i,
    );

    const accommodationAvailable =
      query.includes('accommodation is available') ||
      query.includes('accommodation available') ||
      query.includes('accommodation provided');

    const immediate =
      query.includes('available immediately') ||
      query.includes('immediately available') ||
      query.includes('immediate');

    const willingToRelocate =
      query.includes('willing to relocate') ||
      query.includes('ready to relocate') ||
      query.includes('can relocate') ||
      query.includes('willing to relocate and travel');

    const willingToTravel =
      query.includes('willing to travel') ||
      query.includes('ready to travel') ||
      query.includes('can travel') ||
      query.includes('willing to relocate and travel');

    const mobility = this.extractMobility(query);

    return {
      profession,
      professionCategory: null,
      skills,
      minimumSkillLevel,
      workerCount: workerCountMatch ? Number(workerCountMatch[1]) : null,
      location: {
        city: cityMatch ? this.normalizeCity(cityMatch[1]) : null,
        district: null,
        state: null,
        pincode: null,
      },
      minimumExperienceYears: experienceMatch ? Number(experienceMatch[1]) : null,
      languages,
      availability: immediate ? 'IMMEDIATE' : null,
      mobility,
      willingToRelocate: willingToRelocate ? true : null,
      willingToTravel: willingToTravel ? true : null,
      accommodationAvailable,
      clarificationRequired: profession === null,
      clarificationQuestion: profession === null
        ? 'Which type of worker do you need?'
        : null,
    };
  }

  private extractMobility(query: string): string | null {
    if (/\b(?:anywhere in india|across india|all over india)\b/i.test(query)) {
      return 'ANYWHERE_INDIA';
    }

    if (/\b(?:specific locations?|selected locations?)\b/i.test(query)) {
      return 'SPECIFIC_LOCATIONS';
    }

    if (/\b(?:within the state|within state|same state)\b/i.test(query)) {
      return 'WITHIN_STATE';
    }

    if (/\b(?:within (?:a )?radius|within \d+\s*km|nearby|near the location)\b/i.test(query)) {
      return 'WITHIN_RADIUS';
    }

    if (/\b(?:local|locally|same city|nearby only)\b/i.test(query)) {
      return 'LOCAL';
    }

    return null;
  }

  private normalizeCity(city: string): string | null {
    const normalized = city.trim().toLowerCase();
    const cities: Record<string, string> = {
      chennai: 'Chennai',
      bengaluru: 'Bengaluru',
      bangalore: 'Bengaluru',
      coimbatore: 'Coimbatore',
      madurai: 'Madurai',
      trichy: 'Tiruchirappalli',
      tiruchirappalli: 'Tiruchirappalli',
      salem: 'Salem',
      thanjavur: 'Thanjavur',
    };
    return cities[normalized] || this.capitalizeWords(city);
  }

  private capitalizeWords(value: string): string {
    return value
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
