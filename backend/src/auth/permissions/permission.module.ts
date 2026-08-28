import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionService } from './permission.service';
import { PermissionGuard } from './permission.guard';

@Module({
  imports: [PrismaModule],
  providers: [PermissionService, PermissionGuard],
  exports: [PermissionService, PermissionGuard],
})
export class PermissionModule {}
