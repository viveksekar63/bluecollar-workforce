import {
  Controller,
  Get,
  UseGuards,
} from "@nestjs/common";

import { RolesService } from "./roles.service";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { PermissionGuard } from "../auth/permissions/permission.guard";

import { RequirePermissions } from "../auth/permissions/permission.decorator";

import { PERMISSIONS } from "../auth/permissions/permissions";

@Controller("roles")
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.ROLES_READ,
  )
  async findAll() {
    return this.rolesService.findAll();
  }
}