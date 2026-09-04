export interface AiProvider {
  generateJson(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>>;
}
