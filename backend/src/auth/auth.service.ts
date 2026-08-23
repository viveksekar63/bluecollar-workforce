import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { PERMISSIONS } from "./permissions/permissions";

import {
  generateRefreshToken,
  hashRefreshToken,
} from './utils/token.utils';
import { PermissionService } from './permissions/permission.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
  ) { }

  async adminLogin(
    email: string,
    password: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        "Invalid email or password",
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        "Invalid email or password",
      );
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException(
        "User account is not active",
      );
    }

    const roles = user.roles.map(
      (userRole) => userRole.role.name,
    );

    const hasAdminAccess =
      await this.permissionService.hasPermission(
        user.id,
        PERMISSIONS.DASHBOARD_VIEW,
      );

    if (!hasAdminAccess) {
      throw new UnauthorizedException(
        "User does not have admin access",
      );
    }

    return this.generateAuthTokens(
      user.id,
      user.email!,
      roles,
    );
  }

  async getAdminPermissions(userId: string) {
    return this.permissionService.getUserPermissions(
      userId,
    );
  }

  private async generateAuthTokens(
    userId: string,
    email: string,
    roles: string[],
  ) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
      roles,
    });

    const refreshToken = generateRefreshToken();

    const refreshTokenHash =
      hashRefreshToken(refreshToken);

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        roles,
      },
    };
  }

  async refreshToken(
    refreshToken: string,
  ) {
    const tokenHash =
      hashRefreshToken(refreshToken);

    const storedToken =
      await this.prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
        },
        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'Refresh token expired',
      );
    }

    const user = storedToken.user;

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'User account is not active',
      );
    }

    const roles = user.roles.map(
      (userRole) => userRole.role.name,
    );

    const hasAdminAccess =
      await this.permissionService.hasPermission(
        user.id,
        PERMISSIONS.DASHBOARD_VIEW,
      );

    if (!hasAdminAccess) {
      throw new UnauthorizedException(
        "User does not have admin access",
      );
    }

    /*
     * TOKEN ROTATION
     *
     * Revoke the old refresh token first.
     */
    await this.prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    /*
     * Generate a completely new
     * access + refresh token pair.
     */
    return this.generateAuthTokens(
      user.id,
      user.email!,
      roles,
    );
  }

  async logout(refreshToken: string) {
    const tokenHash =
      hashRefreshToken(refreshToken);

    const storedToken =
      await this.prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
        },
      });

    if (storedToken) {
      await this.prisma.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async getAdminMe(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
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
      throw new UnauthorizedException(
        'User not found',
      );
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.roles.map(
        (userRole) => userRole.role.name,
      ),
    };
  }
}