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
import { UpdateWorkerProfessionDto } from "./dto/update-worker-profession.dto";
import { WorkersQueryDto } from "./dto/workers-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { UpdateWorkerSkillsDto } from "./dto/update-worker-skills.dto";
import { WorkerProfessionService } from "./worker-profession.service";

@Controller("workers")
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(
    private readonly workersService: WorkersService,
    private readonly workerProfessionService: WorkerProfessionService,
  ) { }

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

  @Get("me/profession")
  async getMyProfession(@Req() request: any) {
    return this.workerProfessionService.getMyProfession(
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

  @Patch("me/skills")
  async updateMySkills(
    @Req() request: any,
    @Body() dto: UpdateWorkerSkillsDto,
  ) {
    return this.workersService.updateMySkills(
      request.user.userId,
      dto,
    );
  }

  @Patch("me/profession")
  async updateMyProfession(
    @Req() request: any,
    @Body() dto: UpdateWorkerProfessionDto,
  ) {
    return this.workerProfessionService.updateMyProfession(
      request.user.userId,
      dto,
    );
  }
}
