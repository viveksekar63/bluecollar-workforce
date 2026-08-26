import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { JobsController } from './jobs.controller';
import { EmployerApplicationService } from './employer-application.service';
import { EmployerPaymentService } from './employer-payment.service';
import { JobsService } from './jobs.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [JobsController],
  providers: [JobsService, EmployerApplicationService, EmployerPaymentService],
})
export class JobsModule {}
