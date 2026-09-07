import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { VerificationModule } from "../verification/verification.module";
import { CreditsModule } from "../credits/credits.module";
import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";
import { WorkerProfessionService } from "./worker-profession.service";
import { WorkerVerificationService } from "./worker-verification.service";
import { EmployerWorkerDiscoveryService } from "./employer-worker-discovery.service";
import { WorkerWorkPreferencesService } from "./worker-work-preferences.service";
import { WorkerShortlistController } from "./worker-shortlist.controller";
import { WorkerShortlistService } from "./worker-shortlist.service";
import { WorkerInvitationsController } from "./worker-invitations.controller";
import { WorkerInvitationsService } from "./worker-invitations.service";

@Module({
  imports: [PrismaModule, AuthModule, VerificationModule, CreditsModule],
  controllers: [WorkersController, WorkerShortlistController, WorkerInvitationsController],
  providers: [
    WorkersService,
    WorkerProfessionService,
    WorkerVerificationService,
    EmployerWorkerDiscoveryService,
    WorkerWorkPreferencesService,
    WorkerShortlistService,
    WorkerInvitationsService,
  ],
  exports: [
    WorkersService,
    WorkerProfessionService,
    WorkerVerificationService,
    WorkerShortlistService,
    WorkerInvitationsService,
    EmployerWorkerDiscoveryService,
  ],
})
export class WorkersModule {}
