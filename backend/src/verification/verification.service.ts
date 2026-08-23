import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  VerificationResultStatus,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface VerificationListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: VerificationStatus;
}

interface CreateVerificationRequestInput {
  types?: VerificationType[];
}

interface UpdateVerificationStatusInput {
  status: VerificationStatus;
}

interface UpdateVerificationCheckInput {
  status: VerificationStatus;
  result?: VerificationResultStatus;
  score?: number;
  remarks?: string;
  evidenceStorageKey?: string;
}

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: VerificationListQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.status) where.status = query.status;

    if (query.search) {
      where.worker = {
        OR: [
          { workerCode: { contains: query.search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search } },
              ],
            },
          },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          overallScore: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          worker: {
            select: {
              id: true,
              workerCode: true,
              verificationStatus: true,
              verificationScore: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
          checks: {
            select: {
              id: true,
              type: true,
              status: true,
              startedAt: true,
              completedAt: true,
              result: { select: { result: true, score: true, remarks: true } },
            },
          },
        },
      }),
      this.prisma.verificationRequest.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const verification = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        worker: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profilePhotoUrl: true,
                status: true,
              },
            },
            addresses: true,
            documents: true,
            employmentHistory: { include: { references: true } },
            education: true,
            certifications: true,
            skills: { include: { skill: true } },
            verificationConsents: true,
          },
        },
        checks: { include: { result: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!verification) {
      throw new NotFoundException("Verification request not found");
    }

    return verification;
  }

  async findByWorker(workerId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker not found");
    }

    return this.prisma.verificationRequest.findMany({
      where: { workerId },
      orderBy: { createdAt: "desc" },
      include: { checks: { include: { result: true } } },
    });
  }

  async create(
    workerId: string,
    input: CreateVerificationRequestInput = {},
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker not found");
    }

    const existing = await this.prisma.verificationRequest.findFirst({
      where: {
        workerId,
        status: {
          in: [VerificationStatus.PENDING, VerificationStatus.IN_PROGRESS],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      throw new BadRequestException(
        "Worker already has an active verification request",
      );
    }

    const types = input.types?.length
      ? [...new Set(input.types)]
      : Object.values(VerificationType);

    const verification = await this.prisma.$transaction(async (tx) => {
      const request = await tx.verificationRequest.create({
        data: {
          workerId,
          status: VerificationStatus.PENDING,
          checks: { create: types.map((type) => ({ type })) },
        },
        include: { checks: true },
      });

      await tx.worker.update({
        where: { id: workerId },
        data: { verificationStatus: VerificationStatus.PENDING },
      });

      return request;
    });

    return this.findOne(verification.id);
  }

  async updateStatus(id: string, input: UpdateVerificationStatusInput) {
    const verification = await this.prisma.verificationRequest.findUnique({
      where: { id },
      select: { id: true, workerId: true, status: true },
    });

    if (!verification) {
      throw new NotFoundException("Verification request not found");
    }

    const startableStatuses: VerificationStatus[] = [
      VerificationStatus.PENDING,
      VerificationStatus.MANUAL_REVIEW,
    ];

    if (
      input.status === VerificationStatus.IN_PROGRESS &&
      !startableStatuses.includes(verification.status)
    ) {
      throw new BadRequestException(
        "Verification can only be started from PENDING or MANUAL_REVIEW",
      );
    }

    const now = new Date();
    const completedStatuses: VerificationStatus[] = [
      VerificationStatus.VERIFIED,
      VerificationStatus.FAILED,
      VerificationStatus.EXPIRED,
    ];
    const completed = completedStatuses.includes(input.status);

    return this.prisma.$transaction(async (tx) => {
      const score =
        input.status === VerificationStatus.VERIFIED
          ? await this.calculateScore(id, tx)
          : undefined;

      const updated = await tx.verificationRequest.update({
        where: { id },
        data: {
          status: input.status,
          startedAt:
            input.status === VerificationStatus.IN_PROGRESS
              ? now
              : undefined,
          completedAt: completed ? now : null,
          overallScore: score,
        },
      });

      await tx.worker.update({
        where: { id: verification.workerId },
        data: {
          verificationStatus: input.status,
          verificationScore: score,
        },
      });

      return updated;
    });
  }

  async updateCheck(checkId: string, input: UpdateVerificationCheckInput) {
    const check = await this.prisma.verificationCheck.findUnique({
      where: { id: checkId },
      include: { verification: true },
    });

    if (!check) {
      throw new NotFoundException("Verification check not found");
    }

    if (input.score !== undefined && (input.score < 0 || input.score > 100)) {
      throw new BadRequestException("Score must be between 0 and 100");
    }

    const completedStatuses: VerificationStatus[] = [
      VerificationStatus.VERIFIED,
      VerificationStatus.FAILED,
      VerificationStatus.MANUAL_REVIEW,
      VerificationStatus.EXPIRED,
    ];
    const completed = completedStatuses.includes(input.status);

    return this.prisma.$transaction(async (tx) => {
      if (input.result) {
        await tx.verificationResult.upsert({
          where: { verificationCheckId: checkId },
          create: {
            verificationCheckId: checkId,
            result: input.result,
            score: input.score,
            remarks: input.remarks,
            evidenceStorageKey: input.evidenceStorageKey,
          },
          update: {
            result: input.result,
            score: input.score,
            remarks: input.remarks,
            evidenceStorageKey: input.evidenceStorageKey,
          },
        });
      }

      const updatedCheck = await tx.verificationCheck.update({
        where: { id: checkId },
        data: {
          status: input.status,
          startedAt:
            input.status === VerificationStatus.IN_PROGRESS
              ? new Date()
              : undefined,
          completedAt: completed ? new Date() : null,
        },
        include: { result: true },
      });

      await this.refreshRequestStatus(check.verificationId, tx);
      return updatedCheck;
    });
  }

  private async refreshRequestStatus(verificationId: string, tx: any) {
    const request = await tx.verificationRequest.findUnique({
      where: { id: verificationId },
      select: { workerId: true, checks: { select: { status: true } } },
    });

    if (!request || request.checks.length === 0) return;

    const statuses: VerificationStatus[] = request.checks.map(
      (check: { status: VerificationStatus }) => check.status,
    );

    let status: VerificationStatus = VerificationStatus.IN_PROGRESS;

    if (
      statuses.every(
        (value: VerificationStatus) => value === VerificationStatus.VERIFIED,
      )
    ) {
      status = VerificationStatus.VERIFIED;
    } else if (
      statuses.some(
        (value: VerificationStatus) => value === VerificationStatus.FAILED,
      )
    ) {
      status = VerificationStatus.FAILED;
    } else if (
      statuses.some(
        (value: VerificationStatus) =>
          value === VerificationStatus.MANUAL_REVIEW,
      )
    ) {
      status = VerificationStatus.MANUAL_REVIEW;
    } else if (
      statuses.every(
        (value: VerificationStatus) => value === VerificationStatus.PENDING,
      )
    ) {
      status = VerificationStatus.PENDING;
    }

    const score = await this.calculateScore(verificationId, tx);
    const completedStatuses: VerificationStatus[] = [
      VerificationStatus.VERIFIED,
      VerificationStatus.FAILED,
    ];
    const completed = completedStatuses.includes(status);

    await tx.verificationRequest.update({
      where: { id: verificationId },
      data: {
        status,
        overallScore: score,
        startedAt:
          status !== VerificationStatus.PENDING ? undefined : null,
        completedAt: completed ? new Date() : null,
      },
    });

    await tx.worker.update({
      where: { id: request.workerId },
      data: { verificationStatus: status, verificationScore: score },
    });
  }

  private async calculateScore(verificationId: string, tx: any): Promise<number | null> {
    const results = await tx.verificationResult.findMany({
      where: {
        verificationCheck: { verificationId },
        score: { not: null },
      },
      select: { score: true },
    });

    if (!results.length) return null;

    const total = results.reduce(
      (sum: number, item: { score: number | null }) =>
        sum + (item.score ?? 0),
      0,
    );

    return Math.round(total / results.length);
  }
}
