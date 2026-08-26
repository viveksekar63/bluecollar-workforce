import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RegistrationService } from "./registration.service";

import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

import { PermissionService } from "./permissions/permission.service";
import { PermissionGuard } from "./permissions/permission.guard";

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.get<string>(
            "JWT_ACCESS_SECRET",
          ),

        signOptions: {
          expiresIn:
            configService.get<
              "1d" | "7d" | "30d"
            >("JWT_ACCESS_EXPIRES_IN") || "1d",
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    RegistrationService,
    JwtStrategy,
    JwtAuthGuard,

    PermissionService,
    PermissionGuard,
  ],

  exports: [
    PermissionService,
    PermissionGuard,
  ],
})
export class AuthModule {}