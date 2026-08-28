import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/permissions/permission.guard';
import { RequirePermissions } from '../auth/permissions/permission.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { WorkerImportService, WorkerImportRow } from './worker-import.service';

@Controller('admin/workers/import')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions(PERMISSIONS.WORKERS_CREATE)
export class WorkerImportController {
  constructor(private readonly service: WorkerImportService) {}

  @Get('template')
  template(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="worker-import-template.csv"');
    res.send(this.service.template());
  }

  @Post()
  import(@Body('rows') rows: WorkerImportRow[]) {
    return this.service.importRows(rows || []);
  }
}
