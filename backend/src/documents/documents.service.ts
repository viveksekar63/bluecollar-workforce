import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DocumentType, VerificationStatus } from "@prisma/client";
import { randomUUID } from "crypto";

import { PrismaService } from "../prisma/prisma.service";
import { ObjectStorageService } from "../storage/object-storage.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
  ) {}

  private readonly documentSelect = {
    id: true,
    workerId: true,
    type: true,
    fileName: true,
    storageKey: true,
    mimeType: true,
    fileSize: true,
    documentNumber: true,
    verificationStatus: true,
    uploadedAt: true,
    verifiedAt: true,
    verification: { select: { id: true, provider: true, providerRef: true, status: true, remarks: true, verifiedAt: true } },
  } as const;

  async findMine(userId: string) {
    const worker = await this.getWorkerByUserId(userId);
    const documents = await this.prisma.document.findMany({ where: { workerId: worker.id }, orderBy: { uploadedAt: "desc" }, select: this.documentSelect });
    return Promise.all(documents.map(async (document) => ({ ...document, downloadUrl: await this.storage.getSignedUrl(document.storageKey) })));
  }

  async createForWorker(userId: string, dto: CreateDocumentDto) {
    const worker = await this.getWorkerByUserId(userId);
    await this.ensureNoActiveDocument(worker.id, dto.type);
    return this.prisma.document.create({ data: { workerId: worker.id, type: dto.type, fileName: dto.fileName, storageKey: dto.storageKey, mimeType: dto.mimeType, fileSize: dto.fileSize, documentNumber: dto.documentNumber }, select: this.documentSelect });
  }

  async uploadForWorker(userId: string, file: Express.Multer.File, type: DocumentType, documentNumber?: string) {
    if (!file) throw new BadRequestException("A document file is required");
    if (!Object.values(DocumentType).includes(type)) throw new BadRequestException("Invalid document type");
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException("Document size must not exceed 10 MB");

    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) throw new BadRequestException("Only PDF, JPG, PNG or WEBP files are allowed");

    const worker = await this.getWorkerByUserId(userId);
    await this.ensureNoActiveDocument(worker.id, type);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120);
    const storageKey = `workers/${worker.id}/documents/${randomUUID()}-${safeName}`;

    await this.storage.putObject(storageKey, file.buffer, file.mimetype);
    try {
      const document = await this.prisma.document.create({ data: { workerId: worker.id, type, fileName: file.originalname.slice(0, 255), storageKey, mimeType: file.mimetype, fileSize: file.size, documentNumber: documentNumber?.trim() || undefined }, select: this.documentSelect });
      return { ...document, downloadUrl: await this.storage.getSignedUrl(storageKey) };
    } catch (error) {
      await this.storage.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async getMineDownloadUrl(userId: string, documentId: string) {
    const worker = await this.getWorkerByUserId(userId);
    const document = await this.getDocumentForWorker(worker.id, documentId);
    return { documentId: document.id, url: await this.storage.getSignedUrl(document.storageKey), expiresIn: 900 };
  }

  async getWorkerDocumentUrl(workerId: string, documentId: string) {
    const document = await this.getDocumentForWorker(workerId, documentId);
    return { documentId: document.id, url: await this.storage.getSignedUrl(document.storageKey), expiresIn: 900 };
  }

  async updateMine(userId: string, documentId: string, dto: UpdateDocumentDto) {
    const worker = await this.getWorkerByUserId(userId);
    await this.getDocumentForWorker(worker.id, documentId);
    return this.prisma.document.update({ where: { id: documentId }, data: { ...(dto.documentNumber !== undefined ? { documentNumber: dto.documentNumber } : {}) }, select: this.documentSelect });
  }

  async deleteMine(userId: string, documentId: string) {
    const worker = await this.getWorkerByUserId(userId);
    const document = await this.getDocumentForWorker(worker.id, documentId);
    if (document.verificationStatus !== VerificationStatus.PENDING && document.verificationStatus !== VerificationStatus.FAILED) throw new BadRequestException("Only pending or failed documents can be removed");
    await this.prisma.document.delete({ where: { id: documentId } });
    await this.storage.deleteObject(document.storageKey).catch(() => undefined);
    return { success: true };
  }

  async findByWorker(workerId: string) {
    await this.getWorker(workerId);
    return this.prisma.document.findMany({ where: { workerId }, orderBy: { uploadedAt: "desc" }, select: this.documentSelect });
  }

  async updateStatus(documentId: string, status: VerificationStatus, remarks?: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId }, select: { id: true } });
    if (!document) throw new NotFoundException("Document not found");
    const verifiedAt = status === VerificationStatus.VERIFIED ? new Date() : null;
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.document.update({ where: { id: documentId }, data: { verificationStatus: status, verifiedAt }, select: this.documentSelect });
      await tx.documentVerification.upsert({ where: { documentId }, create: { documentId, status, remarks, verifiedAt }, update: { status, remarks, verifiedAt } });
      return result;
    });
  }

  private async ensureNoActiveDocument(workerId: string, type: DocumentType) {
    const existing = await this.prisma.document.findFirst({ where: { workerId, type, verificationStatus: { in: [VerificationStatus.PENDING, VerificationStatus.IN_PROGRESS] } }, select: { id: true } });
    if (existing) throw new BadRequestException(`An active ${type} document already exists for this worker`);
  }

  private async getWorkerByUserId(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId }, select: { id: true } });
    if (!worker) throw new NotFoundException("Worker profile not found");
    return worker;
  }

  private async getWorker(workerId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId }, select: { id: true } });
    if (!worker) throw new NotFoundException("Worker not found");
    return worker;
  }

  private async getDocumentForWorker(workerId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({ where: { id: documentId, workerId }, select: { id: true, storageKey: true, verificationStatus: true } });
    if (!document) throw new NotFoundException("Document not found");
    return document;
  }
}
