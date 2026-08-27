import { api } from './client';

export interface EmployerProfileUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  profilePhotoUrl?: string | null;
}

export interface EmployerProfile {
  id: string;
  companyName: string;
  companyType?: string | null;
  registrationNo?: string | null;
  gstNumber?: string | null;
  description?: string | null;
  status: string;
  user: EmployerProfileUser;
}

export interface UpdateEmployerProfileInput {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyType?: string;
  registrationNo?: string;
  gstNumber?: string;
  description?: string;
}

export async function getEmployerProfile() {
  const response = await api.get<EmployerProfile>('/employer/profile');
  return response.data;
}

export async function updateEmployerProfile(input: UpdateEmployerProfileInput) {
  const response = await api.patch<EmployerProfile>('/employer/profile', input);
  return response.data;
}
