import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PermissionService } from "./permissions/permission.service";

describe("AuthService", () => {
  let service: AuthService;

  const prismaServiceMock = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const permissionServiceMock = {
    getUserPermissions: jest.fn(),
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,

          {
            provide: PrismaService,
            useValue: prismaServiceMock,
          },

          {
            provide: JwtService,
            useValue: jwtServiceMock,
          },

          {
            provide: ConfigService,
            useValue: configServiceMock,
          },

          {
            provide: PermissionService,
            useValue: permissionServiceMock,
          },
        ],
      }).compile();

    service =
      module.get<AuthService>(
        AuthService,
      );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});