import { Module } from '@nestjs/common';
import { WorkerImportController } from './worker-import.controller';
import { WorkerImportService } from './worker-import.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkerImportController],
  providers: [WorkerImportService],
})
export class WorkerImportModule {}
