import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export const WORK_MOBILITIES = [
  "LOCAL",
  "WITHIN_RADIUS",
  "WITHIN_STATE",
  "SPECIFIC_LOCATIONS",
  "ANYWHERE_INDIA",
] as const;

export type WorkMobility = (typeof WORK_MOBILITIES)[number];

export class PreferredLocationDto {
  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateWorkerWorkPreferencesDto {
  @IsIn(WORK_MOBILITIES)
  mobility!: WorkMobility;

  @IsOptional()
  @IsBoolean()
  willingToRelocate?: boolean;

  @IsOptional()
  @IsBoolean()
  willingToTravel?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PreferredLocationDto)
  preferredLocations?: PreferredLocationDto[];
}
