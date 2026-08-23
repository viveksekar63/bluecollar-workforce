import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { UsersQueryDto } from "./dto/users-query.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.roleId) where.roles = { some: { roleId: query.roleId } };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        select: {
          id: true, phone: true, email: true, firstName: true, lastName: true,
          profilePhotoUrl: true, status: true, createdAt: true, updatedAt: true,
          roles: { select: { role: { select: { id: true, name: true } } } },
          worker: { select: { id: true, workerCode: true, verificationStatus: true } },
          employer: { select: { id: true, companyName: true, status: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data: users.map((user) => ({ ...user, roles: user.roles.map((userRole) => userRole.role) })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, phone: true, email: true, firstName: true, lastName: true,
        profilePhotoUrl: true, status: true, createdAt: true, updatedAt: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
        worker: { select: { id: true, workerCode: true, verificationStatus: true } },
        employer: { select: { id: true, companyName: true, status: true, companyType: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return { ...user, roles: user.roles.map((userRole) => userRole.role) };
  }

  async create(dto: CreateUserDto) {
    if (await this.prisma.user.findUnique({ where: { email: dto.email } })) {
      throw new ConflictException("Email is already registered");
    }
    if (await this.prisma.user.findUnique({ where: { phone: dto.phone } })) {
      throw new ConflictException("Phone number is already registered");
    }
    const roles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds } } });
    if (roles.length !== dto.roleIds.length) throw new BadRequestException("One or more roles are invalid");
    const isEmployer = roles.some((role) => role.name === "EMPLOYER");
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          phone: dto.phone, email: dto.email, passwordHash,
          firstName: dto.firstName, lastName: dto.lastName, profilePhotoUrl: dto.profilePhotoUrl,
          roles: { create: dto.roleIds.map((roleId) => ({ roleId })) },
        },
        select: {
          id: true, phone: true, email: true, firstName: true, lastName: true,
          profilePhotoUrl: true, status: true, createdAt: true,
          roles: { select: { role: { select: { id: true, name: true } } } },
        },
      });
      if (isEmployer) {
        await tx.employer.create({
          data: {
            userId: createdUser.id,
            companyName: `${createdUser.firstName}${createdUser.lastName ? ` ${createdUser.lastName}` : ""}`.trim(),
            status: "PENDING",
          },
        });
      }
      return createdUser;
    });
    return { ...user, roles: user.roles.map((userRole) => userRole.role) };
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("User not found");
    if (dto.email && dto.email !== existing.email && await this.prisma.user.findUnique({ where: { email: dto.email } })) {
      throw new ConflictException("Email is already registered");
    }
    if (dto.phone && dto.phone !== existing.phone && await this.prisma.user.findUnique({ where: { phone: dto.phone } })) {
      throw new ConflictException("Phone number is already registered");
    }
    const data: any = { phone: dto.phone, email: dto.email, firstName: dto.firstName, lastName: dto.lastName, profilePhotoUrl: dto.profilePhotoUrl };
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.update({
      where: { id }, data,
      select: { id: true, phone: true, email: true, firstName: true, lastName: true, profilePhotoUrl: true, status: true, createdAt: true, updatedAt: true, roles: { select: { role: { select: { id: true, name: true } } } } },
    });
    return { ...user, roles: user.roles.map((userRole) => userRole.role) };
  }

  async updateStatus(id: string, status: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } }, employer: true } });
    if (!user) throw new NotFoundException("User not found");
    if (id === currentUserId && status !== "ACTIVE") throw new ForbiddenException("You cannot deactivate your own account");
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new BadRequestException("Invalid user status");
    const isEmployer = user.roles.some((userRole) => userRole.role.name === "EMPLOYER");
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id }, data: { status: status as any }, select: { id: true, status: true } });
      if (isEmployer && user.employer) {
        await tx.employer.update({ where: { id: user.employer.id }, data: { status: status === "ACTIVE" ? "ACTIVE" : "SUSPENDED" } });
      }
      return result;
    });
  }

  async updateRoles(id: string, dto: UpdateUserRolesDto) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { employer: true } });
    if (!user) throw new NotFoundException("User not found");
    const roles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds } } });
    if (roles.length !== dto.roleIds.length) throw new BadRequestException("One or more roles are invalid");
    const isEmployer = roles.some((role) => role.name === "EMPLOYER");
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length) await tx.userRole.createMany({ data: dto.roleIds.map((roleId) => ({ userId: id, roleId })) });
      if (isEmployer && !user.employer) {
        await tx.employer.create({ data: { userId: id, companyName: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`.trim(), status: user.status === "ACTIVE" ? "ACTIVE" : "PENDING" } });
      } else if (!isEmployer && user.employer) {
        await tx.employer.delete({ where: { id: user.employer.id } });
      }
    });
    return this.findOne(id);
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) throw new ForbiddenException("You cannot delete your own account");
    if (!(await this.prisma.user.findUnique({ where: { id } }))) throw new NotFoundException("User not found");
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
