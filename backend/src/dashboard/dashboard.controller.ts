import {
  Controller,
  Get,
  UseGuards,
} from "@nestjs/common";

import { DashboardService } from "./dashboard.service";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  PermissionGuard,
} from "../auth/permissions/permission.guard";

import {
  RequirePermissions,
} from "../auth/permissions/permission.decorator";

import {
  PERMISSIONS,
} from "../auth/permissions/permissions";

@Controller("dashboard")
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.DASHBOARD_VIEW,
  )
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}