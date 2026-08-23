import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { UpdateWorkerOnboardingDto } from "./dto/update-worker-onboarding.dto";
import { UpdateWorkerProfileDto } from "./dto/update-worker-profile.dto";
import { WorkersQueryDto } from "./dto/workers-query.dto";
import { UpdateWorkerSkillsDto } from "./dto/update-worker-skills.dto";
import {
  CreateWorkerEmploymentDto,
  UpdateWorkerEmploymentDto,
} from "./dto/worker-employment.dto";

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

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
          professionCategory: true,
          profession: true,
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
        professionCategory: worker.professionCategory,
        profession: worker.profession,
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
        professionCategory: true,
        profession: true,
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
        professionCategory: true,
        profession: true,
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
        employmentHistory: {
          orderBy: { startDate: "desc" },
          select: {
            id: true,
            companyName: true,
            companyAddress: true,
            designation: true,
            startDate: true,
            endDate: true,
            salary: true,
            employmentType: true,
            supervisorName: true,
            supervisorPhone: true,
            supervisorEmail: true,
            reasonForLeaving: true,
            verificationStatus: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    return worker;
  }

  async getMyEmploymentHistory(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    return this.prisma.employmentHistory.findMany({
      where: { workerId: worker.id },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        companyName: true,
        companyAddress: true,
        designation: true,
        startDate: true,
        endDate: true,
        salary: true,
        employmentType: true,
        supervisorName: true,
        supervisorPhone: true,
        supervisorEmail: true,
        reasonForLeaving: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMyEmploymentHistory(
    userId: string,
    dto: CreateWorkerEmploymentDto,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Invalid start date");
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new Error("Invalid end date");
    }

    if (endDate && endDate < startDate) {
      throw new Error("End date cannot be before start date");
    }

    const employment = await this.prisma.employmentHistory.create({
      data: {
        workerId: worker.id,
        companyName: dto.companyName.trim(),
        companyAddress: dto.companyAddress?.trim() || null,
        designation: dto.designation.trim(),
        startDate,
        endDate,
        salary: dto.salary ?? null,
        employmentType: dto.employmentType,
        supervisorName: dto.supervisorName?.trim() || null,
        supervisorPhone: dto.supervisorPhone?.trim() || null,
        supervisorEmail: dto.supervisorEmail?.trim() || null,
        reasonForLeaving: dto.reasonForLeaving?.trim() || null,
      },
      select: {
        id: true,
        companyName: true,
        companyAddress: true,
        designation: true,
        startDate: true,
        endDate: true,
        salary: true,
        employmentType: true,
        supervisorName: true,
        supervisorPhone: true,
        supervisorEmail: true,
        reasonForLeaving: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return employment;
  }

  async updateMyEmploymentHistory(
    userId: string,
    employmentId: string,
    dto: UpdateWorkerEmploymentDto,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const existing = await this.prisma.employmentHistory.findFirst({
      where: {
        id: employmentId,
        workerId: worker.id,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Employment record not found");
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new Error("End date cannot be before start date");
    }

    return this.prisma.employmentHistory.update({
      where: { id: existing.id },
      data: {
        companyName: dto.companyName.trim(),
        companyAddress: dto.companyAddress?.trim() || null,
        designation: dto.designation.trim(),
        startDate,
        endDate,
        salary: dto.salary ?? null,
        employmentType: dto.employmentType,
        supervisorName: dto.supervisorName?.trim() || null,
        supervisorPhone: dto.supervisorPhone?.trim() || null,
        supervisorEmail: dto.supervisorEmail?.trim() || null,
        reasonForLeaving: dto.reasonForLeaving?.trim() || null,
      },
      select: {
        id: true,
        companyName: true,
        companyAddress: true,
        designation: true,
        startDate: true,
        endDate: true,
        salary: true,
        employmentType: true,
        supervisorName: true,
        supervisorPhone: true,
        supervisorEmail: true,
        reasonForLeaving: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteMyEmploymentHistory(
    userId: string,
    employmentId: string,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const existing = await this.prisma.employmentHistory.findFirst({
      where: {
        id: employmentId,
        workerId: worker.id,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Employment record not found");
    }

    await this.prisma.employmentHistory.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }

  async updateMySkills(
    userId: string,
    dto: UpdateWorkerSkillsDto,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const skillNames = [
      ...new Set(
        dto.skills
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    ];

    const languageNames = [
      ...new Set(
        dto.languages
          .map((language) => language.trim())
          .filter(Boolean),
      ),
    ];

    if (skillNames.length === 0) {
      throw new Error("At least one skill is required");
    }

    if (languageNames.length === 0) {
      throw new Error("At least one language is required");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      type WorkerSkill = {
        id: string;
        name: string;
        createdAt: Date;
        category: string | null;
      };

      type WorkerLanguage = {
        id: string;
        name: string;
      };

      const skills: WorkerSkill[] = [];
      const languages: WorkerLanguage[] = [];

      for (const name of skillNames) {
        const skill = await tx.skill.upsert({
          where: { name },
          update: {},
          create: {
            name,
          },
        });

        skills.push(skill);

        await tx.workerSkill.upsert({
          where: {
            workerId_skillId: {
              workerId: worker.id,
              skillId: skill.id,
            },
          },
          update: {},
          create: {
            workerId: worker.id,
            skillId: skill.id,
          },
        });
      }

      for (const name of languageNames) {
        const language = await tx.language.upsert({
          where: { name },
          update: {},
          create: {
            name,
          },
        });

        languages.push(language);

        await tx.workerLanguage.upsert({
          where: {
            workerId_languageId: {
              workerId: worker.id,
              languageId: language.id,
            },
          },
          update: {},
          create: {
            workerId: worker.id,
            languageId: language.id,
          },
        });
      }

      const updatedWorker = await tx.worker.update({
        where: {
          id: worker.id,
        },
        data: {
          profileCompletion: 80,
        },
        select: {
          id: true,
          workerCode: true,
          profileCompletion: true,
          verificationStatus: true,
          availabilityStatus: true,
        },
      });

      return {
        worker: updatedWorker,
        skills,
        languages,
      };
    });

    return result;
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
        profileCompletion: 40,
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

  async updateMyOnboarding(
    userId: string,
    dto: UpdateWorkerOnboardingDto,
  ) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new NotFoundException("Worker profile not found");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.workerAddress.updateMany({
        where: { workerId: worker.id, isCurrent: true },
        data: { isCurrent: false },
      });

      const address = await tx.workerAddress.create({
        data: {
          workerId: worker.id,
          type: dto.addressType,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 || null,
          city: dto.city,
          district: dto.district || null,
          state: dto.state,
          pincode: dto.pincode,
          isCurrent: true,
        },
      });

      const emergencyContact = await tx.emergencyContact.create({
        data: {
          workerId: worker.id,
          name: dto.emergencyName,
          relationship: dto.emergencyRelationship,
          phone: dto.emergencyPhone,
        },
      });

      const updatedWorker = await tx.worker.update({
        where: { id: worker.id },
        data: { profileCompletion: 60 },
        select: {
          id: true,
          workerCode: true,
          profileCompletion: true,
          verificationStatus: true,
          availabilityStatus: true,
        },
      });

      return { worker: updatedWorker, address, emergencyContact };
    });

    return result;
  }
}