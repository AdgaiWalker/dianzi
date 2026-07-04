import type { SiteContext } from './site';

export interface SearchGapInsight {
  query: string;
  count: number;
  lastSearchedAt: string;
}

export interface ContentQualityReport {
  contentType: string;
  publishedCount: number;
  draftCount: number;
  pendingCount: number;
  rejectedCount: number;
  updatedWithin30Days: number;
  averageViews: number;
  averageLikes: number;
  averageComments: number;
}

export interface AiUsageSummary {
  site: SiteContext;
  totalCalls: number;
  aiCalls: number;
  fallbackCalls: number;
  fallbackRate: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostCents: number;
  peakHour: number | null;
  fallbackReasons: Array<{ reason: string; count: number }>;
}
