import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('recommended')
  async recommended(
    @CurrentUser() user: { userId: string },
    @Query('city') city?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.jobsService.getRecommendedJobs(user.userId, city, limit);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { userId: string },
    @Param('id') jobId: string,
  ) {
    return this.jobsService.findOneForWorker(user.userId, jobId);
  }

  @Post(':id/apply')
  async apply(
    @CurrentUser() user: { userId: string },
    @Param('id') jobId: string,
  ) {
    return this.jobsService.applyForJob(user.userId, jobId);
  }
}
