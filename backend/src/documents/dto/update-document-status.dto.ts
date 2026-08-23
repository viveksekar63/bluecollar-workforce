import { VerificationStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateDocumentStatusDto {
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
