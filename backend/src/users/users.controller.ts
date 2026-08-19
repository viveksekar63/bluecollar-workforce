import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { UsersService } from "./users.service";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { UsersQueryDto } from "./dto/users-query.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { PermissionGuard } from "../auth/permissions/permission.guard";

import { RequirePermissions } from "../auth/permissions/permission.decorator";

import { PERMISSIONS } from "../auth/permissions/permissions";

@Controller("users")
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @RequirePermissions(
    PERMISSIONS.USERS_READ,
  )
  async findAll(
    @Query() query: UsersQueryDto,
  ) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions(
    PERMISSIONS.USERS_READ,
  )
  async findOne(
    @Param("id") id: string,
  ) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions(
    PERMISSIONS.USERS_CREATE,
  )
  async create(
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions(
    PERMISSIONS.USERS_UPDATE,
  )
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      dto,
    );
  }

  @Patch(":id/status")
  @RequirePermissions(
    PERMISSIONS.USERS_UPDATE,
  )
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Req() request: any,
  ) {
    return this.usersService.updateStatus(
      id,
      status,
      request.user.userId,
    );
  }

  @Patch(":id/roles")
  @RequirePermissions(
    PERMISSIONS.USERS_MANAGE_ROLES,
  )
  async updateRoles(
    @Param("id") id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.usersService.updateRoles(
      id,
      dto,
    );
  }

  @Delete(":id")
  @RequirePermissions(
    PERMISSIONS.USERS_DELETE,
  )
  async remove(
    @Param("id") id: string,
    @Req() request: any,
  ) {
    return this.usersService.remove(
      id,
      request.user.userId,
    );
  }
}
