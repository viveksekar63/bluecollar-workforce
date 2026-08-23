import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployerStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployerDto } from './dto/create-employer.dto';

interface EmployerListQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class EmployersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly employerSelect = {
    id: true,
    companyName: true,
    companyType: true,
    registrationNo: true,
    gstNumber: true,
    description: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
      },
    },
    _count: {
      select: { jobs: true },
    },
  } as const;

  async findAll(query: EmployerListQuery) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && Object.values(EmployerStatus).includes(query.status as EmployerStatus)) {
      where.status = query.status as EmployerStatus;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.employer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.employerSelect,
      }),
      this.prisma.employer.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id },
      select: this.employerSelect,
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    return employer;
  }

  async create(dto: CreateEmployerDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    const [existingEmail, existingPhone, employerRole] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.user.findUnique({ where: { phone } }),
      this.prisma.role.findUnique({ where: { name: 'EMPLOYER' } }),
    ]);

    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    if (!employerRole) {
      throw new NotFoundException('EMPLOYER role is not configured');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName?.trim() || null,
          roles: {
            create: {
              roleId: employerRole.id,
            },
          },
        },
      });

      return tx.employer.create({
        data: {
          userId: user.id,
          companyName: dto.companyName.trim(),
          companyType: dto.companyType?.trim() || null,
          registrationNo: dto.registrationNo?.trim() || null,
          gstNumber: dto.gstNumber?.trim() || null,
          description: dto.description?.trim() || null,
          status: EmployerStatus.PENDING,
        },
        select: this.employerSelect,
      });
    });
  }

  async updateStatus(id: string, status: 'VERIFIED' | 'SUSPENDED') {
    const employer = await this.prisma.employer.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.employer.update({
        where: { id },
        data: { status: status as EmployerStatus },
      });

      await tx.user.update({
        where: { id: employer.userId },
        data: { status: status === 'VERIFIED' ? 'ACTIVE' : 'INACTIVE' },
      });

      return tx.employer.findUnique({
        where: { id },
        select: this.employerSelect,
      });
    });
  }
}
