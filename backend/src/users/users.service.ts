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
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: UsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        {
          firstName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: query.search,
          },
        },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.roleId) {
      where.roles = {
        some: {
          roleId: query.roleId,
        },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,

          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          worker: {
            select: {
              id: true,
              workerCode: true,
              verificationStatus: true,
            },
          },

          employer: {
            select: {
              id: true,
            },
          },
        },
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        roles: user.roles.map(
          (userRole) => userRole.role,
        ),
      })),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        worker: {
          select: {
            id: true,
            workerCode: true,
            verificationStatus: true,
          },
        },

        employer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    return {
      ...user,
      roles: user.roles.map(
        (userRole) => userRole.role,
      ),
    };
  }

  async create(dto: CreateUserDto) {
    const existingEmail =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (existingEmail) {
      throw new ConflictException(
        "Email is already registered",
      );
    }

    const existingPhone =
      await this.prisma.user.findUnique({
        where: {
          phone: dto.phone,
        },
      });

    if (existingPhone) {
      throw new ConflictException(
        "Phone number is already registered",
      );
    }

    const roles =
      await this.prisma.role.findMany({
        where: {
          id: {
            in: dto.roleIds,
          },
        },
      });

    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException(
        "One or more roles are invalid",
      );
    }

    const passwordHash =
      await bcrypt.hash(dto.password, 12);

    const user =
      await this.prisma.$transaction(
        async (tx) => {
          const createdUser =
            await tx.user.create({
              data: {
                phone: dto.phone,
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                profilePhotoUrl:
                  dto.profilePhotoUrl,

                roles: {
                  create: dto.roleIds.map(
                    (roleId) => ({
                      roleId,
                    }),
                  ),
                },
              },

              select: {
                id: true,
                phone: true,
                email: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                status: true,
                createdAt: true,

                roles: {
                  select: {
                    role: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            });

          return createdUser;
        },
      );

    return {
      ...user,
      roles: user.roles.map(
        (userRole) => userRole.role,
      ),
    };
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ) {
    const existing =
      await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        "User not found",
      );
    }

    if (
      dto.email &&
      dto.email !== existing.email
    ) {
      const emailExists =
        await this.prisma.user.findUnique({
          where: {
            email: dto.email,
          },
        });

      if (emailExists) {
        throw new ConflictException(
          "Email is already registered",
        );
      }
    }

    if (
      dto.phone &&
      dto.phone !== existing.phone
    ) {
      const phoneExists =
        await this.prisma.user.findUnique({
          where: {
            phone: dto.phone,
          },
        });

      if (phoneExists) {
        throw new ConflictException(
          "Phone number is already registered",
        );
      }
    }

    const data: any = {
      phone: dto.phone,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      profilePhotoUrl:
        dto.profilePhotoUrl,
    };

    if (dto.password) {
      data.passwordHash =
        await bcrypt.hash(
          dto.password,
          12,
        );
    }

    const user =
      await this.prisma.user.update({
        where: {
          id,
        },

        data,

        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,

          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    return {
      ...user,
      roles: user.roles.map(
        (userRole) => userRole.role,
      ),
    };
  }

  async updateStatus(
    id: string,
    status: string,
    currentUserId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id,
        },

        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    if (
      id === currentUserId &&
      status !== "ACTIVE"
    ) {
      throw new ForbiddenException(
        "You cannot deactivate your own account",
      );
    }

    const isSuperAdmin =
      user.roles.some(
        (userRole) =>
          userRole.role.name ===
          "SUPER_ADMIN",
      );

    if (
      isSuperAdmin &&
      status !== "ACTIVE"
    ) {
      const activeSuperAdmins =
        await this.countActiveSuperAdmins();

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException(
          "The last active SUPER_ADMIN cannot be deactivated",
        );
      }
    }

    const updated =
      await this.prisma.user.update({
        where: {
          id,
        },

        data: {
          status: status as any,
        },

        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          updatedAt: true,
        },
      });

    return updated;
  }

  async updateRoles(
    id: string,
    dto: UpdateUserRolesDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    const roles =
      await this.prisma.role.findMany({
        where: {
          id: {
            in: dto.roleIds,
          },
        },
      });

    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException(
        "One or more roles are invalid",
      );
    }

    const containsSuperAdmin =
      roles.some(
        (role) =>
          role.name === "SUPER_ADMIN",
      );

    if (containsSuperAdmin) {
      // SUPER_ADMIN role assignment is intentionally
      // allowed only through this permission-protected endpoint.
    }

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.userRole.deleteMany({
            where: {
              userId: id,
            },
          });

          await tx.userRole.createMany({
            data: dto.roleIds.map(
              (roleId) => ({
                userId: id,
                roleId,
              }),
            ),
          });

          return tx.user.findUniqueOrThrow({
            where: {
              id,
            },

            select: {
              id: true,
              phone: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,

              roles: {
                select: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });
        },
      );

    return {
      ...updated,
      roles: updated.roles.map(
        (userRole) => userRole.role,
      ),
    };
  }

  async remove(
    id: string,
    currentUserId: string,
  ) {
    if (id === currentUserId) {
      throw new ForbiddenException(
        "You cannot delete your own account",
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id,
        },

        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        "User not found",
      );
    }

    const isSuperAdmin =
      user.roles.some(
        (userRole) =>
          userRole.role.name ===
          "SUPER_ADMIN",
      );

    if (isSuperAdmin) {
      const activeSuperAdmins =
        await this.countActiveSuperAdmins();

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException(
          "The last SUPER_ADMIN cannot be deleted",
        );
      }
    }

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return {
      message: "User deleted successfully",
    };
  }

  private async countActiveSuperAdmins() {
    return this.prisma.user.count({
      where: {
        status: "ACTIVE" as any,

        roles: {
          some: {
            role: {
              name: "SUPER_ADMIN",
            },
          },
        },
      },
    });
  }
}
