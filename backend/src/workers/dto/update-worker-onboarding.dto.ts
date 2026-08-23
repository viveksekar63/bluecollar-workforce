import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator";

import { AddressType } from "@prisma/client";

export class UpdateWorkerOnboardingDto {
  @IsEnum(AddressType)
  addressType!: AddressType;

  @IsString()
  @MinLength(3)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pincode!: string;

  @IsString()
  @MinLength(2)
  emergencyName!: string;

  @IsString()
  @MinLength(2)
  emergencyRelationship!: string;

  @IsString()
  @IsPhoneNumber(undefined)
  emergencyPhone!: string;
}
