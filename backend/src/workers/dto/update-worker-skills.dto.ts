import {
  ArrayMinSize,
  IsArray,
  IsString,
  MinLength,
} from "class-validator";

export class UpdateWorkerSkillsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  skills!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  languages!: string[];
}