import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecruitmentAutopilotService } from './recruitment-autopilot.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class RecruitmentAutopilotController {
  constructor(private readonly autopilot: RecruitmentAutopilotService) {}

  @Get(':jobId/autopilot/recommendations')
  recommendations(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return this.autopilot.recommendations(user.userId, jobId, limit);
  }

  @Get(':jobId/autopilot/conversion-recommendations')
  conversionRecommendations(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return this.autopilot.conversionRecommendations(user.userId, jobId, limit);
  }

  @Get(':jobId/autopilot/next-action')
  nextAction(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string) {
    return this.autopilot.nextAction(user.userId, jobId);
  }

  @Get(':jobId/recruitment-ai/dashboard')
  dashboard(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string) {
    return this.autopilot.dashboard(user.userId, jobId);
  }
}
