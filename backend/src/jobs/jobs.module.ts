import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiWorkerActionsController } from './ai-worker-actions.controller';
import { AiWorkerActionsService } from './ai-worker-actions.service';
import { RecruitmentOutreachController } from './recruitment-outreach.controller';
import { RecruitmentOutreachService } from './recruitment-outreach.service';
import { JobsController } from './jobs.controller';
import { EmployerApplicationService } from './employer-application.service';
import { EmployerPaymentService } from './employer-payment.service';
import { JobsService } from './jobs.service';

@Module({
  imports: [SubscriptionsModule, NotificationsModule],
  controllers: [JobsController, AiWorkerActionsController, RecruitmentOutreachController],
  providers: [
    JobsService,
    EmployerApplicationService,
    EmployerPaymentService,
    AiWorkerActionsService,
    RecruitmentOutreachService,
  ],
  exports: [JobsService, AiWorkerActionsService, RecruitmentOutreachService],
})
export class JobsModule {}
