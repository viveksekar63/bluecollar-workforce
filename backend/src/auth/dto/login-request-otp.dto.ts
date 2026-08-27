import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class LoginRequestOtpDto {
  @IsString()
  @Matches(/^[0-9+\-()\s]{10,16}$/, { message: 'Enter a valid mobile number' })
  phone!: string;

  @IsOptional()
  @IsIn(['WORKER', 'EMPLOYER'])
  role?: 'WORKER' | 'EMPLOYER';
}
