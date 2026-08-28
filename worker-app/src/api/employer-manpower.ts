import { api } from './client';

export type ManpowerPreferredLocation = {
  city: string;
  district?: string | null;
  state: string;
  country?: string;
};

export type ManpowerWorker = {
  id: string;
  workerCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  primarySkill: string;
  professionCategory?: string | null;
  profession?: string | null;
  experienceYears: number;
  city: string;
  state: string;
  verificationScore: number;
  verificationStatus?: string | null;
  availability?: string | null;
  mobility?: string | null;
  willingToRelocate?: boolean;
  willingToTravel?: boolean;
  preferredLocations?: ManpowerPreferredLocation[];
};

export type ManpowerSearchResponse = {
  items: ManpowerWorker[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function searchManpower(params: {
  search?: string;
  skill?: string;
  location?: string;
  availability?: string;
  verificationStatus?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ManpowerSearchResponse>('/workers/discover', { params });
  return response.data;
}

export async function getManpowerWorker(workerId: string) {
  const response = await api.get(`/workers/${workerId}`);
  return response.data;
}

export async function unlockManpowerWorkerContact(workerId: string) {
  const response = await api.post(`/workers/${workerId}/contact`);
  return response.data;
}
