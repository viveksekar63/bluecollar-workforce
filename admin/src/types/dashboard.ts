export interface DashboardStats {
  totalWorkers: number;
  verifiedWorkers: number;
  totalEmployers: number;
  activeJobs: number;
  completedJobs: number;
}

export interface RecentWorker {
  id: string;
  workerCode: string;
  name: string;
  phone: string | null;
  skill: string | null;
  experienceYears: number | null;
  verificationStatus: string;
  createdAt: string;
}

export interface RecentVerification {
  id: string;
  workerCode: string;
  workerName: string;
  status: string;
  score: number | null;
  createdAt: string;
}

export interface VerificationOverview {
  status: string;
  count: number;
}

export interface RegistrationPoint {
  date: string;
  count: number;
}

export interface DashboardResponse {
  stats: DashboardStats;

  recentWorkers: RecentWorker[];

  recentVerifications:
    RecentVerification[];

  verificationOverview:
    VerificationOverview[];

  registrations:
    RegistrationPoint[];
}