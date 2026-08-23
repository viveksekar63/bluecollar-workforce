import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export interface UpdateWorkerProfessionInput {
  professionCategory: string;
  profession: string;
}

@Injectable()
export class WorkerProfessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfession(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: {
        professionCategory: true,
        profession: true,
        profileCompletion: true,
      },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    return worker;
  }

  async updateMyProfession(
    userId: string,
    input: UpdateWorkerProfessionInput,
  ) {
    const category = input.professionCategory.trim();
    const profession = input.profession.trim();

    if (!category || !profession) {
      throw new Error("Profession category and profession are required");
    }

    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    return this.prisma.worker.update({
      where: { id: worker.id },
      data: {
        professionCategory: category,
        profession,
        profileCompletion: 100,
      },
      select: {
        id: true,
        workerCode: true,
        professionCategory: true,
        profession: true,
        profileCompletion: true,
        verificationStatus: true,
        availabilityStatus: true,
      },
    });
  }
}
