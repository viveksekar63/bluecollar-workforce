import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkersModule } from './workers/workers.module';
import { EmployersModule } from './employers/employers.module';
import { EmploymentModule } from './employment/employment.module';
import { DocumentsModule } from './documents/documents.module';
import { VerificationModule } from './verification/verification.module';
import { SkillsModule } from './skills/skills.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PaymentsModule } from './payments/payments.module';
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [AuthModule, UsersModule, WorkersModule, EmployersModule, EmploymentModule, DocumentsModule, VerificationModule, SkillsModule, JobsModule, ApplicationsModule, AttendanceModule, PaymentsModule, RatingsModule, NotificationsModule, ComplaintsModule, AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
