import type { SiteContext } from './site';

export type PlatformRole = 'visitor' | 'user' | 'editor' | 'reviewer' | 'operator' | 'admin';
export type GlobalLevel = 'guest' | 'user' | 'active' | 'author' | 'senior' | 'admin';

const GLOBAL_LEVELS = new Set<string>(['guest', 'user', 'active', 'author', 'senior', 'admin']);

export function isGlobalLevel(value: unknown): value is GlobalLevel {
  return typeof value === 'string' && GLOBAL_LEVELS.has(value);
}
export type CredentialType = 'password' | 'github';

export interface IdentityUser {
  id: string;
  accountId: string;
  profileId: string;
  username: string;
  email: string;
  name: string;
  role: PlatformRole;
  site: Exclude<SiteContext, 'all'>;
  globalLevel: GlobalLevel;
  emailVerified: boolean;
}

export interface AccountRecord {
  id: string;
  handle: string;
  email: string | null;
  name: string;
  globalLevel: GlobalLevel;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialRecord {
  id: string;
  accountId: string;
  type: CredentialType;
  identifier: string;
  verified: boolean;
  createdAt: string;
}

export interface CampusProfileRecord {
  id: string;
  accountId: string;
  userId: string;
  username: string;
  name: string;
  school: string | null;
  role: PlatformRole;
  createdAt: string;
  updatedAt: string;
}

export interface CompassProfileRecord {
  id: string;
  accountId: string;
  userId: string;
  username: string;
  name: string;
  role: PlatformRole;
  createdAt: string;
  updatedAt: string;
}

export interface LevelChangeLogRecord {
  id: string;
  accountId: string;
  fromLevel: GlobalLevel | null;
  toLevel: GlobalLevel;
  reason: string;
  changedBy: string | null;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  site: Exclude<SiteContext, 'all'>;
  consentVersion?: string;
  inviteCode?: string;
}

export interface LoginRequest {
  account: string;
  password: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface IdentitySession {
  token: string;
  user: IdentityUser;
}

export interface IdentityMeResponse {
  user: IdentityUser;
  account: AccountRecord;
  campusProfile?: CampusProfileRecord | null;
  compassProfile?: CompassProfileRecord | null;
}

export interface UpdateCompassProfileRequest {
  displayName?: string;
}

export interface UpdateCompassProfileResponse {
  compassProfile: CompassProfileRecord;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  user: IdentityUser;
}

export interface PasswordResetRequest {
  email: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

export type ApplicationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationRequestInput {
  name: string;
  email: string;
  useCase: string;
  site: Exclude<SiteContext, 'all'>;
}

export interface ApplicationRequestRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  name: string;
  email: string;
  useCase: string;
  status: ApplicationRequestStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface CreateInviteCodeRequest {
  code?: string;
  site: Exclude<SiteContext, 'all'>;
  maxUses?: number;
  expiresAt?: string;
}

export interface InviteCodeRecord {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface GitHubOAuthStatusResponse {
  configured: boolean;
  site: Exclude<SiteContext, 'all'>;
  callbackUrl?: string;
}

export interface GitHubOAuthStartRequest {
  site: Exclude<SiteContext, 'all'>;
}

export interface GitHubOAuthStartResponse {
  authorizeUrl: string;
}
