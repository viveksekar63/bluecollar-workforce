import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class MockAiService implements AiProvider {
  async generateJson(
    _systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    const query = userPrompt.toLowerCase().replace(/\s+/g, ' ').trim();

    const professionAliases: Array<[RegExp, string, string]> = [
      [/\b(?:electrician|electrical technician|electrical worker)s?\b/i, 'Electrician', 'Construction'],
      [/\b(?:plumber|plumbing technician)s?\b/i, 'Plumber', 'Construction'],
      [/\b(?:carpenter|wood worker)s?\b/i, 'Carpenter', 'Construction'],
      [/\b(?:painter|painting worker)s?\b/i, 'Painter', 'Construction'],
      [/\b(?:mason|brick mason|bricklayer)s?\b/i, 'Mason', 'Construction'],
      [/\b(?:tile worker|tile mason|tiler)s?\b/i, 'Tile Worker', 'Construction'],
      [/\b(?:welder|welding worker)s?\b/i, 'Welder', 'Construction'],
      [/\b(?:fabricator|fabrication worker)s?\b/i, 'Fabricator', 'Construction'],
      [/\b(?:ac technician|ac mechanic|air conditioner technician)s?\b/i, 'AC Technician', 'Construction'],
      [/\b(?:civil helper)s?\b/i, 'Civil Helper', 'Construction'],
      [/\b(?:general labourer|general laborer|construction helper|construction worker)s?\b/i, 'General Labourer', 'Construction'],
      [/\b(?:car driver|car drivers?|personal driver)s?\b/i, 'Car Driver', 'Driving'],
      [/\b(?:heavy vehicle driver|lorry driver|truck driver)s?\b/i, 'Heavy Vehicle Driver', 'Driving'],
      [/\b(?:auto driver|auto rickshaw driver)s?\b/i, 'Auto Driver', 'Driving'],
      [/\b(?:delivery driver|delivery rider)s?\b/i, 'Delivery Driver', 'Driving'],
      [/\b(?:delivery executive|delivery boy|delivery person)s?\b/i, 'Delivery Executive', 'Delivery & Logistics'],
      [/\b(?:warehouse helper|warehouse worker)s?\b/i, 'Warehouse Helper', 'Delivery & Logistics'],
      [/\b(?:loader|loading worker)s?\b/i, 'Loader', 'Delivery & Logistics'],
      [/\b(?:house maid|maid|domestic helper)s?\b/i, 'House Maid', 'Domestic Services'],
      [/\b(?:domestic cook|home cook|cook|cooking worker|parotta master|parotta cook|parotta chef)s?\b/i, 'Domestic Cook', 'Domestic Services'],
      [/\b(?:babysitter|baby sitter|child care worker)s?\b/i, 'Babysitter', 'Domestic Services'],
      [/\b(?:caregiver|care giver|patient care worker)s?\b/i, 'Caregiver', 'Domestic Services'],
      [/\b(?:security guard|watchman|security officer)s?\b/i, 'Security Guard', 'Security Services'],
      [/\b(?:security supervisor)s?\b/i, 'Security Supervisor', 'Security Services'],
      [/\b(?:waiter|waitress|hotel server|restaurant server|food server)s?\b/i, 'Waiter', 'Hospitality'],
      [/\b(?:hotel housekeeping|hotel housekeeper|housekeeper|room attendant)s?\b/i, 'Hotel Housekeeper', 'Hospitality'],
      [/\b(?:chef|hotel chef|restaurant chef)s?\b/i, 'Chef', 'Hospitality'],
      [/\b(?:kitchen helper|kitchen assistant)s?\b/i, 'Kitchen Helper', 'Hospitality'],
      [/\b(?:receptionist|front desk executive)s?\b/i, 'Receptionist', 'Hospitality'],
      [/\b(?:sales executive|sales person|salesperson)s?\b/i, 'Sales Executive', 'Retail & Sales'],
      [/\b(?:shop assistant|retail assistant|store assistant)s?\b/i, 'Shop Assistant', 'Retail & Sales'],
      [/\b(?:factory worker|production worker)s?\b/i, 'Factory Worker', 'Manufacturing'],
      [/\b(?:machine operator|production machine operator)s?\b/i, 'Machine Operator', 'Manufacturing'],
      [/\b(?:farm worker|agriculture worker|agricultural worker)s?\b/i, 'Farm Worker', 'Agriculture'],
      [/\b(?:beautician|beauty therapist)s?\b/i, 'Beautician', 'Beauty & Salon'],
      [/\b(?:barber|hair stylist|hairdresser)s?\b/i, 'Barber', 'Beauty & Salon'],
      [/\b(?:office boy|office helper)s?\b/i, 'Office Helper', 'Office Support'],
      [/\b(?:maintenance technician|maintenance worker)s?\b/i, 'Maintenance Technician', 'Maintenance'],
    ];

    const matchedProfession = professionAliases.find(([pattern]) => pattern.test(query));
    const profession = matchedProfession?.[1] ?? null;
    const professionCategory = matchedProfession?.[2] ?? null;

    const workerCountMatch = query.match(/\b(\d+)\s+(?:(?:experienced|skilled|qualified|professional|trained|expert|advanced|intermediate|beginner)\s+)?(?:workers?|people|persons?|electricians?|plumbers?|carpenters?|painters?|masons?|welders?|cooks?|chefs?|waiters?|waitresses?|drivers?|guards?|helpers?|technicians?|operators?|servers?|staff|employees?)\b/i);

    const experienceMatch = query.match(/(?:at least|minimum|min)\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);

    const languages: string[] = [];
    const languagePatterns: Array<[string, RegExp]> = [
      ['Tamil', /\btamil\b/i],
      ['Telugu', /\btelugu\b/i],
      ['Kannada', /\bkannada\b/i],
      ['Malayalam', /\bmalayalam\b/i],
      ['Hindi', /\bhindi\b/i],
      ['English', /\benglish\b/i],
    ];
    for (const [language, pattern] of languagePatterns) {
      if (pattern.test(query)) languages.push(language);
    }

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

    const city = this.extractKnownCity(query);
    const accommodationAvailable = /\baccommodation\s+(?:is\s+)?(?:available|provided)\b/i.test(query);
    const immediate = /\b(?:available\s+immediately|immediately\s+available|immediate)\b/i.test(query);

    const willingToRelocate = /\b(?:willing|ready|can)\s+to\s+relocate\b/i.test(query);
    const willingToTravel = /\b(?:willing|ready|can)\s+to\s+travel\b/i.test(query);
    const mobility = this.extractMobility(query);

    return {
      profession,
      professionCategory,
      skills,
      minimumSkillLevel,
      workerCount: workerCountMatch ? Number(workerCountMatch[1]) : this.extractStandaloneCount(query),
      location: { city, district: null, state: null, pincode: null },
      minimumExperienceYears: experienceMatch ? Number(experienceMatch[1]) : null,
      languages,
      availability: immediate ? 'IMMEDIATE' : null,
      mobility,
      willingToRelocate: willingToRelocate ? true : null,
      willingToTravel: willingToTravel ? true : null,
      accommodationAvailable,
      clarificationRequired: profession === null,
      clarificationQuestion: profession === null ? 'Which type of worker do you need?' : null,
    };
  }

  private extractStandaloneCount(query: string): number | null {
    const match = query.match(/\b(?:need|require|requiring|looking\s+for)\s+(\d+)\b/i);
    return match ? Number(match[1]) : null;
  }

  private extractKnownCity(query: string): string | null {
    const cities: Array<[RegExp, string]> = [
      [/\bchennai\b/i, 'Chennai'],
      [/\b(?:bengaluru|bangalore)\b/i, 'Bengaluru'],
      [/\bcoimbatore\b/i, 'Coimbatore'],
      [/\bmadurai\b/i, 'Madurai'],
      [/\b(?:trichy|tiruchirappalli)\b/i, 'Tiruchirappalli'],
      [/\bsalem\b/i, 'Salem'],
      [/\bthanjavur\b/i, 'Thanjavur'],
      [/\bkumbakonam\b/i, 'Kumbakonam'],
      [/\bmayiladuthurai\b/i, 'Mayiladuthurai'],
    ];
    const match = cities.find(([pattern]) => pattern.test(query));
    return match?.[1] ?? null;
  }

  private extractMobility(query: string): string | null {
    if (/\b(?:anywhere in india|across india|all over india)\b/i.test(query)) return 'ANYWHERE_INDIA';
    if (/\b(?:specific locations?|selected locations?)\b/i.test(query)) return 'SPECIFIC_LOCATIONS';
    if (/\b(?:within the state|within state|same state)\b/i.test(query)) return 'WITHIN_STATE';
    if (/\b(?:within (?:a )?radius|within \d+\s*km|nearby|near the location)\b/i.test(query)) return 'WITHIN_RADIUS';
    if (/\b(?:local|locally|same city|nearby only)\b/i.test(query)) return 'LOCAL';
    return null;
  }
}
