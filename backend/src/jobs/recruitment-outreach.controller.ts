import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecruitmentOutreachService } from './recruitment-outreach.service';
import type { OutreachChannel, OutreachStatus } from './recruitment-outreach.service';

class InitializeOutreachDto {
  @IsOptional() @IsString() @IsIn(['PHONE','WHATSAPP','SMS','EMAIL']) preferredChannel?: OutreachChannel;
}

class LogContactDto {
  @IsString() @IsIn(['PHONE','WHATSAPP','SMS','EMAIL']) channel!: OutreachChannel;
  @IsOptional() @IsString() @IsIn(['NOT_CONTACTED','CONTACTED','NO_RESPONSE','INTERESTED','INTERVIEW','SELECTED','HIRED','NOT_INTERESTED','UNAVAILABLE','WRONG_NUMBER']) status?: OutreachStatus;
  @IsOptional() @IsString() @MaxLength(100) outcome?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsISO8601() nextFollowUpAt?: string | null;
}

class UpdateStatusDto {
  @IsString() @IsIn(['NOT_CONTACTED','CONTACTED','NO_RESPONSE','INTERESTED','INTERVIEW','SELECTED','HIRED','NOT_INTERESTED','UNAVAILABLE','WRONG_NUMBER']) status!: OutreachStatus;
  @IsOptional() @IsString() @MaxLength(100) outcome?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsISO8601() nextFollowUpAt?: string | null;
}

class FollowUpDto {
  @IsString() @IsISO8601() nextFollowUpAt!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class RecruitmentOutreachController {
  constructor(private readonly outreach: RecruitmentOutreachService) {}

  @Get(':jobId/outreach')
  list(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number, @Query('status') status?: string) {
    return this.outreach.list(user.userId, jobId, page, limit, status);
  }

  @Get(':jobId/outreach/follow-ups')
  listFollowUps(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return this.outreach.listFollowUps(user.userId, jobId, page, limit);
  }

  @Post(':jobId/workers/:workerId/outreach')
  initialize(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Param('workerId') workerId: string, @Body() dto: InitializeOutreachDto) {
    return this.outreach.initialize(user.userId, jobId, workerId, dto.preferredChannel);
  }

  @Post(':jobId/workers/:workerId/outreach/contact')
  logContact(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Param('workerId') workerId: string, @Body() dto: LogContactDto) {
    return this.outreach.logContact(user.userId, jobId, workerId, dto);
  }

  @Patch(':jobId/workers/:workerId/outreach/status')
  updateStatus(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Param('workerId') workerId: string, @Body() dto: UpdateStatusDto) {
    return this.outreach.updateStatus(user.userId, jobId, workerId, dto);
  }

  @Post(':jobId/workers/:workerId/outreach/follow-up')
  scheduleFollowUp(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Param('workerId') workerId: string, @Body() dto: FollowUpDto) {
    return this.outreach.scheduleFollowUp(user.userId, jobId, workerId, dto.nextFollowUpAt, dto.notes);
  }

  @Get(':jobId/workers/:workerId/outreach/timeline')
  timeline(@CurrentUser() user: { userId: string }, @Param('jobId') jobId: string, @Param('workerId') workerId: string) {
    return this.outreach.timeline(user.userId, jobId, workerId);
  }
}
