import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentType } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { UpdateDocumentStatusDto } from "./dto/update-document-status.dto";
import { DocumentsService } from "./documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("me")
  async findMine(@Req() request: any) {
    return this.documentsService.findMine(request.user.userId);
  }

  @Post("me/upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadMine(
    @Req() request: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("type") type: string,
    @Body("documentNumber") documentNumber?: string,
  ) {
    if (!type || !Object.values(DocumentType).includes(type as DocumentType)) {
      throw new BadRequestException("A valid document type is required");
    }
    return this.documentsService.uploadForWorker(request.user.userId, file, type as DocumentType, documentNumber);
  }

  @Get("me/:id/url")
  async getMineDownloadUrl(@Req() request: any, @Param("id") id: string) {
    return this.documentsService.getMineDownloadUrl(request.user.userId, id);
  }

  @Post("me")
  async createMine(@Req() request: any, @Body() dto: CreateDocumentDto) {
    return this.documentsService.createForWorker(request.user.userId, dto);
  }

  @Patch("me/:id")
  async updateMine(@Req() request: any, @Param("id") id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.updateMine(request.user.userId, id, dto);
  }

  @Delete("me/:id")
  async deleteMine(@Req() request: any, @Param("id") id: string) {
    return this.documentsService.deleteMine(request.user.userId, id);
  }

  @Get("worker/:workerId")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.DOCUMENTS_READ)
  async findByWorker(@Param("workerId") workerId: string) {
    return this.documentsService.findByWorker(workerId);
  }

  @Get("worker/:workerId/:id/url")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.DOCUMENTS_READ)
  async getWorkerDocumentUrl(@Param("workerId") workerId: string, @Param("id") documentId: string) {
    return this.documentsService.getWorkerDocumentUrl(workerId, documentId);
  }

  @Patch(":id/status")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.DOCUMENTS_UPDATE)
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documentsService.updateStatus(id, dto.status, dto.remarks);
  }
}
