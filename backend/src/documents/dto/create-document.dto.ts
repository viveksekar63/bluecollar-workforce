import { DocumentType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(500)
  storageKey!: string;

  @IsString()
  @MaxLength(150)
  mimeType!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentNumber?: string;
}
