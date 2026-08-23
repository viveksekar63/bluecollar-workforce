import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import { EmploymentType } from "@prisma/client";

export class CreateWorkerEmploymentDto {
  @IsString()
  companyName!: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsString()
  designation!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsString()
  supervisorName?: string;

  @IsOptional()
  @IsString()
  supervisorPhone?: string;

  @IsOptional()
  @IsString()
  supervisorEmail?: string;

  @IsOptional()
  @IsString()
  reasonForLeaving?: string;
}

export class UpdateWorkerEmploymentDto extends CreateWorkerEmploymentDto {}
