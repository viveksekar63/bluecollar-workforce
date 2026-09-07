import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkerInvitationsService } from './worker-invitations.service';

class RespondInvitationDto {
  @IsString()
  @IsIn(['ACCEPT', 'DECLINE'])
  response!: 'ACCEPT' | 'DECLINE';
}

@Controller('worker/invitations')
@UseGuards(JwtAuthGuard)
export class WorkerInvitationsController {
  constructor(private readonly invitations: WorkerInvitationsService) {}

  @Get()
  list(
    @CurrentUser() user: { userId: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.invitations.list(user.userId, page, limit);
  }

  @Post(':invitationId/respond')
  respond(
    @CurrentUser() user: { userId: string },
    @Param('invitationId') invitationId: string,
    @Body() dto: RespondInvitationDto,
  ) {
    return this.invitations.respond(user.userId, invitationId, dto.response);
  }
}
