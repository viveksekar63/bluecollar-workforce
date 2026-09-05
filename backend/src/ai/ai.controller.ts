import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateJobDraftDto } from './dto/create-job-draft.dto';
import { ParseJobRequirementDto } from './dto/parse-job-requirement.dto';
import { ParseWorkerRequirementDto } from './dto/parse-worker-requirement.dto';
import { WorkerSearchDto } from './dto/worker-search.dto';
import { AiJobRequirementPersistenceService } from './ai-job-requirement-persistence.service';
import { JobRequirementService } from './job-requirement.service';
import { RequirementParserService } from './requirement-parser.service';
import { WorkerSearchService } from './worker-search.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly requirementParserService: RequirementParserService,
    private readonly jobRequirementService: JobRequirementService,
    private readonly workerSearchService: WorkerSearchService,
    private readonly aiJobRequirementPersistenceService: AiJobRequirementPersistenceService,
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

  @Post('job-requirement/create-draft')
  @UseGuards(JwtAuthGuard)
  async createJobDraft(
    @CurrentUser() user: { userId: string },
    @Body() dto: ParseJobRequirementDto & CreateJobDraftDto,
  ) {
    const result = await this.aiJobRequirementPersistenceService.createDraft(user.userId, dto);

    if (!result.job) {
      return {
        success: false,
        ...result.parsed,
      };
    }

    return {
      success: true,
      status: 'DRAFT_CREATED',
      query: dto.query,
      requirement: result.parsed.requirement,
      normalizedRequirement: result.parsed.normalizedRequirement,
      suggestedJob: result.parsed.suggestedJob,
      job: result.job,
      aiRequirements: result.aiRequirements,
    };
  }
}
