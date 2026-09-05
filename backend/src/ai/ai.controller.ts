import { Body, Controller, Post } from '@nestjs/common';
import { ParseJobRequirementDto } from './dto/parse-job-requirement.dto';
import { ParseWorkerRequirementDto } from './dto/parse-worker-requirement.dto';
import { WorkerSearchDto } from './dto/worker-search.dto';
import { JobRequirementService } from './job-requirement.service';
import { RequirementParserService } from './requirement-parser.service';
import { WorkerSearchService } from './worker-search.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly requirementParserService: RequirementParserService,
    private readonly jobRequirementService: JobRequirementService,
    private readonly workerSearchService: WorkerSearchService,
  ) {}

  @Post('worker-search/parse')
  async parseWorkerSearch(@Body() dto: ParseWorkerRequirementDto) {
    const requirement = await this.requirementParserService.parse(dto.query);

    return {
      success: true,
      query: dto.query,
      requirement,
    };
  }

  @Post('worker-search')
  async workerSearch(@Body() dto: WorkerSearchDto) {
    const result = await this.workerSearchService.search(dto.query, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusKm: dto.radiusKm,
    }, {
      page: dto.page,
      limit: dto.limit,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Post('job-requirement/parse')
  async parseJobRequirement(@Body() dto: ParseJobRequirementDto) {
    const result = await this.jobRequirementService.parse(dto.query);

    return {
      success: true,
      ...result,
    };
  }
}
