import { api } from './client';

export type JobSkill = {
  required: boolean;
  skill: {
    id: string;
    name: string;
    category?: string | null;
  };
};

export type JobApplication = {
  id: string;
  status: string;
  appliedAt: string;
};

export type WorkerJob = {
  id: string;
  title: string;
  description: string;
  city: string;
  district?: string | null;
  state: string;
  pincode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  salaryType: string;
  openings: number;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  employer: {
    id: string;
    companyName: string;
    companyType?: string | null;
    description?: string | null;
    status: string;
  };
  skills: JobSkill[];
  matchScore?: number;
  matchedSkills?: number;
  applied?: boolean;
  applicationStatus?: string | null;
  application?: JobApplication | null;
};

export async function getRecommendedJobs(city?: string, limit = 20) {
  const response = await api.get<{
    items: WorkerJob[];
    total: number;
    location: string | null;
  }>('/jobs/recommended', {
    params: {
      ...(city ? { city } : {}),
      limit,
    },
  });

  return response.data;
}

export async function getJob(jobId: string) {
  const response = await api.get<WorkerJob>(`/jobs/${jobId}`);
  return response.data;
}

export async function applyForJob(jobId: string) {
  const response = await api.post<
    | {
        alreadyApplied: boolean;
        application: JobApplication & {
          jobId: string;
          workerId: string;
        };
      }
    | (JobApplication & {
        jobId: string;
        workerId: string;
      })
  >(`/jobs/${jobId}/apply`);

  const data = response.data;

  // The current backend returns the application object directly.
  // Keep the mobile API contract stable so the job-details screen can
  // consume both the current response and the wrapped response shape.
  if ('application' in data) {
    return data;
  }

  return {
    alreadyApplied: false,
    application: data,
  };
}
