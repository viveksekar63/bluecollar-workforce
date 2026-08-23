export type VerificationStatus =
  | "VERIFIED"
  | "IN_PROGRESS"
  | "PENDING"
  | "FAILED"
  | "MANUAL_REVIEW"
  | "EXPIRED";

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
  type?: string;
  name?: string;
  status?: VerificationStatus;
  issuedDate?: string | null;
  expiryDate?: string | null;
  fileUrl?: string | null;
  verification?: {
    status?: VerificationStatus;
    remarks?: string | null;
    verifiedAt?: string | null;
  } | null;
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

export interface WorkerUser {
  id: string;
  phone: string;
  email?: string | null;
  firstName: string;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  status?: string;
}

export interface WorkerAddress {
  id: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  isCurrent?: boolean;
}

export interface WorkerSkill {
  experienceYears?: number | null;
  skillLevel?: string | null;
  verified?: boolean;
  skill: {
    id: string;
    name: string;
    category?: string | null;
  };
}

export interface WorkerVerificationRequest {
  id: string;
  status: VerificationStatus;
  overallScore?: number | null;
  createdAt?: string;
  completedAt?: string | null;
  checks?: Array<{
    id: string;
    type: string;
    status: VerificationStatus;
    result?: {
      result?: string | null;
      score?: number | null;
      remarks?: string | null;
      verifiedAt?: string | null;
    } | null;
  }>;
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
  user?: WorkerUser;
  addresses?: WorkerAddress[];
  emergencyContacts?: unknown[];
  skills?: WorkerSkill[];
  education?: unknown[];
  certifications?: unknown[];
  verificationRequests?: WorkerVerificationRequest[];
  profileCompletion?: number;
  gender?: string | null;
  maritalStatus?: string | null;
  availabilityStatus?: WorkerAvailability;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedWorkers {
  items: Worker[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
