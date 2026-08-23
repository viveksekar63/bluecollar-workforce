import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { RolesService } from "./roles.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";

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

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  async create(
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(dto);
  }

  /**
   * IMPORTANT:
   * Static route must come before :id
   */
  @Get("permissions")
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findPermissions() {
    return this.rolesService.findPermissions();
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findOne(
    @Param("id") id: string,
  ) {
    return this.rolesService.findOne(id);
  }

  @Get(":id/permissions")
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  async findRolePermissions(
    @Param("id") id: string,
  ) {
    return this.rolesService.findRolePermissions(
      id,
    );
  }

  @Patch(":id/permissions")
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  async updatePermissions(
    @Param("id") id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updatePermissions(
      id,
      dto,
    );
  }
}