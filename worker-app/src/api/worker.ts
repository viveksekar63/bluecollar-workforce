import { api } from './client';

export interface WorkerProfile {
  id: string;
  workerCode?: string;
  profileCompletion?: number;
  verificationStatus?: string;
  availabilityStatus?: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    profilePhotoUrl?: string | null;
  };
}

export interface UpdateWorkerProfileInput {
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  experienceYears?: number;
  about?: string;
}

export async function getMyWorkerProfile() {
  const { data } = await api.get<WorkerProfile>('/workers/me');
  return data;
}

export async function updateMyWorkerProfile(input: UpdateWorkerProfileInput) {
  const { data } = await api.patch<WorkerProfile>('/workers/me', input);
  return data;
}
