import { api, setAccessToken } from './client';

export type AppRole = 'WORKER' | 'EMPLOYER' | 'SUPERADMIN' | 'ADMIN' | string;
export type MobileRole = 'WORKER' | 'EMPLOYER';

export interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roles?: AppRole[];
}

export interface WorkerSummary {
  id: string;
  workerCode?: string;
  profileCompletion?: number;
  verificationStatus?: string;
  verificationScore?: number | null;
}

export interface EmployerSummary {
  id: string;
  companyName?: string | null;
  status?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  activeRole?: MobileRole | null;
  worker?: WorkerSummary;
  employer?: EmployerSummary;
}

export interface RegisterInput {
  role: MobileRole;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  companyName?: string;
}

export interface RegistrationOtpResponse {
  message: string;
  phone: string;
  expiresInSeconds: number;
  devOtp?: string;
}

export interface RegistrationVerifyResponse {
  success: boolean;
  role: MobileRole;
  requiresApproval: boolean;
  message: string;
  user: AuthUser;
  roles: AppRole[];
}

/** Unified mobile login. The selected role is validated by the backend and returned as activeRole. */
export async function login(identifier: string, password: string, role: MobileRole) {
  const { data } = await api.post<AuthResponse>('/auth/login', { identifier, password, role });
  setAccessToken(data.accessToken);
  return data;
}

export async function requestRegistrationOtp(input: RegisterInput) {
  const { data } = await api.post<RegistrationOtpResponse>('/auth/register/request-otp', input);
  return data;
}

export async function verifyRegistrationOtp(phone: string, otp: string) {
  const { data } = await api.post<RegistrationVerifyResponse>('/auth/register/verify-otp', { phone, otp });
  return data;
}

export async function registerWorker(input: Omit<RegisterInput, 'role' | 'companyName'>) {
  const { data } = await api.post<AuthResponse>('/auth/worker/register', input);
  setAccessToken(data.accessToken);
  return data;
}

/** Kept for compatibility with older worker-only screens. */
export async function loginWorker(identifier: string, password: string) {
  return login(identifier, password, 'WORKER');
}

export function logoutWorker() {
  setAccessToken(null);
}
