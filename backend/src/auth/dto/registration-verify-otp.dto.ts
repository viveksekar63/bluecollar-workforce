import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegistrationVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  otp: string;
}
