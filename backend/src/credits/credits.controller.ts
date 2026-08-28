import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsString, Min } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';

class CreateCreditOrderDto { @IsInt() @Min(1) credits!: number; }
class VerifyCreditPaymentDto { @IsString() orderId!: string; @IsString() paymentId!: string; @IsString() signature!: string; }

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('packages')
  packages() { return this.creditsService.packages(); }

  @Get('balance')
  balance(@CurrentUser() user: { userId: string }) { return this.creditsService.balance(user.userId); }

  @Get('transactions')
  transactions(@CurrentUser() user: { userId: string }) { return this.creditsService.transactions(user.userId); }

  @Post('orders')
  createOrder(@CurrentUser() user: { userId: string }, @Body() dto: CreateCreditOrderDto) {
    return this.creditsService.createOrder(user.userId, dto.credits);
  }

  @Post('verify')
  verify(@CurrentUser() user: { userId: string }, @Body() dto: VerifyCreditPaymentDto) {
    return this.creditsService.verify(user.userId, dto.orderId, dto.paymentId, dto.signature);
  }
}
