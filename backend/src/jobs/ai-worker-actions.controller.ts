import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AiWorkerActionsService,
  WorkerActionSnapshot,
} from './ai-worker-actions.service';

class WorkerActionDto implements WorkerActionSnapshot {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  matchScore?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'BEST_MATCH',
    'STRONG_MATCH',
    'GOOD_MATCH',
    'PARTIAL_MATCH',
    'NOT_RECOMMENDED',
  ])
  matchTier?: WorkerActionSnapshot['matchTier'];

  @IsOptional()
  @IsObject()
  matchExplanation?: Record<string, unknown>;
}

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class AiWorkerActionsController {
  constructor(private readonly actions: AiWorkerActionsService) {}

  @Post(':jobId/workers/:workerId/shortlist')
  shortlist(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Param('workerId') workerId: string,
    @Body() dto: WorkerActionDto,
  ) {
    return this.actions.shortlist(user.userId, jobId, workerId, dto);
  }

  @Get(':jobId/shortlisted-workers')
  shortlistedWorkers(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.actions.listShortlisted(user.userId, jobId, page, limit);
  }

  @Delete(':jobId/workers/:workerId/shortlist')
  removeShortlist(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Param('workerId') workerId: string,
  ) {
    return this.actions.removeShortlist(user.userId, jobId, workerId);
  }

  @Post(':jobId/workers/:workerId/invite')
  invite(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Param('workerId') workerId: string,
    @Body() dto: WorkerActionDto,
  ) {
    return this.actions.invite(user.userId, jobId, workerId, dto);
  }
}
