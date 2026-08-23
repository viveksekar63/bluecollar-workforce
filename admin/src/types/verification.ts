export type VerificationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "VERIFIED"
  | "FAILED"
  | "MANUAL_REVIEW"
  | "EXPIRED";

export type VerificationType =
  | "IDENTITY"
  | "ADDRESS"
  | "EMPLOYMENT"
  | "CRIMINAL"
  | "EDUCATION"
  | "SKILL"
  | "REFERENCE"
  | "DOCUMENT";

export type VerificationResultStatus =
  | "MATCH"
  | "PARTIAL_MATCH"
  | "NO_MATCH"
  | "NOT_FOUND"
  | "MANUAL_REVIEW";

export interface VerificationResult {
  id: string;
  result: VerificationResultStatus;
  score?: number | null;
  remarks?: string | null;
  evidenceStorageKey?: string | null;
  createdAt?: string;
}

export interface VerificationCheck {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  provider?: string | null;
  providerReference?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  result?: VerificationResult | null;
}

export interface VerificationWorker {
  id: string;
  workerCode: string;
  verificationStatus: VerificationStatus;
  verificationScore?: number | null;
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone: string;
    profilePhotoUrl?: string | null;
    status?: string;
  };
}

export interface VerificationRequest {
  id: string;
  status: VerificationStatus;
  overallScore?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  worker: VerificationWorker;
  checks: VerificationCheck[];
}

export interface VerificationResponse {
  data: VerificationRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VerificationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: VerificationStatus | "";
}

export interface UpdateVerificationStatusPayload {
  status: VerificationStatus;
}

export interface UpdateVerificationCheckPayload {
  status: VerificationStatus;
  result?: VerificationResultStatus;
  score?: number;
  remarks?: string;
  evidenceStorageKey?: string;
}
