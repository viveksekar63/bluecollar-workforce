export type VerificationStatus = "VERIFIED" | "IN_PROGRESS" | "PENDING" | "REJECTED";
export type WorkerAvailability = "AVAILABLE" | "WORKING" | "UNAVAILABLE";

export interface EmploymentHistory {
  id: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate?: string | null;
  currentlyWorking?: boolean;
  salary?: number | null;
  supervisorName?: string | null;
  supervisorPhone?: string | null;
  verificationStatus: VerificationStatus;
  verificationNote?: string | null;
}

export interface WorkerDocument {
  id: string;
  type: string;
  name: string;
  status: VerificationStatus;
  issuedDate?: string | null;
  expiryDate?: string | null;
  fileUrl?: string | null;
}

export interface WorkerVerification {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  status: VerificationStatus;
  score?: number | null;
  verifiedAt?: string | null;
  remarks?: string | null;
}

export interface Worker {
  id: string;
  workerCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  profileImageUrl?: string | null;
  primarySkill: string;
  experienceYears: number;
  city: string;
  state: string;
  verificationScore: number;
  verificationStatus: VerificationStatus;
  availability: WorkerAvailability;
  languages?: string[];
  dateOfBirth?: string | null;
  about?: string | null;
  employmentHistory?: EmploymentHistory[];
  documents?: WorkerDocument[];
  verifications?: WorkerVerification[];
}

export interface PaginatedWorkers {
  items: Worker[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
