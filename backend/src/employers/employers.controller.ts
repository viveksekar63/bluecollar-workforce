import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/permissions/permission.guard';
import { RequirePermissions } from '../auth/permissions/permission.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';

import { CreateEmployerDto } from './dto/create-employer.dto';
import { UpdateEmployerStatusDto } from './dto/update-employer-status.dto';
import { EmployersService } from './employers.service';

@Controller('employers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.EMPLOYERS_READ)
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.employersService.findAll({
      search,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYERS_READ)
  async findOne(@Param('id') id: string) {
    return this.employersService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.EMPLOYERS_CREATE)
  async create(@Body() dto: CreateEmployerDto) {
    return this.employersService.create(dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.EMPLOYERS_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEmployerStatusDto,
  ) {
    return this.employersService.updateStatus(id, dto.status);
  }
}
