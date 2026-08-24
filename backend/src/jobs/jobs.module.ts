import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { EmployerApplicationService } from './employer-application.service';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, EmployerApplicationService],
})
export class JobsModule {}
