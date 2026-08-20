import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { RolesService } from "./roles.service";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get("permissions")
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findPermissions() {
    return this.rolesService.findPermissions();
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Get(":id/permissions")
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findRolePermissions(@Param("id") id: string) {
    return this.rolesService.findRolePermissions(id);
  }

  @Patch(":id/permissions")
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  async updatePermissions(
    @Param("id") id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updatePermissions(id, dto);
  }
}
