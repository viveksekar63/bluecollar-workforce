import { IsNotEmpty, IsString } from "class-validator";

export class UpdateWorkerProfessionDto {
  @IsString()
  @IsNotEmpty()
  professionCategory!: string;

  @IsString()
  @IsNotEmpty()
  profession!: string;
}
