import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { UpdateWorkerProfileDto } from "./dto/update-worker-profile.dto";

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMyProfile(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        workerCode: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        bio: true,
        experienceYears: true,
        profileCompletion: true,
        verificationStatus: true,
        verificationScore: true,
        availabilityStatus: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        addresses: {
          where: { isCurrent: true },
          orderBy: { createdAt: "desc" },
        },
        emergencyContacts: {
          orderBy: { createdAt: "desc" },
        },
        skills: {
          select: {
            experienceYears: true,
            skillLevel: true,
            verified: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        languages: {
          select: {
            proficiency: true,
            language: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        education: true,
        certifications: true,
      },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    return worker;
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateWorkerProfileDto,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const updated = await this.prisma.worker.update({
      where: { id: worker.id },
      data: {
        ...(dto.dateOfBirth !== undefined
          ? { dateOfBirth: new Date(dto.dateOfBirth) }
          : {}),
        ...(dto.gender !== undefined
          ? { gender: dto.gender }
          : {}),
        ...(dto.maritalStatus !== undefined
          ? { maritalStatus: dto.maritalStatus }
          : {}),
        ...(dto.bio !== undefined
          ? { bio: dto.bio }
          : {}),
        ...(dto.experienceYears !== undefined
          ? { experienceYears: dto.experienceYears }
          : {}),
      },
      select: {
        id: true,
        workerCode: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        bio: true,
        experienceYears: true,
        profileCompletion: true,
        verificationStatus: true,
        verificationScore: true,
        availabilityStatus: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
