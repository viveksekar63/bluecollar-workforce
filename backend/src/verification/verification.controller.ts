import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  VerificationResultStatus,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { VerificationService } from "./verification.service";

@Controller("verification")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VERIFICATION_READ)
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: VerificationStatus,
  ) {
    return this.verificationService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
    });
  }

  @Get("worker/:workerId")
  @RequirePermissions(PERMISSIONS.VERIFICATION_READ)
  findByWorker(@Param("workerId") workerId: string) {
    return this.verificationService.findByWorker(workerId);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.VERIFICATION_READ)
  findOne(@Param("id") id: string) {
    return this.verificationService.findOne(id);
  }

  @Post("worker/:workerId")
  @RequirePermissions(PERMISSIONS.VERIFICATION_UPDATE)
  create(
    @Param("workerId") workerId: string,
    @Body() body: { types?: VerificationType[] },
  ) {
    return this.verificationService.create(workerId, body);
  }

  @Patch(":id/status")
  @RequirePermissions(PERMISSIONS.VERIFICATION_UPDATE)
  updateStatus(
    @Param("id") id: string,
    @Body() body: { status: VerificationStatus },
  ) {
    return this.verificationService.updateStatus(id, body);
  }

  @Patch(":id/checks/:checkId")
  @RequirePermissions(PERMISSIONS.VERIFICATION_UPDATE)
  updateCheck(
    @Param("checkId") checkId: string,
    @Body()
    body: {
      status: VerificationStatus;
      result?: VerificationResultStatus;
      score?: number;
      remarks?: string;
      evidenceStorageKey?: string;
    },
  ) {
    return this.verificationService.updateCheck(checkId, body);
  }
}
