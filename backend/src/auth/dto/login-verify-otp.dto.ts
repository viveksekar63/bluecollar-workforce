import { IsIn, IsString, Matches } from 'class-validator';

export class LoginVerifyOtpDto {
  @IsString()
  @Matches(/^[0-9+\-()\s]{10,16}$/, { message: 'Enter a valid mobile number' })
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp!: string;

  @IsIn(['WORKER', 'EMPLOYER'])
  role!: 'WORKER' | 'EMPLOYER';
}
