import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { UpdateWorkerProfileDto } from "./dto/update-worker-profile.dto";
import { WorkersQueryDto } from "./dto/workers-query.dto";

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: WorkersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: any = {};

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }

    if (query.availability) {
      where.availabilityStatus = query.availability;
    }

    if (query.skill) {
      where.skills = {
        some: {
          skill: {
            name: {
              contains: query.skill.trim(),
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (query.location) {
      const location = query.location.trim();
      where.addresses = {
        some: {
          isCurrent: true,
          OR: [
            { city: { contains: location, mode: "insensitive" } },
            { district: { contains: location, mode: "insensitive" } },
            { state: { contains: location, mode: "insensitive" } },
            { pincode: { contains: location, mode: "insensitive" } },
          ],
        },
      };
    }

    if (search) {
      where.OR = [
        { workerCode: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { bio: { contains: search, mode: "insensitive" } },
        {
          skills: {
            some: {
              skill: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
        {
          addresses: {
            some: {
              isCurrent: true,
              OR: [
                { city: { contains: search, mode: "insensitive" } },
                { district: { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
                { pincode: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const [workers, total] = await this.prisma.$transaction([
      this.prisma.worker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          workerCode: true,
          dateOfBirth: true,
          bio: true,
          experienceYears: true,
          verificationStatus: true,
          verificationScore: true,
          availabilityStatus: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              profilePhotoUrl: true,
            },
          },
          skills: {
            orderBy: { skill: { name: "asc" } },
            take: 1,
            select: {
              skill: {
                select: {
                  name: true,
                },
              },
            },
          },
          addresses: {
            where: { isCurrent: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              city: true,
              state: true,
              district: true,
              pincode: true,
            },
          },
        },
      }),
      this.prisma.worker.count({ where }),
    ]);

    return {
      items: workers.map((worker) => ({
        id: worker.id,
        workerCode: worker.workerCode,
        firstName: worker.user.firstName,
        lastName: worker.user.lastName ?? "",
        phone: worker.user.phone,
        email: worker.user.email,
        profileImageUrl: worker.user.profilePhotoUrl,
        primarySkill: worker.skills[0]?.skill.name ?? "Not specified",
        experienceYears: Number(worker.experienceYears ?? 0),
        city: worker.addresses[0]?.city ?? "Not specified",
        state: worker.addresses[0]?.state ?? "Not specified",
        verificationScore: worker.verificationScore ?? 0,
        verificationStatus: worker.verificationStatus,
        availability: worker.availabilityStatus,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
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
            status: true,
          },
        },
        addresses: {
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
        employmentHistory: {
          orderBy: { startDate: "desc" },
          include: {
            documents: {
              include: {
                document: true,
              },
            },
            references: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
          include: {
            verification: true,
          },
        },
        verificationRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            checks: {
              include: {
                result: true,
              },
            },
          },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException("Worker not found");
    }

    return worker;
  }

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
