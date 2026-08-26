import { api } from './client';

export type EmployerJob = {
  id: string;
  title: string;
  description: string;
  city: string;
  district?: string | null;
  state: string;
  pincode?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  salaryType: string;
  openings: number;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  skills?: Array<{ required: boolean; skill: { id: string; name: string; category?: string | null } }>;
};

export type EmployerApplication = {
  id: string;
  status: string;
  appliedAt: string;
  worker?: {
    id: string;
    workerCode?: string;
    user?: { firstName?: string | null; lastName?: string | null; phone?: string | null; email?: string | null };
    profession?: string | null;
    professionCategory?: string | null;
    experienceYears?: number | string | null;
    verificationStatus?: string | null;
    profileCompletion?: number | null;
  };
  job?: { id: string; title: string; city?: string; state?: string };
};

export type EmployerPaymentMethod = {
  id: string;
  type: 'CARD' | 'UPI' | 'BANK_ACCOUNT';
  label: string;
  provider?: string | null;
  providerPaymentMethodId?: string | null;
  last4?: string | null;
  upiId?: string | null;
  isDefault: boolean;
  status: string;
  createdAt: string;
};

export async function getEmployerJobs() {
  const response = await api.get<EmployerJob[]>('/jobs/employer/my');
  return response.data;
}

export async function getEmployerApplications() {
  const response = await api.get<EmployerApplication[]>('/jobs/employer/applications');
  return response.data;
}

export async function getEmployerJobApplications(jobId: string) {
  const response = await api.get<EmployerApplication[]>(`/jobs/employer/${jobId}/applications`);
  return response.data;
}

export async function createEmployerJob(input: Record<string, unknown>) {
  const response = await api.post<EmployerJob>('/jobs/employer', input);
  return response.data;
}

export async function updateEmployerJob(jobId: string, input: Record<string, unknown>) {
  const response = await api.put<EmployerJob>(`/jobs/employer/${jobId}`, input);
  return response.data;
}

export async function publishEmployerJob(jobId: string) {
  const response = await api.post<EmployerJob>(`/jobs/employer/${jobId}/publish`);
  return response.data;
}

export async function getEmployerPaymentMethods() {
  const response = await api.get<EmployerPaymentMethod[]>('/jobs/employer/payment-methods');
  return response.data;
}

export async function createEmployerPaymentMethod(input: {
  type: EmployerPaymentMethod['type'];
  label: string;
  provider?: string;
  providerPaymentMethodId?: string;
  last4?: string;
  upiId?: string;
}) {
  const response = await api.post<EmployerPaymentMethod>('/jobs/employer/payment-methods', input);
  return response.data;
}

export async function shortlistEmployerApplication(applicationId: string) {
  const response = await api.post<EmployerApplication>(`/jobs/employer/applications/${applicationId}/shortlist`);
  return response.data;
}

export async function rejectEmployerApplication(applicationId: string) {
  const response = await api.post<EmployerApplication>(`/jobs/employer/applications/${applicationId}/reject`);
  return response.data;
}
