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

    const cityMatch = query.match(
      /\bin\s+([a-z]+(?:\s+[a-z]+)*?)(?=\s+(?:with|who|that|and|for|having|speaking|speak|available|availability|accommodation)\b|[,.]|$)/i,
    );

    const accommodationAvailable =
      query.includes('accommodation is available') ||
      query.includes('accommodation available') ||
      query.includes('accommodation provided');

    const immediate =
      query.includes('available immediately') ||
      query.includes('immediately available') ||
      query.includes('immediate');

    return {
      profession,
      professionCategory: null,
      skills: [],
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
      mobility: null,
      willingToRelocate: null,
      willingToTravel: null,
      accommodationAvailable,
      clarificationRequired: profession === null,
      clarificationQuestion: profession === null
        ? 'Which type of worker do you need?'
        : null,
    };
  }

  private normalizeCity(city: string): string | null {
    const normalized = city.trim().toLowerCase();
    const cities: Record<string, string> = {
      chennai: 'Chennai',
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
