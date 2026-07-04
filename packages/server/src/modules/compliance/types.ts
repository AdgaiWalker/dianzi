import type {
  AccountDeletionRequestInput,
  AccountDeletionRequestRecord,
  AccountDeletionStatus,
  ConsentRequest,
  CreateLegalDocumentRequest,
  DataExportResponse,
  LegalDocumentStatus,
  LegalDocumentRecord,
  SiteContext,
  UserConsentRecord,
} from "@dianzi/shared";

export type {
  AccountDeletionRequestInput,
  AccountDeletionRequestRecord,
  AccountDeletionStatus,
  ConsentRequest,
  CreateLegalDocumentRequest,
  DataExportResponse,
  LegalDocumentStatus,
  LegalDocumentRecord,
  SiteContext,
  UserConsentRecord,
};

export interface ComplianceModuleStatus {
  module: "compliance";
  ready: boolean;
}
