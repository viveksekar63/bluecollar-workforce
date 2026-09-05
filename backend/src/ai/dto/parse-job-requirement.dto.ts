import { IsString, MinLength } from 'class-validator';

export class ParseJobRequirementDto {
  @IsString()
  @MinLength(5)
  query!: string;
}
