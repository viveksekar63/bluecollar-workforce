import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ParseWorkerRequirementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  query: string;
}
