import { Module } from '@nestjs/common';
import { WorkerImportController } from './worker-import.controller';
import { WorkerImportService } from './worker-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../auth/permissions/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [WorkerImportController],
  providers: [WorkerImportService],
})
export class WorkerImportModule {}
