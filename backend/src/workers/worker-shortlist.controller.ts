import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { WorkerShortlistService } from "./worker-shortlist.service";

@Controller("workers/shortlist")
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions(PERMISSIONS.WORKERS_READ)
export class WorkerShortlistController {
  constructor(private readonly shortlistService: WorkerShortlistService) {}

  @Post(":workerId")
  async add(@Param("workerId") workerId: string, @Req() request: any) {
    this.assertEmployer(request);
    return this.shortlistService.add(request.user.userId, workerId);
  }

  @Delete(":workerId")
  async remove(@Param("workerId") workerId: string, @Req() request: any) {
    this.assertEmployer(request);
    return this.shortlistService.remove(request.user.userId, workerId);
  }

  @Get()
  async list(
    @Req() request: any,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    this.assertEmployer(request);
    return this.shortlistService.list(request.user.userId, page, limit);
  }

  @Get(":workerId/status")
  async status(@Param("workerId") workerId: string, @Req() request: any) {
    this.assertEmployer(request);
    return this.shortlistService.isShortlisted(request.user.userId, workerId);
  }

  private assertEmployer(request: any) {
    const roles: string[] = request.user?.roles ?? [];
    if (!roles.includes("EMPLOYER")) {
      throw new Error("Only employers can manage worker shortlists");
    }
  }
}
