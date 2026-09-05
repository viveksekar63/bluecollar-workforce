import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService } from '../jobs/jobs.service';
import { CreateJobDraftDto } from './dto/create-job-draft.dto';
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
    private readonly jobsService: JobsService,
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
    const parsed = await this.jobRequirementService.parse(dto.query);

    if (parsed.status !== 'READY' || !parsed.suggestedJob) {
      return {
        success: false,
        ...parsed,
      };
    }

    const suggestedJob = parsed.suggestedJob;
    const job = await this.jobsService.createEmployerJob(user.userId, {
      title: dto.title?.trim() || suggestedJob.title,
      description: dto.description?.trim() || suggestedJob.description,
      city: suggestedJob.city,
      district: suggestedJob.district,
      state: suggestedJob.state,
      pincode: suggestedJob.pincode,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryType: dto.salaryType,
      openings: suggestedJob.openings,
      startDate: dto.startDate,
      endDate: dto.endDate,
      skillNames: suggestedJob.skillNames,
    });

    return {
      success: true,
      status: 'DRAFT_CREATED',
      query: dto.query,
      requirement: parsed.requirement,
      normalizedRequirement: parsed.normalizedRequirement,
      suggestedJob,
      job,
    };
  }
}
