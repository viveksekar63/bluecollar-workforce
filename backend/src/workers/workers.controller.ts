import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { WorkersService } from "./workers.service";
import { UpdateWorkerOnboardingDto } from "./dto/update-worker-onboarding.dto";
import { UpdateWorkerProfileDto } from "./dto/update-worker-profile.dto";
import { WorkersQueryDto } from "./dto/workers-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";

@Controller("workers")
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(
    private readonly workersService: WorkersService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  async findAll(@Query() query: WorkersQueryDto) {
    return this.workersService.findAll(query);
  }

  @Get("me")
  async getMyProfile(@Req() request: any) {
    return this.workersService.getMyProfile(
      request.user.userId,
    );
  }

  @Get(":id")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  async findOne(@Param("id") id: string) {
    return this.workersService.findOne(id);
  }

  @Patch("me")
  async updateMyProfile(
    @Req() request: any,
    @Body() dto: UpdateWorkerProfileDto,
  ) {
    return this.workersService.updateMyProfile(
      request.user.userId,
      dto,
    );
  }

  @Patch("me/onboarding")
  async updateMyOnboarding(
    @Req() request: any,
    @Body() dto: UpdateWorkerOnboardingDto,
  ) {
    return this.workersService.updateMyOnboarding(
      request.user.userId,
      dto,
    );
  }
}
