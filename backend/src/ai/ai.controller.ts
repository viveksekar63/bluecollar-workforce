import { Body, Controller, Post } from '@nestjs/common';
import { ParseWorkerRequirementDto } from './dto/parse-worker-requirement.dto';
import { WorkerSearchDto } from './dto/worker-search.dto';
import { RequirementParserService } from './requirement-parser.service';
import { WorkerSearchService } from './worker-search.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly requirementParserService: RequirementParserService,
    private readonly workerSearchService: WorkerSearchService,
  ) {}

  @Post('worker-search/parse')
  async parseWorkerSearch(
    @Body() dto: ParseWorkerRequirementDto,
  ) {
    const requirement =
      await this.requirementParserService.parse(dto.query);

    return {
      success: true,
      query: dto.query,
      requirement,
    };
  }

  @Post('worker-search')
  async workerSearch(
    @Body() dto: WorkerSearchDto,
  ) {
    const result = await this.workerSearchService.search(dto.query, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusKm: dto.radiusKm,
    });

    return {
      success: true,
      ...result,
    };
  }
}
