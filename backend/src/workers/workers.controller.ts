import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";

import { WorkersService } from "./workers.service";
import { UpdateWorkerProfileDto } from "./dto/update-worker-profile.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("workers")
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(
    private readonly workersService: WorkersService,
  ) {}

  @Get("me")
  async getMyProfile(@Req() request: any) {
    return this.workersService.getMyProfile(
      request.user.userId,
    );
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
}
