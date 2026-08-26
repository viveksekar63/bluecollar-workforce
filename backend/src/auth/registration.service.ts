import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegistrationRequestOtpDto } from './dto/registration-request-otp.dto';
import { RegistrationVerifyOtpDto } from './dto/registration-verify-otp.dto';
import { EmployerStatus } from '@prisma/client';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp(dto: RegistrationRequestOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const email = dto.email?.trim().toLowerCase() || null;

    if (dto.role === 'EMPLOYER' && !dto.companyName?.trim()) {
      throw new ConflictException('Company name is required for employer registration');
    }

    if (email) {
      const emailOwner = await this.prisma.user.findUnique({ where: { email }, select: { id: true, phone: true } });
      if (emailOwner && emailOwner.phone !== phone) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone },
      include: { worker: true, employer: true, roles: { include: { role: true } } },
    });

    if (existing?.status === 'ACTIVE') {
      throw new ConflictException('A user with this mobile number already exists. Please sign in.');
    }

    if (existing?.roles.length) {
      const existingRoleNames = existing.roles.map((item) => item.role.name);
      if (!existingRoleNames.includes(dto.role)) {
        throw new ConflictException('This mobile number already has a pending registration for another role');
      }
    }

    const recentOtp = existing
      ? await this.prisma.otpRequest.findFirst({
          where: { userId: existing.id, verifiedAt: null, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
          select: { id: true },
        })
      : null;

    if (recentOtp) throw new ConflictException('Please wait before requesting another OTP');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      let user = existing;

      if (!user) {
        user = await tx.user.create({
          data: {
            phone,
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName?.trim() || null,
            status: 'INACTIVE',
          },
          include: { worker: true, employer: true, roles: { include: { role: true } } },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName?.trim() || null,
            status: 'INACTIVE',
          },
          include: { worker: true, employer: true, roles: { include: { role: true } } },
        });
      }

      const role = await tx.role.findUnique({ where: { name: dto.role }, select: { id: true } });
      if (!role) throw new ConflictException(`${dto.role} role is not configured`);

      const hasRole = user.roles.some((item) => item.role.name === dto.role);
      if (!hasRole) {
        await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
      }

      if (dto.role === 'WORKER' && !user.worker) {
        await tx.worker.create({
          data: {
            userId: user.id,
            workerCode: await this.generateWorkerCode(tx),
            profileCompletion: 20,
            verificationStatus: 'PENDING',
            availabilityStatus: 'AVAILABLE',
          },
        });
      }

      if (dto.role === 'EMPLOYER' && !user.employer) {
        await tx.employer.create({
          data: {
            userId: user.id,
            companyName: dto.companyName!.trim(),
            status: EmployerStatus.PENDING,
          },
        });
      } else if (dto.role === 'EMPLOYER' && user.employer) {
        await tx.employer.update({
          where: { id: user.employer.id },
          data: { companyName: dto.companyName!.trim(), status: EmployerStatus.PENDING },
        });
      }

      await tx.otpRequest.updateMany({
        where: { userId: user.id, verifiedAt: null },
        data: { expiresAt: new Date() },
      });

      await tx.otpRequest.create({
        data: { userId: user.id, phone, otpHash, expiresAt },
      });
    });

    await this.sendOtp(phone, otp);

    const response: { message: string; phone: string; expiresInSeconds: number; devOtp?: string } = {
      message: 'OTP sent successfully',
      phone,
      expiresInSeconds: 300,
    };

    if ((this.configService.get<string>('OTP_SMS_PROVIDER') || 'console').toLowerCase() === 'console') {
      response.devOtp = otp;
    }

    return response;
  }

  async verifyOtp(dto: RegistrationVerifyOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const request = await this.prisma.otpRequest.findFirst({
      where: { phone, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { worker: true, employer: true, roles: { include: { role: true } } } } },
    });

    if (!request?.user) throw new UnauthorizedException('No pending registration found for this mobile number');
    if (request.expiresAt <= new Date()) throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
    if (request.attempts >= 5) throw new UnauthorizedException('Too many invalid OTP attempts. Please request a new OTP.');

    const valid = await bcrypt.compare(dto.otp.trim(), request.otpHash);
    if (!valid) {
      await this.prisma.otpRequest.update({ where: { id: request.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.$transaction([
      this.prisma.otpRequest.update({ where: { id: request.id }, data: { verifiedAt: new Date() } }),
      this.prisma.user.update({ where: { id: request.user.id }, data: { status: 'ACTIVE' } }),
    ]);

    const roleNames = request.user.roles.map((item) => item.role.name).filter((name) => name === 'WORKER' || name === 'EMPLOYER');
    const role = request.user.worker ? 'WORKER' : 'EMPLOYER';

    if (role === 'EMPLOYER') {
      return {
        success: true,
        role,
        requiresApproval: request.user.employer?.status !== EmployerStatus.VERIFIED,
        message: 'Mobile number verified. Your employer account is submitted for approval.',
        user: { id: request.user.id, firstName: request.user.firstName, lastName: request.user.lastName, phone: request.user.phone, email: request.user.email },
        roles: roleNames,
      };
    }

    return {
      success: true,
      role,
      requiresApproval: false,
      message: 'Mobile number verified. Your worker account has been created.',
      user: { id: request.user.id, firstName: request.user.firstName, lastName: request.user.lastName, phone: request.user.phone, email: request.user.email },
      roles: roleNames,
    };
  }

  private normalizePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length >= 11 && digits.length <= 15) return digits;
    throw new ConflictException('Enter a valid mobile number');
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateWorkerCode(tx: any) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const workerCode = `WRK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      if (!(await tx.worker.findUnique({ where: { workerCode }, select: { id: true } }))) return workerCode;
    }
    throw new ConflictException('Unable to generate worker code');
  }

  private async sendOtp(phone: string, otp: string) {
    const provider = (this.configService.get<string>('OTP_SMS_PROVIDER') || 'console').toLowerCase();

    if (provider === 'console') {
      console.log(`[WorkTrust OTP] ${phone}: ${otp}`);
      return;
    }

    if (provider === 'msg91') {
      const authKey = this.configService.get<string>('MSG91_AUTH_KEY');
      const templateId = this.configService.get<string>('MSG91_TEMPLATE_ID');
      if (!authKey || !templateId) throw new ConflictException('MSG91 OTP configuration is missing');

      const mobile = phone.length === 10 ? `91${phone}` : phone;
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: { authkey: authKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, mobile, otp, otp_length: 6 }),
      });

      if (!response.ok) throw new ConflictException('Unable to send OTP. Please try again.');
      return;
    }

    throw new ConflictException(`Unsupported OTP SMS provider: ${provider}`);
  }
}
