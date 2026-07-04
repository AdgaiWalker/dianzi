export interface CreateCampusSpaceRequest {
  slug: string;
  title: string;
  description: string;
  category: string;
}

export type CampusSearchMode = 'exact' | 'partial' | 'empty';

export interface CampusSearchHit {
  id: string;
  type: 'article' | 'post' | 'space';
  title: string;
  summary: string;
  snippet: string;
  highlights: string[];
}

export interface CampusSearchStateResponse {
  query: string;
  mode: CampusSearchMode;
  total: number;
  hits: CampusSearchHit[];
}

export interface CampusFeedbackResponse {
  articleId: string;
  helpfulCount?: number;
  changedCount?: number;
  confirmedAt?: string;
  feedback?: {
    id: string;
    articleId: string;
    note: string;
    createdAt: string;
  };
}

export interface CampusPostReplyRequest {
  content: string;
}

export interface CampusPostStatusResponse {
  postId: string;
  status: 'open' | 'solved';
  updatedAt: string;
}

export interface SpaceClaimScanRequest {
  candidateUserId?: string;
  olderThanDays?: number;
  limit?: number;
}

export interface SpaceClaimScanItem {
  taskId: string;
  spaceId: string;
  spaceSlug: string;
  spaceTitle: string;
  currentOwnerId: string;
  candidateUserId: string;
  lastActiveAt: string;
}

export interface SpaceClaimScanResponse {
  items: SpaceClaimScanItem[];
  createdCount: number;
  skippedCount: number;
}
