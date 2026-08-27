import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmployersService } from './employers.service';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

interface AuthenticatedRequest {
  user: {
    userId?: string;
    sub?: string;
    id?: string;
  };
}

@Controller('employer/profile')
@UseGuards(JwtAuthGuard)
export class EmployerProfileController {
  constructor(private readonly employersService: EmployersService) {}

  /**
   * JwtStrategy exposes the authenticated user's id as `userId`.
   * Keep sub/id fallbacks for compatibility with other auth payload shapes.
   */
  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    return req.user.userId ?? req.user.sub ?? req.user.id ?? '';
  }

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.employersService.getOwnProfile(this.getAuthenticatedUserId(req));
  }

  @Patch()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateEmployerProfileDto,
  ) {
    return this.employersService.updateOwnProfile(
      this.getAuthenticatedUserId(req),
      dto,
    );
  }
}
