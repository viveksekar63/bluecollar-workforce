import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async generateJson(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-5-mini';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'AI service is not configured',
      );
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model,
          input: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          text: {
            format: {
              type: 'json_object',
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const outputText = this.extractOutputText(response.data);

      if (!outputText) {
        throw new Error('AI returned an empty response');
      }

      return JSON.parse(outputText);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadGatewayException(
          'AI returned invalid structured data',
        );
      }

      if (axios.isAxiosError(error)) {
        throw new BadGatewayException(
          error.response?.data?.error?.message ||
            'AI provider request failed',
        );
      }

      throw new BadGatewayException('AI requirement parsing failed');
    }
  }

  private extractOutputText(data: any): string | null {
    if (typeof data?.output_text === 'string') {
      return data.output_text;
    }

    const output = data?.output;

    if (!Array.isArray(output)) {
      return null;
    }

    for (const item of output) {
      if (!Array.isArray(item?.content)) {
        continue;
      }

      for (const content of item.content) {
        if (
          content?.type === 'output_text' &&
          typeof content?.text === 'string'
        ) {
          return content.text;
        }
      }
    }

    return null;
  }
}
