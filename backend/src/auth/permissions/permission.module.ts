import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionService } from './permission.service';
import { PermissionGuard } from './permission.guard';

/**
 * Permissions are used by controllers across the application.
 * Making this module global ensures PermissionGuard can always resolve
 * PermissionService, regardless of which feature module owns the controller.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [PermissionService, PermissionGuard],
  exports: [PermissionService, PermissionGuard],
})
export class PermissionModule {}
