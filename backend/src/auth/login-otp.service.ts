import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

@Injectable()
export class LoginOtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async requestOtp(phoneValue: string, requestedRole?: 'WORKER' | 'EMPLOYER') {
    const phone = this.normalizePhone(phoneValue);
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { worker: true, employer: true, roles: { include: { role: true } } },
    });

    if (!user) throw new UnauthorizedException('No account found for this mobile number. Please register first.');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('User account is not active.');

    const roles = user.roles.map((item) => item.role.name);
    const hasWorker = roles.includes('WORKER') && !!user.worker;
    const hasEmployer = roles.includes('EMPLOYER') && !!user.employer && user.employer.status === 'VERIFIED';

    if (requestedRole === 'WORKER' && !hasWorker) throw new UnauthorizedException('This account does not have worker access.');
    if (requestedRole === 'EMPLOYER' && !hasEmployer) {
      if (roles.includes('EMPLOYER') && user.employer && user.employer.status !== 'VERIFIED') throw new UnauthorizedException('Employer account is awaiting approval.');
      throw new UnauthorizedException('This account does not have employer access.');
    }
    if (!hasWorker && !hasEmployer) throw new UnauthorizedException('User does not have an active mobile role.');

    const recent = await this.prisma.otpRequest.findFirst({
      where: { userId: user.id, verifiedAt: null, expiresAt: { gt: new Date() }, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
      select: { id: true },
    });
    if (recent) throw new ConflictException('Please wait before requesting another OTP.');

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.otpRequest.updateMany({ where: { userId: user.id, verifiedAt: null }, data: { expiresAt: new Date() } });
      await tx.otpRequest.create({ data: { userId: user.id, phone, otpHash, expiresAt } });
    });

    await this.sendOtp(phone, otp);

    const response: { message: string; phone: string; expiresInSeconds: number; devOtp?: string } = {
      message: 'OTP sent successfully', phone, expiresInSeconds: 300,
    };
    if ((this.configService.get<string>('OTP_SMS_PROVIDER') || 'console').toLowerCase() === 'console') response.devOtp = otp;
    return response;
  }

  async verifyOtp(phoneValue: string, otpValue: string, requestedRole: 'WORKER' | 'EMPLOYER') {
    const phone = this.normalizePhone(phoneValue);
    const request = await this.prisma.otpRequest.findFirst({
      where: { phone, verifiedAt: null }, orderBy: { createdAt: 'desc' },
      include: { user: { include: { worker: true, employer: true, roles: { include: { role: true } } } } },
    });
    if (!request?.user) throw new UnauthorizedException('No pending OTP found for this mobile number.');
    if (request.expiresAt <= new Date()) throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
    if (request.attempts >= 5) throw new UnauthorizedException('Too many invalid OTP attempts. Please request a new OTP.');

    const valid = await bcrypt.compare(otpValue.trim(), request.otpHash);
    if (!valid) {
      await this.prisma.otpRequest.update({ where: { id: request.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException('Invalid OTP.');
    }

    const user = request.user;
    const roles = user.roles.map((item) => item.role.name);
    const hasWorker = roles.includes('WORKER') && !!user.worker;
    const hasEmployer = roles.includes('EMPLOYER') && !!user.employer && user.employer.status === 'VERIFIED';
    if (requestedRole === 'WORKER' && !hasWorker) throw new UnauthorizedException('This account does not have worker access.');
    if (requestedRole === 'EMPLOYER' && !hasEmployer) {
      if (roles.includes('EMPLOYER') && user.employer && user.employer.status !== 'VERIFIED') throw new UnauthorizedException('Employer account is awaiting approval.');
      throw new UnauthorizedException('This account does not have employer access.');
    }

    await this.prisma.otpRequest.update({ where: { id: request.id }, data: { verifiedAt: new Date() } });
    const tokens = await this.authService.generateAuthTokens(user.id, user.email || user.phone, roles);
    const activeRole = requestedRole;

    return {
      ...tokens, success: true, role: activeRole, activeRole,
      worker: user.worker ? { id: user.worker.id, workerCode: user.worker.workerCode, profileCompletion: user.worker.profileCompletion, verificationStatus: user.worker.verificationStatus, verificationScore: user.worker.verificationScore } : undefined,
      employer: user.employer ? { id: user.employer.id, companyName: user.employer.companyName, status: user.employer.status } : undefined,
    };
  }

  private normalizePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length >= 11 && digits.length <= 15) return digits;
    throw new ConflictException('Enter a valid mobile number');
  }

  private generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }

  private async sendOtp(phone: string, otp: string) {
    const provider = (this.configService.get<string>('OTP_SMS_PROVIDER') || 'console').toLowerCase();
    if (provider === 'console') { console.log(`[WorkTrust OTP Login] ${phone}: ${otp}`); return; }
    if (provider === 'msg91') {
      const authKey = this.configService.get<string>('MSG91_AUTH_KEY');
      const templateId = this.configService.get<string>('MSG91_TEMPLATE_ID');
      if (!authKey || !templateId) throw new ConflictException('MSG91 OTP configuration is missing');
      const mobile = phone.length === 10 ? `91${phone}` : phone;
      const response = await fetch('https://control.msg91.com/api/v5/otp', { method: 'POST', headers: { authkey: authKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ template_id: templateId, mobile, otp, otp_length: 6 }) });
      if (!response.ok) throw new ConflictException('Unable to send OTP. Please try again.');
      return;
    }
    throw new ConflictException(`Unsupported OTP SMS provider: ${provider}`);
  }
}
