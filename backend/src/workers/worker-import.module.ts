import { Module } from '@nestjs/common';
import { WorkerImportController } from './worker-import.controller';
import { WorkerImportService } from './worker-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkerImportController],
  providers: [WorkerImportService],
})
export class WorkerImportModule {}
