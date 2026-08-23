import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { EmployersController } from "./employers.controller";
import { EmployersService } from "./employers.service";

@Module({
  imports: [AuthModule],
  controllers: [EmployersController],
  providers: [EmployersService],
})
export class EmployersModule {}
