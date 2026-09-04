import { Body, Controller, Post } from '@nestjs/common';
import { ParseWorkerRequirementDto } from './dto/parse-worker-requirement.dto';
import { RequirementParserService } from './requirement-parser.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly requirementParserService: RequirementParserService,
  ) {
    console.log('🔥 AiController initialized');
  }

  @Post('worker-search/parse')
  async parseWorkerSearch(
    @Body() dto: ParseWorkerRequirementDto,
  ) {
    console.log('🔥 AI API HIT');
    console.log('🔥 Query:', dto.query);

    const requirement =
      await this.requirementParserService.parse(dto.query);

    console.log('🔥 Parsed requirement:', requirement);

    return {
      success: true,
      query: dto.query,
      requirement,
    };
  }
}