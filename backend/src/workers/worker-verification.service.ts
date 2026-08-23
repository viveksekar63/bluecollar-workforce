import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ConsentType,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { VerificationService } from "../verification/verification.service";

@Injectable()
export class WorkerVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  async getMyVerification(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true, verificationScore: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const [request, consents] = await Promise.all([
      this.prisma.verificationRequest.findFirst({
        where: { workerId: worker.id },
        orderBy: { createdAt: "desc" },
        include: {
          checks: {
            orderBy: { createdAt: "asc" },
            include: { result: true },
          },
        },
      }),
      this.prisma.verificationConsent.findMany({
        where: { workerId: worker.id },
        orderBy: { consentedAt: "desc" },
      }),
    ]);

    return {
      workerStatus: worker.verificationStatus,
      verificationScore: worker.verificationScore,
      request,
      consents,
    };
  }

  async submitConsentAndStart(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true,
      },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const activeRequest = await this.prisma.verificationRequest.findFirst({
      where: {
        workerId: worker.id,
        status: {
          in: [VerificationStatus.PENDING, VerificationStatus.IN_PROGRESS],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        checks: {
          orderBy: { createdAt: "asc" },
          include: { result: true },
        },
      },
    });

    if (activeRequest) {
      return this.getMyVerification(userId);
    }

    const consentTypes = Object.values(ConsentType);

    await this.prisma.$transaction(async (tx) => {
      for (const consentType of consentTypes) {
        await tx.verificationConsent.create({
          data: {
            workerId: worker.id,
            consentType,
            consented: true,
            version: "1.0",
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
          },
        });
      }
    });

    const [employmentCount, educationCount] = await Promise.all([
      this.prisma.employmentHistory.count({ where: { workerId: worker.id } }),
      this.prisma.workerEducation.count({ where: { workerId: worker.id } }),
    ]);

    const types: VerificationType[] = [
      VerificationType.IDENTITY,
      VerificationType.ADDRESS,
      VerificationType.DOCUMENT,
      VerificationType.CRIMINAL,
      VerificationType.SKILL,
    ];

    if (employmentCount > 0) {
      types.push(VerificationType.EMPLOYMENT, VerificationType.REFERENCE);
    }

    if (educationCount > 0) {
      types.push(VerificationType.EDUCATION);
    }

    await this.verificationService.create(worker.id, { types });

    return this.getMyVerification(userId);
  }
}
