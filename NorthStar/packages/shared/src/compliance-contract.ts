import type { SiteContext } from './site';

export type LegalDocumentType = 'privacy' | 'terms';
export type LegalDocumentStatus = 'published' | 'archived';
export type AccountDeletionStatus = 'pending' | 'in_review' | 'processing' | 'completed' | 'rejected';

export interface LegalDocumentRecord {
  id: string;
  site: SiteContext;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  status: LegalDocumentStatus;
  publishedAt: string;
}

export interface UserConsentRecord {
  id: string;
  userId: string;
  site: Exclude<SiteContext, 'all'>;
  documentType: LegalDocumentType;
  version: string;
  consentedAt: string;
}

export interface AccountDeletionRequestRecord {
  id: string;
  userId: string;
  site: Exclude<SiteContext, 'all'>;
  status: AccountDeletionStatus;
  reason?: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface DataExportResponse {
  userId: string;
  site: Exclude<SiteContext, 'all'>;
  exportedAt: string;
  payload: Record<string, unknown>;
}

export interface ConsentRequest {
  site: Exclude<SiteContext, 'all'>;
  version: string;
}

export interface AccountDeletionRequestInput {
  reason?: string;
}

export interface CreateLegalDocumentRequest {
  site: Exclude<SiteContext, 'all'>;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  status?: LegalDocumentStatus;
}

export interface UpdateLegalDocumentStatusRequest {
  status: LegalDocumentStatus;
}

export interface LegalDocumentListResponse {
  items: LegalDocumentRecord[];
}

export interface UserConsentListResponse {
  items: UserConsentRecord[];
}

export interface AccountDeletionRequestListResponse {
  items: AccountDeletionRequestRecord[];
}
