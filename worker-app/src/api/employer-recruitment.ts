import { api } from './client';

export type EmployerJob = {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  status?: string | null;
  openings?: number | null;
  createdAt?: string;
};

export type RecruitmentCandidate = {
  workerId: string;
  workerCode: string;
  name: string;
  profession: string;
  experienceYears: number | null;
  matchScore: number | null;
  matchTier: string | null;
  verificationStatus: string;
  verificationScore: number | null;
  positiveEvents: number;
  noResponseEvents: number;
  priorityScore: number;
  action: 'CONTACT_NOW' | 'FOLLOW_UP_NOW' | 'FOLLOW_UP_LATER' | 'REVIEW' | 'STOP_CONTACT';
  reasons: string[];
  conversionScore: number;
  conversionBand: 'HIGH' | 'MEDIUM' | 'LOW';
  conversionReasons: string[];
  outreach: {
    status: string;
    contactAttempts: number;
    lastContactedAt: string | null;
    nextFollowUpAt: string | null;
    outcome: string | null;
  };
};

export type AiContactRecommendation = {
  workerId: string;
  workerCode: string;
  name: string;
  profession: string;
  professionCategory?: string | null;
  experienceYears: number | null;
  profileImageUrl?: string | null;
  verificationStatus: string;
  verificationScore: number | null;
  matchScore: number;
  matchTier: string | null;
  matchReasons: string[];
  matchBreakdown: Record<string, number> | null;
  preferenceScore: number;
  languageScore: number;
  isShortlisted: boolean;
  recommendationRank: number;
  recommendationAction: 'CONTACT_NOW' | 'HIGH_PRIORITY' | 'REVIEW';
  contactLocked: true;
  contactUnlockRequired: true;
};

export type AiContactRecommendations = {
  success: boolean;
  mode: 'AI_CONTACT_RECOMMENDATIONS';
  job: { id: string; title: string; status: string; city?: string | null; district?: string | null; state?: string | null; openings?: number | null };
  recommendations: AiContactRecommendation[];
  summary: { candidatesEvaluated: number; recommended: number; shortlisted: number; contactLocked: number };
};

export type RecruitmentDashboard = {
  success: boolean;
  mode: string;
  job: { id: string; title: string; status: string };
  summary: {
    totalMatchedWorkers: number;
    shortlisted: number;
    notContacted: number;
    contacted: number;
    noResponse: number;
    interested: number;
    interview: number;
    selected: number;
    hired: number;
    unavailable: number;
    notInterested: number;
    contactNow: number;
    followUpsDue: number;
    highConversionCandidates: number;
    candidatesLosingInterest: number;
  };
  funnel: { stage: string; count: number }[];
  contactNow: RecruitmentCandidate[];
  followUpsDue: RecruitmentCandidate[];
  highConversionCandidates: RecruitmentCandidate[];
  candidatesLosingInterest: RecruitmentCandidate[];
};

export type RecruitmentContactUnlockResult = {
  success: boolean;
  alreadyUnlocked?: boolean;
  purchaseId?: string | null;
  balance?: number;
  creditsUsed?: number;
  workerId: string;
  contact?: { phone?: string | null; email?: string | null };
  message?: string;
};

export async function getEmployerJobs() {
  const response = await api.get<EmployerJob[]>('/jobs/employer/my');
  return response.data;
}

export async function getRecruitmentDashboard(jobId: string) {
  const response = await api.get<RecruitmentDashboard>(`/jobs/${jobId}/recruitment-ai/dashboard`);
  return response.data;
}

export async function getAiContactRecommendations(jobId: string, limit = 10) {
  const response = await api.get<AiContactRecommendations>(`/ai/jobs/${jobId}/recommended-workers`, { params: { limit } });
  return response.data;
}

export async function shortlistAiWorker(jobId: string, workerId: string, input: { matchScore?: number; matchTier?: string; matchExplanation?: Record<string, unknown> } = {}) {
  const response = await api.post(`/jobs/${jobId}/workers/${workerId}/shortlist`, input);
  return response.data;
}

export async function getRecruitmentRecommendations(jobId: string, limit = 20) {
  const response = await api.get(`/jobs/${jobId}/autopilot/recommendations`, { params: { limit } });
  return response.data;
}

export async function unlockRecruitmentWorkerContact(workerId: string) {
  const response = await api.post<RecruitmentContactUnlockResult>(`/workers/${workerId}/contact`);
  return response.data;
}

export async function initializeOutreach(jobId: string, workerId: string, preferredChannel?: string) {
  const response = await api.post(`/jobs/${jobId}/workers/${workerId}/outreach`, preferredChannel ? { preferredChannel } : {});
  return response.data;
}

export async function logRecruitmentContact(jobId: string, workerId: string, input: { channel: 'PHONE' | 'WHATSAPP' | 'SMS' | 'EMAIL'; status?: string; outcome?: string; notes?: string; nextFollowUpAt?: string | null }) {
  const response = await api.post(`/jobs/${jobId}/workers/${workerId}/outreach/contact`, input);
  return response.data;
}

export async function updateRecruitmentStatus(jobId: string, workerId: string, input: { status: string; outcome?: string; notes?: string; nextFollowUpAt?: string | null }) {
  const response = await api.patch(`/jobs/${jobId}/workers/${workerId}/outreach/status`, input);
  return response.data;
}

export async function scheduleRecruitmentFollowUp(jobId: string, workerId: string, nextFollowUpAt: string, notes?: string) {
  const response = await api.post(`/jobs/${jobId}/workers/${workerId}/outreach/follow-up`, { nextFollowUpAt, notes });
  return response.data;
}

export async function getRecruitmentTimeline(jobId: string, workerId: string) {
  const response = await api.get(`/jobs/${jobId}/workers/${workerId}/outreach/timeline`);
  return response.data;
}
