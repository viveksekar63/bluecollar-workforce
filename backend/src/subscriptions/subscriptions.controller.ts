import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionSyncService } from './subscription-sync.service';
import { SubscriptionsService } from './subscriptions.service';

class CreateSubscriptionDto { @IsString() planCode!: string; }
class VerifySubscriptionDto { @IsString() razorpayPaymentId!: string; @IsString() razorpaySubscriptionId!: string; @IsString() razorpaySignature!: string; }

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService, private readonly subscriptionSyncService: SubscriptionSyncService) {}
  @Get('plans') @UseGuards(JwtAuthGuard) plans() { return this.subscriptionsService.listPlans(); }
  @Get('current') @UseGuards(JwtAuthGuard) current(@CurrentUser() user: { userId: string }) { return this.subscriptionsService.current(user.userId); }
  @Post() @UseGuards(JwtAuthGuard) create(@CurrentUser() user: { userId: string }, @Body() dto: CreateSubscriptionDto) { return this.subscriptionsService.create(user.userId, dto.planCode); }
  @Post('verify') @UseGuards(JwtAuthGuard) verify(@CurrentUser() user: { userId: string }, @Body() dto: VerifySubscriptionDto) { return this.subscriptionsService.verifyCheckout(user.userId, dto); }
  @Post('sync') @UseGuards(JwtAuthGuard) sync(@CurrentUser() user: { userId: string }) { return this.subscriptionSyncService.sync(user.userId); }
  @Post('cancel') @UseGuards(JwtAuthGuard) cancel(@CurrentUser() user: { userId: string }) { return this.subscriptionsService.cancelAtPeriodEnd(user.userId); }
  @Post('webhook') webhook(@Req() request: Request & { rawBody?: Buffer }, @Headers('x-razorpay-signature') signature?: string, @Headers('x-razorpay-event-id') eventId?: string) {
    if (!request.rawBody) throw new Error('Raw webhook body is not available. Enable rawBody in Nest bootstrap.');
    return this.subscriptionsService.handleWebhook(request.rawBody, signature, eventId);
  }
}
