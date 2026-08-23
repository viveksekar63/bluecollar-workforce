import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
