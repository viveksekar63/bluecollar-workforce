import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmployersService } from './employers.service';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

interface AuthenticatedRequest {
  user: { sub?: string; id?: string };
}

@Controller('employer/profile')
@UseGuards(JwtAuthGuard)
export class EmployerProfileController {
  constructor(private readonly employersService: EmployersService) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.employersService.getOwnProfile(req.user.sub ?? req.user.id ?? '');
  }

  @Patch()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateEmployerProfileDto,
  ) {
    return this.employersService.updateOwnProfile(req.user.sub ?? req.user.id ?? '', dto);
  }
}
