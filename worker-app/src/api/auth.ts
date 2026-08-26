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
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

/** Unified mobile login. The selected role is validated by the backend and returned as activeRole. */
export async function login(identifier: string, password: string, role: MobileRole) {
  const { data } = await api.post<AuthResponse>('/auth/login', { identifier, password, role });
  setAccessToken(data.accessToken);
  return data;
}

export async function registerWorker(input: RegisterInput) {
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
