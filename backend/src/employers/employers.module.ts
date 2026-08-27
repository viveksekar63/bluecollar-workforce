import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EmployerProfileController } from './employer-profile.controller';
import { EmployersController } from './employers.controller';
import { EmployersService } from './employers.service';

@Module({
  imports: [AuthModule],
  controllers: [EmployersController, EmployerProfileController],
  providers: [EmployersService],
})
export class EmployersModule {}
