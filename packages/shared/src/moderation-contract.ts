import type { SiteContext } from './site';

export type ModerationTaskType =
  | 'report'
  | 'changed_feedback'
  | 'ai_output_review'
  | 'application_review'
  | 'space_claim';

export type ModerationStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed' | 'escalated';

export interface ModerationTaskRecord {
  id: string;
  site: SiteContext;
  type: ModerationTaskType;
  status: ModerationStatus;
  targetType: string;
  targetId: string;
  title: string;
  reason: string | null;
  payload: Record<string, unknown>;
  reporterId: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModerationTaskRequest {
  site: Exclude<SiteContext, 'all'>;
  type: ModerationTaskType;
  targetType: string;
  targetId: string;
  title: string;
  reason?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateModerationTaskStatusRequest {
  status: Exclude<ModerationStatus, 'pending'>;
  note?: string;
}

export interface SpaceClaimModerationPayload {
  spaceId: string;
  spaceSlug: string;
  currentOwnerId: string | null;
  candidateUserId: string;
  lastActiveAt: string;
}

export interface ChangedFeedbackModerationPayload {
  articleId: string;
  articleTitle?: string;
  changedCount: number;
}

export interface ModerationStatusTransitionResponse {
  task: ModerationTaskRecord;
  sideEffects: string[];
}
