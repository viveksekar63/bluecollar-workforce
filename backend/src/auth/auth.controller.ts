import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { WorkerRegisterDto } from './dto/worker-register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('worker/register')
  async workerRegister(@Body() dto: WorkerRegisterDto) {
    return this.authService.workerRegister(dto);
  }

  @Post('worker/login')
  async workerLogin(@Body() body: { identifier: string; password: string }) {
    return this.authService.workerLogin(body.identifier, body.password);
  }

  @Post('employer/login')
  async employerLogin(@Body() body: { identifier: string; password: string }) {
    return this.authService.employerLogin(body.identifier, body.password);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) { return this.authService.refreshToken(dto.refreshToken); }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) { return this.authService.logout(dto.refreshToken); }

  @UseGuards(JwtAuthGuard)
  @Get('admin/me')
  async me(@Req() request: any) { return { user: await this.authService.getAdminMe(request.user.userId) }; }

  @UseGuards(JwtAuthGuard)
  @Get('admin/permissions')
  async permissions(@Req() request: any) { return { permissions: await this.authService.getAdminPermissions(request.user.userId) }; }
}
