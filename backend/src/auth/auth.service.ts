import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { PERMISSIONS } from './permissions/permissions';
import { generateRefreshToken, hashRefreshToken } from './utils/token.utils';
import { PermissionService } from './permissions/permission.service';
import { WorkerRegisterDto } from './dto/worker-register.dto';
import { EmployerStatus } from '@prisma/client';

type MobileRole = 'WORKER' | 'EMPLOYER';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly configService: ConfigService, private readonly permissionService: PermissionService) {}
  async adminLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid email or password');
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('User account is not active');
    const roles = user.roles.map((userRole) => userRole.role.name);
    if (!(await this.permissionService.hasPermission(user.id, PERMISSIONS.DASHBOARD_VIEW))) throw new UnauthorizedException('User does not have admin access');
    return this.generateAuthTokens(user.id, user.email!, roles);
  }
  async workerRegister(dto: WorkerRegisterDto) {
    const phone = dto.phone.trim(); const email = dto.email?.trim().toLowerCase() || undefined;
    if (await this.prisma.user.findUnique({ where: { phone }, select: { id: true } })) throw new ConflictException('A user with this phone number already exists');
    if (email && await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) throw new ConflictException('A user with this email already exists');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const result = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: 'WORKER' }, select: { id: true } });
      if (!role) throw new ConflictException('WORKER role is not configured');
      const user = await tx.user.create({ data: { phone, email, passwordHash, firstName: dto.firstName.trim(), lastName: dto.lastName?.trim() || null, status: 'ACTIVE' } });
      const workerCode = await this.generateWorkerCode(tx);
      const worker = await tx.worker.create({ data: { userId: user.id, workerCode, profileCompletion: 20, verificationStatus: 'PENDING', availabilityStatus: 'AVAILABLE' }, select: { id: true, workerCode: true, profileCompletion: true, verificationStatus: true } });
      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
      return { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }, worker };
    });
    return { ...(await this.generateAuthTokens(result.user.id, result.user.email || result.user.phone, ['WORKER'])), worker: result.worker };
  }
  async workerLogin(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { OR: [{ email: normalizedIdentifier }, { phone: identifier.trim() }] }, include: { roles: { include: { role: true } }, worker: true } });
    if (!user || !user.passwordHash || !user.worker) throw new UnauthorizedException('Invalid email/phone or password');
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email/phone or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('User account is not active');
    const roles = user.roles.map((userRole) => userRole.role.name);
    if (!roles.includes('WORKER')) throw new UnauthorizedException('User is not registered as a worker');
    return { ...(await this.generateAuthTokens(user.id, user.email || user.phone, roles)), worker: { id: user.worker.id, workerCode: user.worker.workerCode, profileCompletion: user.worker.profileCompletion, verificationStatus: user.worker.verificationStatus, verificationScore: user.worker.verificationScore } };
  }
  async employerLogin(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { OR: [{ email: normalizedIdentifier }, { phone: identifier.trim() }] }, include: { roles: { include: { role: true } }, employer: true } });
    if (!user || !user.passwordHash || !user.employer) throw new UnauthorizedException('Invalid email/phone or password');
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email/phone or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('User account is not active');
    const roles = user.roles.map((userRole) => userRole.role.name);
    if (!roles.includes('EMPLOYER')) throw new UnauthorizedException('User is not registered as an employer');
    if (user.employer.status !== EmployerStatus.VERIFIED) throw new UnauthorizedException('Employer account is awaiting approval');
    return { ...(await this.generateAuthTokens(user.id, user.email || user.phone, roles)), employer: { id: user.employer.id, companyName: user.employer.companyName, status: user.employer.status } };
  }
  async mobileLogin(identifier: string, password: string, requestedRole?: MobileRole) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { OR: [{ email: normalizedIdentifier }, { phone: identifier.trim() }] }, include: { roles: { include: { role: true } }, worker: true, employer: true } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid email/phone or password');
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email/phone or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('User account is not active');
    const roles = user.roles.map((userRole) => userRole.role.name);
    const hasWorker = roles.includes('WORKER') && !!user.worker;
    const hasEmployer = roles.includes('EMPLOYER') && !!user.employer && user.employer.status === EmployerStatus.VERIFIED;
    if (!hasWorker && !hasEmployer) {
      if (roles.includes('EMPLOYER') && user.employer && user.employer.status !== EmployerStatus.VERIFIED) throw new UnauthorizedException('Employer account is awaiting approval');
      throw new UnauthorizedException('User does not have an active mobile role');
    }
    if (requestedRole === 'WORKER' && !hasWorker) {
      throw new UnauthorizedException('This account does not have worker access');
    }
    if (requestedRole === 'EMPLOYER' && !hasEmployer) {
      if (roles.includes('EMPLOYER') && user.employer && user.employer.status !== EmployerStatus.VERIFIED) throw new UnauthorizedException('Employer account is awaiting approval');
      throw new UnauthorizedException('This account does not have employer access');
    }
    const activeRole: MobileRole | undefined = requestedRole ?? (hasWorker && !hasEmployer ? 'WORKER' : hasEmployer && !hasWorker ? 'EMPLOYER' : undefined);
    const response: any = { ...(await this.generateAuthTokens(user.id, user.email || user.phone, roles)), worker: undefined, employer: undefined, activeRole };
    if (hasWorker) response.worker = { id: user.worker!.id, workerCode: user.worker!.workerCode, profileCompletion: user.worker!.profileCompletion, verificationStatus: user.worker!.verificationStatus, verificationScore: user.worker!.verificationScore };
    if (hasEmployer) response.employer = { id: user.employer!.id, companyName: user.employer!.companyName, status: user.employer!.status };
    return response;
  }
  async getAdminPermissions(userId: string) { return this.permissionService.getUserPermissions(userId); }
  private async generateWorkerCode(tx: any) {
    for (let attempt = 0; attempt < 5; attempt += 1) { const workerCode = `WRK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`; if (!(await tx.worker.findUnique({ where: { workerCode }, select: { id: true } }))) return workerCode; }
    throw new ConflictException('Unable to generate worker code');
  }
  private async generateAuthTokens(userId: string, email: string, roles: string[]) {
    const accessToken = await this.jwtService.signAsync({ sub: userId, email, roles });
    const refreshToken = generateRefreshToken(); const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({ data: { userId, tokenHash: hashRefreshToken(refreshToken), expiresAt } });
    return { accessToken, refreshToken, user: { id: userId, email, roles } };
  }
  async refreshToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findFirst({ where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null }, include: { user: { include: { roles: { include: { role: true } } } } } });
    if (!storedToken) throw new UnauthorizedException('Invalid refresh token');
    if (storedToken.expiresAt <= new Date()) throw new UnauthorizedException('Refresh token expired');
    if (storedToken.user.status !== 'ACTIVE') throw new UnauthorizedException('User account is not active');
    const roles = storedToken.user.roles.map((userRole) => userRole.role.name);
    await this.prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });
    return this.generateAuthTokens(storedToken.user.id, storedToken.user.email || storedToken.user.phone, roles);
  }
  async logout(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findFirst({ where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null } });
    if (storedToken) await this.prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });
    return { message: 'Logged out successfully' };
  }
  async getAdminMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, phone: user.phone, firstName: user.firstName, lastName: user.lastName, status: user.status, roles: user.roles.map((userRole) => userRole.role.name) };
  }
}
