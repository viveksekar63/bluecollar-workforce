import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationService } from './registration.service';
import { LoginOtpService } from './login-otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionModule } from './permissions/permission.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          // Keep access tokens short-lived. The mobile app transparently
          // refreshes them using the refresh token when a 401 is received.
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '30m') as StringValue,
        },
      }),
    }),
    PermissionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RegistrationService, LoginOtpService, JwtStrategy, JwtAuthGuard],
  exports: [PermissionModule],
})
export class AuthModule {}
