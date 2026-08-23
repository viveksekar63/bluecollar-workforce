import { api } from './client';

export type WorkerDocumentType =
  | 'ID_PROOF'
  | 'ADDRESS_PROOF'
  | 'EXPERIENCE_LETTER'
  | 'SALARY_SLIP'
  | 'EDUCATION_CERTIFICATE'
  | 'SKILL_CERTIFICATE'
  | 'BANK_DOCUMENT'
  | 'OTHER';

export interface WorkerDocument {
  id: string;
  workerId: string;
  type: WorkerDocumentType;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  documentNumber?: string | null;
  verificationStatus: string;
  uploadedAt: string;
  verifiedAt?: string | null;
  downloadUrl?: string;
  verification?: {
    id: string;
    provider?: string | null;
    providerRef?: string | null;
    status: string;
    remarks?: string | null;
    verifiedAt?: string | null;
  } | null;
}

export async function getMyDocuments() {
  const { data } = await api.get<WorkerDocument[]>('/documents/me');
  return data;
}

export async function uploadMyDocument(
  type: WorkerDocumentType,
  asset: { uri: string; name: string; mimeType?: string | null; size?: number | null },
  documentNumber?: string,
) {
  const formData = new FormData();
  formData.append('type', type);
  if (documentNumber?.trim()) {
    formData.append('documentNumber', documentNumber.trim());
  }

  formData.append(
    'file',
    {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
    } as any,
  );

  const { data } = await api.post<WorkerDocument>('/documents/me/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  return data;
}

export async function deleteMyDocument(documentId: string) {
  const { data } = await api.delete<{ success: boolean }>(`/documents/me/${documentId}`);
  return data;
}

export async function getMyDocumentUrl(documentId: string) {
  const { data } = await api.get<{ documentId: string; url: string; expiresIn: number }>(
    `/documents/me/${documentId}/url`,
  );
  return data;
}
