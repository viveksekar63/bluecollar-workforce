import { MockAiService } from './mock-ai.service';

describe('MockAiService', () => {
  const service = new MockAiService();

  it('parses hospitality workers without treating workplace as city', async () => {
    const result = await service.generateJson('', 'I need 10 waiters in hotel available immediately');

    expect(result.profession).toBe('Waiter');
    expect(result.professionCategory).toBe('Hospitality');
    expect(result.workerCount).toBe(10);
    expect(result.location).toEqual({
      city: null,
      district: null,
      state: null,
      pincode: null,
    });
    expect(result.availability).toBe('IMMEDIATE');
    expect(result.clarificationRequired).toBe(false);
  });

  it('parses informal local occupation names', async () => {
    const result = await service.generateJson('', 'Need 5 parotta masters in Thanjavur who speak Tamil');

    expect(result.profession).toBe('Domestic Cook');
    expect(result.professionCategory).toBe('Domestic Services');
    expect(result.workerCount).toBe(5);
    expect(result.location).toEqual({
      city: 'Thanjavur',
      district: null,
      state: null,
      pincode: null,
    });
    expect(result.languages).toEqual(['Tamil']);
    expect(result.clarificationRequired).toBe(false);
  });

  it('does not invent a city from a workplace noun', async () => {
    const result = await service.generateJson('', 'Need 10 cooks for my factory immediately');

    expect(result.profession).toBe('Domestic Cook');
    expect(result.workerCount).toBe(10);
    expect((result.location as Record<string, unknown>).city).toBeNull();
  });
});
