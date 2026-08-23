import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { VerificationStatus } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { DocumentsService } from "./documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("me")
  async findMine(@Req() request: any) {
    return this.documentsService.findMine(request.user.userId);
  }

  @Post("me")
  async createMine(
    @Req() request: any,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.createForWorker(
      request.user.userId,
      dto,
    );
  }

  @Patch("me/:id")
  async updateMine(
    @Req() request: any,
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.updateMine(
      request.user.userId,
      id,
      dto,
    );
  }

  @Delete("me/:id")
  async deleteMine(
    @Req() request: any,
    @Param("id") id: string,
  ) {
    return this.documentsService.deleteMine(request.user.userId, id);
  }

  @Get("worker/:workerId")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.DOCUMENTS_READ)
  async findByWorker(@Param("workerId") workerId: string) {
    return this.documentsService.findByWorker(workerId);
  }

  @Patch(":id/status")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.DOCUMENTS_UPDATE)
  async updateStatus(
    @Param("id") id: string,
    @Body()
    body: {
      status: VerificationStatus;
      remarks?: string;
    },
  ) {
    return this.documentsService.updateStatus(
      id,
      body.status,
      body.remarks,
    );
  }
}
