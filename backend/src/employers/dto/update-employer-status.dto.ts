import { IsIn } from 'class-validator';

export class UpdateEmployerStatusDto {
  @IsIn(['VERIFIED', 'SUSPENDED'])
  status!: 'VERIFIED' | 'SUSPENDED';
}
