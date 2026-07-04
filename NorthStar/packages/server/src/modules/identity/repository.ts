import { and, eq, or, gt, sql } from "drizzle-orm";
import type {
  AccountRecord,
  ApplicationRequestRecord,
  ApplicationRequestStatus,
  CampusProfileRecord,
  CompassProfileRecord,
  CredentialRecord,
  GlobalLevel,
  IdentityUser,
  InviteCodeRecord,
  PlatformRole,
  SiteContext,
} from "@ns/shared";
import { db } from "../../db/client";
import {
  accounts,
  applicationRequests,
  campusProfiles,
  compassProfiles,
  credentials,
  inviteCodes,
  levelChangeLogs,
  userConsents,
  users,
} from "../../db/schema";
import type { IdentityCreateInput, IdentityModuleStatus } from "./types";
import { isAtLeastReviewer, isAtLeastEditor } from '../platform/permissions';

export function getIdentityModuleStatus(): IdentityModuleStatus {
  return { module: "identity", ready: true };
}

export async function findUserByAccount(site: Exclude<SiteContext, "all">, account: string) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.site, site), or(eq(users.username, account), eq(users.email, account))))
    .limit(1);

  return rows[0] ?? null;
}

export async function findAccountByCredentialIdentifier(identifier: string, type = "password") {
  if (!db) return null;

  const rows = await db
    .select({
      account: accounts,
      credential: credentials,
    })
    .from(credentials)
    .innerJoin(accounts, eq(credentials.accountId, accounts.id))
    .where(and(eq(credentials.type, type), eq(credentials.identifier, normalizeIdentifier(identifier))))
    .limit(1);

  return rows[0] ?? null;
}

export async function findAccountById(id: number) {
  if (!db) return null;

  const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAccount(input: {
  handle: string;
  email?: string;
  name: string;
  globalLevel?: GlobalLevel;
}) {
  if (!db) return null;

  const [account] = await db
    .insert(accounts)
    .values({
      handle: normalizeIdentifier(input.handle),
      email: input.email ? normalizeIdentifier(input.email) : null,
      name: input.name,
      globalLevel: input.globalLevel ?? "user",
    })
    .returning();

  if (account) {
    await db.insert(levelChangeLogs).values({
      accountId: account.id,
      fromLevel: null,
      toLevel: account.globalLevel,
      reason: "account_created",
      changedBy: null,
    });
  }

  return account ?? null;
}

export async function createCredential(input: {
  accountId: number;
  type: "password" | "github";
  identifier: string;
  secretHash?: string | null;
  verified?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<CredentialRecord | null> {
  if (!db) return null;

  const [row] = await db
    .insert(credentials)
    .values({
      accountId: input.accountId,
      type: input.type,
      identifier: normalizeIdentifier(input.identifier),
      secretHash: input.secretHash ?? null,
      verified: input.verified ?? false,
      metadata: input.metadata ?? {},
    })
    .onConflictDoNothing()
    .returning();

  if (row) return toCredentialRecord(row);

  const existing = await db
    .select()
    .from(credentials)
    .where(and(eq(credentials.type, input.type), eq(credentials.identifier, normalizeIdentifier(input.identifier))))
    .limit(1);

  return existing[0] ? toCredentialRecord(existing[0]) : null;
}

export async function findSiteProfileByAccount(accountId: number, site: Exclude<SiteContext, "all">) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.accountId, accountId), eq(users.site, site)))
    .limit(1);

  return rows[0] ?? null;
}

