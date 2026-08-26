import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmployerApplicationService } from './employer-application.service';
import { EmployerPaymentService } from './employer-payment.service';
import { JobsService } from './jobs.service';

class CreateJobDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() city!: string;
  @IsOptional() @IsString() district?: string;
  @IsString() state!: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsNumber() salaryMin?: number;
  @IsOptional() @IsNumber() salaryMax?: number;
  @IsString() salaryType!: string;
  @IsOptional() @IsInt() @Min(1) openings?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) skillNames?: string[];
}

class UpdateJobDto extends CreateJobDto {
  @IsOptional() declare title: string;
  @IsOptional() declare description: string;
  @IsOptional() declare city: string;
  @IsOptional() declare state: string;
  @IsOptional() declare salaryType: string;
}

class CreatePaymentMethodDto {
  @IsIn(['CARD', 'UPI', 'BANK_ACCOUNT']) type!: 'CARD' | 'UPI' | 'BANK_ACCOUNT';
  @IsString() label!: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() providerPaymentMethodId?: string;
  @IsOptional() @Matches(/^\d{4}$/) last4?: string;
  @IsOptional() @IsString() upiId?: string;
}

class VerifyJobPaymentDto {
  @IsString() razorpayOrderId!: string;
  @IsString() razorpayPaymentId!: string;
  @IsString() razorpaySignature!: string;
}

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly employerApplicationService: EmployerApplicationService,
    private readonly employerPaymentService: EmployerPaymentService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('recommended')
  async recommended(@CurrentUser() user: { userId: string }, @Query('city') city?: string, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number) {
    return this.jobsService.getRecommendedJobs(user.userId, city, limit);
  }

  @Get('employer/my')
  async myJobs(@CurrentUser() user: { userId: string }) { return this.jobsService.getEmployerJobs(user.userId); }

  @Get('employer/applications')
  async allApplications(@CurrentUser() user: { userId: string }) { return this.jobsService.getAllEmployerApplications(user.userId); }

  @Get('employer/applications/:applicationId')
  async applicationDetails(@CurrentUser() user: { userId: string }, @Param('applicationId') applicationId: string) {
    return this.employerApplicationService.getDetails(user.userId, applicationId);
  }

  @Get('employer/payment-methods')
  async paymentMethods(@CurrentUser() user: { userId: string }) { return this.employerPaymentService.list(user.userId); }

  @Post('employer/payment-methods')
  async createPaymentMethod(@CurrentUser() user: { userId: string }, @Body() dto: CreatePaymentMethodDto) {
    return this.employerPaymentService.create(user.userId, dto);
  }

  // Legacy per-job payment endpoints are kept temporarily for existing test data and backwards compatibility.
  @Post('employer/:id/payment/order')
  async createJobPaymentOrder(@CurrentUser() user: { userId: string }, @Param('id') jobId: string) {
    return this.employerPaymentService.createJobPublishOrder(user.userId, jobId);
  }

  @Post('employer/:id/payment/verify')
  async verifyJobPayment(@CurrentUser() user: { userId: string }, @Param('id') jobId: string, @Body() dto: VerifyJobPaymentDto) {
    await this.employerPaymentService.verifyJobPublishPayment(user.userId, jobId, dto);
    return this.jobsService.publishEmployerJob(user.userId, jobId);
  }

  @Post('employer')
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateJobDto) {
    return this.jobsService.createEmployerJob(user.userId, dto);
  }

  @Put('employer/:id')
  async update(@CurrentUser() user: { userId: string }, @Param('id') jobId: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.updateEmployerJob(user.userId, jobId, dto);
  }

  @Post('employer/:id/publish')
  async publish(@CurrentUser() user: { userId: string }, @Param('id') jobId: string) {
    const employer = await this.jobsService.getEmployer(user.userId);
    await this.subscriptionsService.reserveJobPublishSlot(employer.id);
    try {
      return await this.jobsService.publishEmployerJob(user.userId, jobId);
    } catch (error) {
      await this.subscriptionsService.releaseJobPublishSlot(employer.id);
      throw error;
    }
  }

  @Get('employer/:id/applications')
  async applications(@CurrentUser() user: { userId: string }, @Param('id') jobId: string) {
    return this.jobsService.getEmployerApplications(user.userId, jobId);
  }

  @Post('employer/applications/:applicationId/shortlist')
  async shortlist(@CurrentUser() user: { userId: string }, @Param('applicationId') applicationId: string) {
    return this.jobsService.updateApplicationStatus(user.userId, applicationId, 'SHORTLISTED');
  }

  @Post('employer/applications/:applicationId/reject')
  async reject(@CurrentUser() user: { userId: string }, @Param('applicationId') applicationId: string) {
    return this.jobsService.updateApplicationStatus(user.userId, applicationId, 'REJECTED');
  }

  @Get(':id')
  async findOne(@CurrentUser() user: { userId: string }, @Param('id') jobId: string) {
    return this.jobsService.findOneForWorker(user.userId, jobId);
  }

  @Post(':id/apply')
  async apply(@CurrentUser() user: { userId: string }, @Param('id') jobId: string) {
    return this.jobsService.applyForJob(user.userId, jobId);
  }
}
