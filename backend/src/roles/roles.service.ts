import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";
import { CreateRoleDto } from "./dto/create-role.dto";

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async findAll() {
    const roles =
      await this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,

          _count: {
            select: {
              users: true,
              permissions: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissionCount:
        role._count.permissions,
    }));
  }

  async findOne(id: string) {
    const role =
      await this.prisma.role.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,

          users: {
            select: {
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
            },
          },

          permissions: {
            select: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

    if (!role) {
      throw new NotFoundException(
        "Role not found",
      );
    }

    return {
      id: role.id,
      name: role.name,

      users: role.users.map(
        ({ user }) => user,
      ),

      permissions:
        role.permissions.map(
          ({ permission }) =>
            permission,
        ),
    };
  }

  async create(dto: CreateRoleDto) {
  const name = dto.name.trim();

  const existingRole = await this.prisma.role.findUnique({
    where: {
      name,
    },
  });

  if (existingRole) {
    throw new ConflictException(
      `Role "${name}" already exists`,
    );
  }

  return this.prisma.role.create({
    data: {
      name,
      description: dto.description?.trim() || null,
      isSystem: false,
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      users: {
        include: {
          user: true,
        },
      },
    },
  });
}

  async findPermissions() {
    return this.prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },

      orderBy: {
        name: "asc",
      },
    });
  }

  async findRolePermissions(
    id: string,
  ) {
    await this.ensureRole(id);

    const items =
      await this.prisma.rolePermission.findMany(
        {
          where: {
            roleId: id,
          },

          select: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },

          orderBy: {
            permission: {
              name: "asc",
            },
          },
        },
      );

    return items.map(
      ({ permission }) => permission,
    );
  }

  async updatePermissions(
    id: string,
    dto: UpdateRolePermissionsDto,
  ) {
    await this.ensureRole(id);

    const permissionIds: string[] = [
      ...new Set(dto.permissionIds),
    ];

    const permissions =
      await this.prisma.permission.findMany(
        {
          where: {
            id: {
              in: permissionIds,
            },
          },

          select: {
            id: true,
          },
        },
      );

    if (
      permissions.length !==
      permissionIds.length
    ) {
      throw new ConflictException(
        "One or more permissions do not exist",
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.rolePermission.deleteMany(
          {
            where: {
              roleId: id,
            },
          },
        );

        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany(
            {
              data: permissionIds.map(
                (permissionId) => ({
                  roleId: id,
                  permissionId,
                }),
              ),
            },
          );
        }
      },
    );

    return this.findOne(id);
  }

  private async ensureRole(
    id: string,
  ) {
    const role =
      await this.prisma.role.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!role) {
      throw new NotFoundException(
        "Role not found",
      );
    }

    return role;
  }
}