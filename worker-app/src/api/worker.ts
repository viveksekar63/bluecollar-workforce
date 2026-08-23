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
  professionCategory?: string | null;
  profession?: string | null;
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
  skills?: WorkerSkill[];
  languages?: WorkerLanguage[];
  employmentHistory?: WorkerEmployment[];
}

export interface UpdateWorkerSkillsInput {
  skills: string[];
  languages: string[];
}

export async function updateMySkills(input: UpdateWorkerSkillsInput) {
  const { data } = await api.patch<{
    worker: WorkerProfile;
    skills: Array<{ id: string; name: string; category?: string | null }>;
    languages: Array<{ id: string; name: string }>;
  }>('/workers/me/skills', input);
  return data;
}

export interface UpdateWorkerProfileInput {
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  experienceYears?: number;
  bio?: string;
  professionCategory?: string;
  profession?: string;
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

export interface WorkerProfession {
  professionCategory?: string | null;
  profession?: string | null;
  profileCompletion?: number;
}

export interface UpdateWorkerProfessionInput {
  professionCategory: string;
  profession: string;
}

export interface WorkerEmployment {
  id: string;
  companyName: string;
  companyAddress?: string | null;
  designation: string;
  startDate: string;
  endDate?: string | null;
  salary?: number | string | null;
  employmentType?: string | null;
  supervisorName?: string | null;
  supervisorPhone?: string | null;
  supervisorEmail?: string | null;
  reasonForLeaving?: string | null;
  verificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkerEmploymentInput {
  companyName: string;
  companyAddress?: string;
  designation: string;
  startDate: string;
  endDate?: string;
  salary?: number;
  employmentType?: string;
  supervisorName?: string;
  supervisorPhone?: string;
  supervisorEmail?: string;
  reasonForLeaving?: string;
}

export interface WorkerSkill {
  experienceYears?: number | string | null;
  skillLevel?: string;
  verified?: boolean;
  skill: { id: string; name: string; category?: string | null };
}

export interface WorkerLanguage {
  proficiency?: string;
  language: { id: string; name: string };
}

export async function getMyWorkerProfile() {
  const { data } = await api.get<WorkerProfile>('/workers/me');
  return data;
}

export async function updateMyWorkerProfile(input: UpdateWorkerProfileInput) {
  const { data } = await api.patch<WorkerProfile>('/workers/me', input);
  return data;
}

export async function getMyProfession() {
  const { data } = await api.get<WorkerProfession>('/workers/me/profession');
  return data;
}

export async function updateMyProfession(input: UpdateWorkerProfessionInput) {
  const { data } = await api.patch<WorkerProfile>('/workers/me/profession', input);
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

export async function getMyEmploymentHistory() {
  const { data } = await api.get<WorkerEmployment[]>('/workers/me/experience');
  return data;
}

export async function createMyEmploymentHistory(input: WorkerEmploymentInput) {
  const { data } = await api.post<WorkerEmployment>('/workers/me/experience', input);
  return data;
}

export async function updateMyEmploymentHistory(
  employmentId: string,
  input: WorkerEmploymentInput,
) {
  const { data } = await api.patch<WorkerEmployment>(
    `/workers/me/experience/${employmentId}`,
    input,
  );
  return data;
}

export async function deleteMyEmploymentHistory(employmentId: string) {
  const { data } = await api.delete<{ success: boolean }>(
    `/workers/me/experience/${employmentId}`,
  );
  return data;
}
