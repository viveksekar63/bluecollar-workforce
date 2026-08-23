import { api } from './client';

export interface WorkerAddress {
  id: string;
  type: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  isCurrent: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface WorkerProfile {
  id: string;
  workerCode?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  bio?: string | null;
  experienceYears?: number | string | null;
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
  addresses?: WorkerAddress[];
  emergencyContacts?: EmergencyContact[];
}

export interface UpdateWorkerProfileInput {
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  experienceYears?: number;
  bio?: string;
}

export interface UpdateWorkerOnboardingInput {
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

export async function getMyWorkerProfile() {
  const { data } = await api.get<WorkerProfile>('/workers/me');
  return data;
}

export async function updateMyWorkerProfile(input: UpdateWorkerProfileInput) {
  const { data } = await api.patch<WorkerProfile>('/workers/me', input);
  return data;
}

export async function updateMyOnboarding(input: UpdateWorkerOnboardingInput) {
  const { data } = await api.patch<{
    worker: WorkerProfile;
    address: WorkerAddress;
    emergencyContact: EmergencyContact;
  }>('/workers/me/onboarding', input);
  return data;
}
