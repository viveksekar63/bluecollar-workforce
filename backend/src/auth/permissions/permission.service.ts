import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissions.add(
          rolePermission.permission.name,
        );
      }
    }

    return Array.from(permissions);
  }

  async hasPermission(
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const permissions =
      await this.getUserPermissions(userId);

    return permissions.includes(permission);
  }

  async hasAnyPermission(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions =
      await this.getUserPermissions(userId);

    return permissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  async hasAllPermissions(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions =
      await this.getUserPermissions(userId);

    return permissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}