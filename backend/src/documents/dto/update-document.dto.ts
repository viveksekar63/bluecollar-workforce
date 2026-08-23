import { VerificationStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentNumber?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
