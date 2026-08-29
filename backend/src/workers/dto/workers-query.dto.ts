import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const MOBILITY_VALUES = [
  'LOCAL',
  'WITHIN_RADIUS',
  'WITHIN_STATE',
  'SPECIFIC_LOCATIONS',
  'ANYWHERE_INDIA',
] as const;

export class WorkersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  professionCategory?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @IsString()
  skill?: string;

  /** Backward-compatible free-text location search. */
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsIn(MOBILITY_VALUES)
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  mobility?: (typeof MOBILITY_VALUES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  radiusKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
