import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { VerificationModule } from "../verification/verification.module";
import { CreditsModule } from "../credits/credits.module";
import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";
import { WorkerProfessionService } from "./worker-profession.service";
import { WorkerVerificationService } from "./worker-verification.service";

@Module({
  imports: [PrismaModule, AuthModule, VerificationModule, CreditsModule],
  controllers: [WorkersController],
  providers: [WorkersService, WorkerProfessionService, WorkerVerificationService],
  exports: [WorkersService, WorkerProfessionService, WorkerVerificationService],
})
export class WorkersModule {}
