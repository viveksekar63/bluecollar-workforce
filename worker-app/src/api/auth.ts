import { api, setAccessToken } from './client';

export interface WorkerUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roles?: string[];
}

export interface WorkerSummary {
  id: string;
  workerCode?: string;
  profileCompletion?: number;
  verificationStatus?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: WorkerUser;
  worker?: WorkerSummary;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export async function registerWorker(input: RegisterInput) {
  const { data } = await api.post<AuthResponse>('/auth/worker/register', input);
  setAccessToken(data.accessToken);
  return data;
}

export async function loginWorker(identifier: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/worker/login', {
    identifier,
    password,
  });
  setAccessToken(data.accessToken);
  return data;
}

export function logoutWorker() {
  setAccessToken(null);
}
