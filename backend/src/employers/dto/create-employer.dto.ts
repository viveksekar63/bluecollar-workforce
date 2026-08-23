import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateEmployerDto {
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsString()
  @Length(10, 20)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @Length(1, 200)
  companyName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  companyType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  registrationNo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
