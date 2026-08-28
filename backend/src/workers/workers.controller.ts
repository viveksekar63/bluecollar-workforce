import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";

import { WorkersService } from "./workers.service";
import { EmployerWorkerDiscoveryService } from "./employer-worker-discovery.service";
import { UpdateWorkerOnboardingDto } from "./dto/update-worker-onboarding.dto";
import { UpdateWorkerProfileDto } from "./dto/update-worker-profile.dto";
import { UpdateWorkerProfessionDto } from "./dto/update-worker-profession.dto";
import { UpdateWorkerWorkPreferencesDto } from "./dto/update-worker-work-preferences.dto";
import { CreateWorkerEmploymentDto, UpdateWorkerEmploymentDto } from "./dto/worker-employment.dto";
import { WorkersQueryDto } from "./dto/workers-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/permissions/permission.guard";
import { RequirePermissions } from "../auth/permissions/permission.decorator";
import { PERMISSIONS } from "../auth/permissions/permissions";
import { UpdateWorkerSkillsDto } from "./dto/update-worker-skills.dto";
import { WorkerProfessionService } from "./worker-profession.service";
import { WorkerVerificationService } from "./worker-verification.service";
import { CreditWalletService } from "../contact-purchases/credit-wallet.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("workers")
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(
    private readonly workersService: WorkersService,
    private readonly employerWorkerDiscoveryService: EmployerWorkerDiscoveryService,
    private readonly workerProfessionService: WorkerProfessionService,
    private readonly workerVerificationService: WorkerVerificationService,
    private readonly creditWalletService: CreditWalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("discover")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  async discover(@Query() query: WorkersQueryDto) {
    const result = await this.employerWorkerDiscoveryService.findAll(query);
    return {
      ...result,
      items: result.items.map(({ phone, email, ...worker }: any) => worker),
    };
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  async findAll(@Query() query: WorkersQueryDto) {
    return this.workersService.findAll(query);
  }

  @Get("me")
  async getMyProfile(@Req() request: any) {
    return this.workersService.getMyProfile(request.user.userId);
  }

  @Get("me/work-preferences")
  async getMyWorkPreferences(@Req() request: any) {
    return this.workersService.getMyWorkPreferences(request.user.userId);
  }

  @Patch("me/work-preferences")
  async updateMyWorkPreferences(@Req() request: any, @Body() dto: UpdateWorkerWorkPreferencesDto) {
    return this.workersService.updateMyWorkPreferences(request.user.userId, dto);
  }

  @Get("me/profession")
  async getMyProfession(@Req() request: any) {
    return this.workerProfessionService.getMyProfession(request.user.userId);
  }

  @Get("me/experience")
  async getMyEmploymentHistory(@Req() request: any) {
    return this.workersService.getMyEmploymentHistory(request.user.userId);
  }

  @Get("me/verification")
  async getMyVerification(@Req() request: any) {
    return this.workerVerificationService.getMyVerification(request.user.userId);
  }

  @Get(":id")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  async findOne(@Param("id") id: string, @Req() request: any) {
    const worker = await this.workersService.findOne(id);
    const roles: string[] = request.user?.roles ?? [];
    if (roles.includes("EMPLOYER")) {
      const safeUser = worker.user ? { ...worker.user, phone: undefined, email: undefined } : worker.user;
      return { ...worker, user: safeUser };
    }
    return worker;
  }

  @Post(":id/contact")
  @UseGuards(PermissionGuard)
  @RequirePermissions(PERMISSIONS.WORKERS_READ)
  async unlockContact(@Param("id") workerId: string, @Req() request: any) {
    const roles: string[] = request.user?.roles ?? [];
    if (!roles.includes("EMPLOYER")) {
      return { success: false, message: "Only employers can unlock worker contact details" };
    }

    const employer = await this.prisma.employer.findUnique({
      where: { userId: request.user.userId },
      select: { id: true, status: true },
    });
    if (!employer) throw new NotFoundException("Employer profile not found");
    if (String(employer.status) !== "VERIFIED") {
      return { success: false, message: "Employer account is not verified" };
    }

    const worker = await this.workersService.findOne(workerId);
    if (!worker) throw new NotFoundException("Worker not found");

    const result = await this.creditWalletService.debitForContact(employer.id, workerId);
    const user = worker.user;
    return {
      success: true,
      alreadyUnlocked: result.alreadyUnlocked,
      purchaseId: result.purchaseId,
      balance: result.balance,
      creditsUsed: result.creditsUsed ?? 0,
      workerId,
      contact: {
        phone: user?.phone ?? null,
        email: user?.email ?? null,
      },
    };
  }

  @Patch("me")
  async updateMyProfile(@Req() request: any, @Body() dto: UpdateWorkerProfileDto) {
    return this.workersService.updateMyProfile(request.user.userId, dto);
  }

  @Patch("me/onboarding")
  async updateMyOnboarding(@Req() request: any, @Body() dto: UpdateWorkerOnboardingDto) {
    return this.workersService.updateMyOnboarding(request.user.userId, dto);
  }

  @Patch("me/skills")
  async updateMySkills(@Req() request: any, @Body() dto: UpdateWorkerSkillsDto) {
    return this.workersService.updateMySkills(request.user.userId, dto);
  }

  @Patch("me/profession")
  async updateMyProfession(@Req() request: any, @Body() dto: UpdateWorkerProfessionDto) {
    return this.workerProfessionService.updateMyProfession(request.user.userId, dto);
  }

  @Post("me/experience")
  async createMyEmploymentHistory(@Req() request: any, @Body() dto: CreateWorkerEmploymentDto) {
    return this.workersService.createMyEmploymentHistory(request.user.userId, dto);
  }

  @Post("me/verification")
  async submitVerificationConsent(@Req() request: any) {
    return this.workerVerificationService.submitConsentAndStart(request.user.userId, request.ip, request.headers?.["user-agent"]);
  }

  @Patch("me/experience/:employmentId")
  async updateMyEmploymentHistory(@Req() request: any, @Param("employmentId") employmentId: string, @Body() dto: UpdateWorkerEmploymentDto) {
    return this.workersService.updateMyEmploymentHistory(request.user.userId, employmentId, dto);
  }

  @Delete("me/experience/:employmentId")
  async deleteMyEmploymentHistory(@Req() request: any, @Param("employmentId") employmentId: string) {
    return this.workersService.deleteMyEmploymentHistory(request.user.userId, employmentId);
  }
}
