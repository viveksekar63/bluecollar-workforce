import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { VerificationModule } from "../verification/verification.module";
import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";
import { WorkerProfessionService } from "./worker-profession.service";

@Module({
  imports: [PrismaModule, AuthModule, VerificationModule],
  controllers: [WorkersController],
  providers: [WorkersService, WorkerProfessionService],
  exports: [WorkersService, WorkerProfessionService],
})
export class WorkersModule {}
