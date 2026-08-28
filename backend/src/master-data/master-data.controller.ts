import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/permissions/permission.guard';
import { RequirePermissions } from '../auth/permissions/permission.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import { MasterDataService } from './master-data.service';

class CategoryDto { @IsString() code!: string; @IsString() name!: string; }
class ProfessionDto { @IsString() categoryId!: string; @IsString() code!: string; @IsString() name!: string; }
class LocationDto {
  @IsIn(['STATE', 'DISTRICT', 'CITY']) type!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() pincode?: string;
}
class ActiveDto { @IsBoolean() isActive!: boolean; }

@Controller('master-data')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  @Get('categories')
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  categories(@Query('includeInactive') includeInactive?: string) { return this.service.categories(includeInactive === 'true'); }

  @Get('professions')
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  professions(@Query('categoryId') categoryId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.service.professions(categoryId, includeInactive === 'true');
  }

  @Get('locations')
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  locations(@Query('type') type?: string, @Query('parentId') parentId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.service.locations(type, parentId, includeInactive === 'true');
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.WORKERS_UPDATE)
  createCategory(@Body() dto: CategoryDto) { return this.service.createCategory(dto.code, dto.name); }

  @Post('professions')
  @RequirePermissions(PERMISSIONS.WORKERS_UPDATE)
  createProfession(@Body() dto: ProfessionDto) { return this.service.createProfession(dto.categoryId, dto.code, dto.name); }

  @Post('locations')
  @RequirePermissions(PERMISSIONS.WORKERS_UPDATE)
  createLocation(@Body() dto: LocationDto) { return this.service.createLocation(dto.type, dto.name, dto.parentId, dto.code, dto.pincode); }

  @Patch('categories/:id/status')
  @RequirePermissions(PERMISSIONS.WORKERS_UPDATE)
  categoryStatus(@Param('id') id: string, @Body() dto: ActiveDto) { return this.service.setActive('category', id, dto.isActive); }

  @Patch('professions/:id/status')
  @RequirePermissions(PERMISSIONS.WORKERS_UPDATE)
  professionStatus(@Param('id') id: string, @Body() dto: ActiveDto) { return this.service.setActive('profession', id, dto.isActive); }

  @Patch('locations/:id/status')
  @RequirePermissions(PERMISSIONS.WORKERS_UPDATE)
  locationStatus(@Param('id') id: string, @Body() dto: ActiveDto) { return this.service.setActive('location', id, dto.isActive); }
}