export async function findUserById(id: number) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findUserByGitHubId(site: Exclude<SiteContext, "all">, githubId: string) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.site, site), eq(users.githubId, githubId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createIdentityUser(input: IdentityCreateInput) {
  if (!db) return null;

  const [user] = await db
    .insert(users)
    .values({
      accountId: input.accountId ?? null,
      username: input.username,
      email: input.email ?? null,
      githubId: input.githubId ?? null,
      site: input.site,
      role: "user",
      nickname: input.nickname ?? input.username,
      passwordHash: input.passwordHash ?? null,
      emailVerified: input.emailVerified ?? false,
      emailVerificationToken: input.emailVerificationToken ?? null,
      emailVerificationExpiresAt: input.emailVerificationExpiresAt ?? null,
      avatar: input.avatar ?? null,
      school: input.site === "cn" ? "黑河学院" : null,
      trustLevel: "user",
    })
    .returning();

  if (input.consentVersion) {
    await db
      .insert(userConsents)
      .values([
        {
          userId: user.id,
          site: input.site,
          documentType: "terms",
          version: input.consentVersion,
        },
        {
          userId: user.id,
          site: input.site,
          documentType: "privacy",
          version: input.consentVersion,
        },
      ])
      .onConflictDoNothing();
  }

  return user;
}

export async function createSiteProfile(input: IdentityCreateInput & { accountId: number }) {
  const user = await createIdentityUser(input);
  if (!user || !db) return user;

  if (input.site === "cn") {
    await db
      .insert(campusProfiles)
      .values({
        accountId: input.accountId,
        userId: user.id,
        school: input.school ?? "黑河学院",
        cityId: user.cityId,
      })
      .onConflictDoNothing();
  } else {
    await db
      .insert(compassProfiles)
      .values({
        accountId: input.accountId,
        userId: user.id,
      })
      .onConflictDoNothing();
  }

  return user;
}

export async function ensureSiteProfile(input: {
  account: typeof accounts.$inferSelect;
  site: Exclude<SiteContext, "all">;
  preferredUsername?: string;
}) {
  const existing = await findSiteProfileByAccount(input.account.id, input.site);
  if (existing) return existing;

  return createSiteProfile({
    accountId: input.account.id,
    username: await buildAvailableUsername(input.preferredUsername ?? input.account.handle, input.site),
    email: undefined,
    site: input.site,
    nickname: input.account.name,
    passwordHash: undefined,
    emailVerified: Boolean(input.account.email),
  });
}

export async function updateApplicationRequestStatus(
  id: number,
  status: Extract<ApplicationRequestStatus, "approved" | "rejected">,
  reviewerId: number | null,
) {
  if (!db) return null;

  const [row] = await db
    .update(applicationRequests)
    .set({
      status,
      reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(applicationRequests.id, id))
    .returning();

  return row ? toApplicationRequest(row) : null;
}

export async function findApprovedApplicationByEmail(site: Exclude<SiteContext, "all">, email: string) {
  if (!db) return null;

  const rows = await db
    .select()
    .from(applicationRequests)
    .where(and(eq(applicationRequests.site, site), eq(applicationRequests.email, email), eq(applicationRequests.status, "approved")))
    .orderBy(applicationRequests.createdAt)
    .limit(1);

  return rows[0] ? toApplicationRequest(rows[0]) : null;
}

export async function bindGitHubIdentity(input: {
  userId: number;
  githubId: string;
  nickname: string;
  email?: string;
  avatar?: string;
}) {
  if (!db) return null;

  const [row] = await db
    .update(users)
    .set({
      githubId: input.githubId,
      nickname: input.nickname,
      email: input.email ?? null,
      emailVerified: Boolean(input.email),
      avatar: input.avatar ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
    .returning();

  return row ?? null;
}

export async function bindGitHubCredential(input: {
  accountId: number;
  githubId: string;
  githubLogin: string;
}) {
  return createCredential({
    accountId: input.accountId,
    type: "github",
    identifier: input.githubId,
    verified: true,
    metadata: { login: input.githubLogin },
  });
}

export async function createApplicationRequest(input: {
  site: Exclude<SiteContext, "all">;
  name: string;
  email: string;
  useCase: string;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(applicationRequests)
    .values({
      site: input.site,
      name: input.name,
      email: input.email,
      useCase: input.useCase,
      status: "pending",
    })
    .returning();

  return row ? toApplicationRequest(row) : null;
}

export async function createInviteCode(input: {
  site: Exclude<SiteContext, "all">;
  code: string;
  maxUses: number;
  expiresAt?: Date;
  createdBy: number | null;
}) {
  if (!db) return null;

  const [row] = await db
    .insert(inviteCodes)
    .values({
      site: input.site,
      code: input.code,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt ?? null,
      createdBy: input.createdBy,
    })
    .returning();

  return row ? toInviteCode(row) : null;
}

export async function listInviteCodesByCreator(createdBy: number, site: Exclude<SiteContext, "all">) {
  if (!db) return [];

  const rows = await db
    .select()
    .from(inviteCodes)
    .where(and(eq(inviteCodes.createdBy, createdBy), eq(inviteCodes.site, site)))
    .orderBy(inviteCodes.createdAt)
    .limit(20);

  return rows.map(toInviteCode);
}

export async function consumeInviteCode(site: Exclude<SiteContext, "all">, code: string) {
  if (!db) return null;

  const rows = await db.select().from(inviteCodes).where(and(eq(inviteCodes.site, site), eq(inviteCodes.code, code))).limit(1);
  const invite = rows[0];
  if (!invite) return { ok: false as const, reason: "not_found" as const };
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };
  if (invite.usedCount >= invite.maxUses) return { ok: false as const, reason: "exhausted" as const };

  const [updated] = await db
    .update(inviteCodes)
    .set({ usedCount: invite.usedCount + 1 })
    .where(eq(inviteCodes.id, invite.id))
    .returning();

  return updated ? { ok: true as const, invite: toInviteCode(updated) } : null;
}

export async function verifyEmailToken(token: string) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
  const user = rows[0];
  if (!user) return null;

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
    return { expired: true as const, user };
  }

  const [updated] = await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return { expired: false as const, user: updated };
}

export async function setPasswordResetToken(id: number, token: string, expiresAt: Date) {
  if (!db) return null;

  const [user] = await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return user ?? null;
}

export async function resetPasswordByToken(token: string, passwordHash: string) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  const user = rows[0];
  if (!user) return null;

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    return { expired: true as const, user };
  }

  const invalidatedAt = new Date();
  const [updated] = await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      tokenInvalidBefore: invalidatedAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  if (user.accountId) {
    await db
      .update(credentials)
      .set({
        secretHash: passwordHash,
        updatedAt: new Date(),
      })
      .where(and(eq(credentials.accountId, user.accountId), eq(credentials.type, "password")));

    await db
      .update(accounts)
      .set({
        tokenInvalidBefore: invalidatedAt,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, user.accountId));
  }

  return { expired: false as const, user: updated };
}

