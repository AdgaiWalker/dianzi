export type CapabilitySite = 'campus' | 'compass';

export interface CampusCapabilityResponse {
  site: 'campus';
  canPost: boolean;
  canWriteArticle: boolean;
  canCreateSpace: boolean;
  canUseAiSearch: boolean;
  aiSearchRemaining: number;
  lockedReason: string | null;
}

export interface CompassCapabilityResponse {
  site: 'compass';
  canGenerateSolution: boolean;
  canSaveSolution: boolean;
  canExportSolution: boolean;
  canSubmitContent: boolean;
  solutionRemaining: number;
  lockedReason: string | null;
}

export type CapabilityResponse = CampusCapabilityResponse | CompassCapabilityResponse;

export interface PlatformCapabilityItem {
  key: string;
  label: string;
  enabled: boolean;
  lockedReason: string | null;
}

export interface PlatformCapabilityListResponse {
  site: CapabilitySite;
  items: PlatformCapabilityItem[];
}
