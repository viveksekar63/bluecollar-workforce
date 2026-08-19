import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth/admin')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    return this.authService.adminLogin(
      body.email,
      body.password,
    );
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(
      dto.refreshToken,
    );
  }

  @Post('logout')
  async logout(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.logout(
      dto.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: any) {
    return {
      user:
        await this.authService.getAdminMe(
          request.user.userId,
        ),
    };
  }
}