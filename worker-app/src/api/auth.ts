import { api, setAccessToken } from './client';

export type AppRole = 'WORKER' | 'EMPLOYER' | 'SUPERADMIN' | 'ADMIN' | string;

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

/** Unified mobile login. The backend returns every role available to the user. */
export async function login(identifier: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { identifier, password });
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
  return login(identifier, password);
}

export function logoutWorker() {
  setAccessToken(null);
}