export async function invalidateUserTokens(id: number) {
  if (!db) return null;

  const [user] = await db
    .update(users)
    .set({
      tokenInvalidBefore: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return user ?? null;
}

export async function invalidateAccountTokens(accountId: number) {
  if (!db) return null;

  const [account] = await db
    .update(accounts)
    .set({
      tokenInvalidBefore: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId))
    .returning();

  await db
    .update(users)
    .set({
      tokenInvalidBefore: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.accountId, accountId));

  return account ?? null;
}

export async function readAccountProfiles(accountId: number) {
  if (!db) return { campusProfile: null, compassProfile: null };

  const [campusRows, compassRows] = await Promise.all([
    db
      .select({ profile: campusProfiles, user: users })
      .from(campusProfiles)
      .innerJoin(users, eq(campusProfiles.userId, users.id))
      .where(eq(campusProfiles.accountId, accountId))
      .limit(1),
    db
      .select({ profile: compassProfiles, user: users })
      .from(compassProfiles)
      .innerJoin(users, eq(compassProfiles.userId, users.id))
      .where(eq(compassProfiles.accountId, accountId))
      .limit(1),
  ]);

  return {
    campusProfile: campusRows[0] ? toCampusProfileRecord(campusRows[0].profile, campusRows[0].user) : null,
    compassProfile: compassRows[0] ? toCompassProfileRecord(compassRows[0].profile, compassRows[0].user) : null,
  };
}

export async function updateCompassProfileInDb(input: {
  accountId: number;
  userId: number;
  displayName?: string;
}) {
  if (!db) return null;

  const [profileRow] = await db
    .select({ profile: compassProfiles, user: users })
    .from(compassProfiles)
    .innerJoin(users, eq(compassProfiles.userId, users.id))
    .where(and(eq(compassProfiles.accountId, input.accountId), eq(compassProfiles.userId, input.userId)))
    .limit(1);

  if (!profileRow) return null;

  let user = profileRow.user;
  if (input.displayName !== undefined) {
    const [updatedUser] = await db
      .update(users)
      .set({ nickname: input.displayName.trim(), updatedAt: new Date() })
      .where(eq(users.id, input.userId))
      .returning();
    if (updatedUser) user = updatedUser;
  }

  const [profile] = await db
    .update(compassProfiles)
    .set({ updatedAt: new Date() })
    .where(eq(compassProfiles.id, profileRow.profile.id))
    .returning();

  return profile ? toCompassProfileRecord(profile, user) : null;
}

const BACKFILL_BATCH = 200;

export async function backfillAccountsForExistingUsers() {
  if (!db) return { accounts: 0, profiles: 0 };

  let accountCount = 0;
  let profileCount = 0;
  let cursor: number | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch: typeof users.$inferSelect[] = cursor
      ? await db.select().from(users).where(gt(users.id, cursor)).limit(BACKFILL_BATCH)
      : await db.select().from(users).limit(BACKFILL_BATCH);

    if (batch.length === 0) break;

    for (const user of batch) {
      if (user.accountId) {
        await ensureProfileRow(user);
        profileCount += 1;
        continue;
      }

      const identifier = user.email || user.username;
      const existing = await findAccountByCredentialIdentifier(identifier);
      const account =
        existing?.account ??
        (await createAccount({
          handle: user.username,
          email: user.email ?? undefined,
          name: user.nickname,
          globalLevel: toGlobalLevel(user.trustLevel),
        }));
      if (!account) continue;
      if (!existing) accountCount += 1;

      await db.update(users).set({ accountId: account.id }).where(eq(users.id, user.id));

      if (user.passwordHash) {
        await createCredential({
          accountId: account.id,
          type: "password",
          identifier: user.username,
          secretHash: user.passwordHash,
          verified: user.emailVerified,
        });
        if (user.email) {
          await createCredential({
            accountId: account.id,
            type: "password",
            identifier: user.email,
            secretHash: user.passwordHash,
            verified: user.emailVerified,
          });
        }
      }
      if (user.githubId) {
        await createCredential({
          accountId: account.id,
          type: "github",
          identifier: user.githubId,
          verified: true,
        });
      }

      await ensureProfileRow({ ...user, accountId: account.id });
      profileCount += 1;
    }

    cursor = batch[batch.length - 1].id;
  }

  return { accounts: accountCount, profiles: profileCount };
}

export function toIdentityUser(user: typeof users.$inferSelect): IdentityUser {
  const accountId = user.accountId ?? user.id;
  return {
    id: String(user.id),
    accountId: String(accountId),
    profileId: String(user.id),
    username: user.username,
    email: user.email ?? "",
    name: user.nickname,
    role: toPlatformRole(user.role),
    site: user.site === "com" ? "com" : "cn",
    globalLevel: toGlobalLevel(user.trustLevel),
    emailVerified: user.emailVerified,
  };
}

export function toIdentityUserWithAccount(
  user: typeof users.$inferSelect,
  account: typeof accounts.$inferSelect | null,
): IdentityUser {
  return {
    ...toIdentityUser(user),
    accountId: String(account?.id ?? user.accountId ?? user.id),
    email: account?.email ?? user.email ?? "",
    name: account?.name ?? user.nickname,
    globalLevel: toGlobalLevel(account?.globalLevel ?? user.trustLevel),
  };
}

export function toAccountRecord(row: typeof accounts.$inferSelect): AccountRecord {
  return {
    id: String(row.id),
    handle: row.handle,
    email: row.email,
    name: row.name,
    globalLevel: toGlobalLevel(row.globalLevel),
    disabled: Boolean(row.disabledAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toApplicationRequest(row: typeof applicationRequests.$inferSelect): ApplicationRequestRecord {
  return {
    id: String(row.id),
    site: row.site === "com" ? "com" : "cn",
    name: row.name,
    email: row.email,
    useCase: row.useCase,
    status: row.status === "approved" || row.status === "rejected" ? row.status : "pending",
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
  };
}

function toInviteCode(row: typeof inviteCodes.$inferSelect): InviteCodeRecord {
  return {
    id: String(row.id),
    site: row.site === "com" ? "com" : "cn",
    code: row.code,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt?.toISOString(),
    createdBy: row.createdBy ? String(row.createdBy) : undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toPlatformRole(value: string): PlatformRole {
  const VALID_ROLES = new Set<PlatformRole>(["visitor", "user", "editor", "reviewer", "operator", "admin"]);
  if (VALID_ROLES.has(value as PlatformRole)) return value as PlatformRole;
  return "user";
}

function toGlobalLevel(value: string | null | undefined): GlobalLevel {
  if (value === "guest" || value === "active" || value === "author" || value === "senior" || value === "admin") {
    return value;
  }
  return "user";
}

function toCredentialRecord(row: typeof credentials.$inferSelect): CredentialRecord {
  return {
    id: String(row.id),
    accountId: String(row.accountId),
    type: row.type === "github" ? "github" : "password",
    identifier: row.identifier,
    verified: row.verified,
    createdAt: row.createdAt.toISOString(),
  };
}

function toCampusProfileRecord(
  profile: typeof campusProfiles.$inferSelect,
  user: typeof users.$inferSelect,
): CampusProfileRecord {
  return {
    id: String(profile.id),
    accountId: String(profile.accountId),
    userId: String(profile.userId),
    username: user.username,
    name: user.nickname,
    school: profile.school,
    role: toPlatformRole(user.role),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toCompassProfileRecord(
  profile: typeof compassProfiles.$inferSelect,
  user: typeof users.$inferSelect,
): CompassProfileRecord {
  return {
    id: String(profile.id),
    accountId: String(profile.accountId),
    userId: String(profile.userId),
    username: user.username,
    name: user.nickname,
    role: toPlatformRole(user.role),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

async function ensureProfileRow(user: typeof users.$inferSelect) {
  if (!db || !user.accountId) return;

  if (user.site === "com") {
    await db
      .insert(compassProfiles)
      .values({ accountId: user.accountId, userId: user.id })
      .onConflictDoNothing();
    return;
  }

  await db
    .insert(campusProfiles)
    .values({
      accountId: user.accountId,
      userId: user.id,
      school: user.school,
      cityId: user.cityId,
    })
    .onConflictDoNothing();
}

async function buildAvailableUsername(base: string, site: Exclude<SiteContext, "all">) {
  const normalizedBase =
    base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "user";
  let candidate = normalizedBase;
  let suffix = 1;

  while (await findUserByUsername(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}-${site}-${suffix}`.slice(0, 48);
  }

  return candidate;
}

async function findUserByUsername(username: string) {
  if (!db) return null;

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] ?? null;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}
