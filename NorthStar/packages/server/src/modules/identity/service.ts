import { randomBytes } from "node:crypto";
import type { SiteContext } from "@ns/shared";
import { getErrorMessage } from "@ns/shared";
import { hashPassword, signToken, verifyPassword, verifyToken, type AuthTokenPayload } from "../../lib/auth";
import {
  bindGitHubIdentity,
  bindGitHubCredential,
  createAccount,
  createCredential,
  consumeInviteCode,
  createApplicationRequest,
  createInviteCode,
  createSiteProfile,
  ensureSiteProfile,
  findApprovedApplicationByEmail,
  findAccountByCredentialIdentifier,
  findAccountById,
  findSiteProfileByAccount,
  findUserByAccount,
  findUserByGitHubId,
  findUserById,
  getIdentityModuleStatus as getModuleStatusFromRepo,
  listInviteCodesByCreator,
  readAccountProfiles,
  resetPasswordByToken,
  setPasswordResetToken,
  toAccountRecord,
  toIdentityUser,
  toIdentityUserWithAccount,
  updateApplicationRequestStatus,
  updateCompassProfileInDb,
  verifyEmailToken,
} from "./repository";
import { createModerationTask } from "../moderation/repository";
import { sendEmail } from "../notification/email-provider";
import type {
  ApplicationRequestInput,
  EmailVerificationRequest,
  GitHubOAuthStartRequest,
  GitHubOAuthStartResponse,
  GitHubOAuthStatusResponse,
  IdentityMeResponse,
  IdentitySession,
  LoginRequest,
  CreateInviteCodeRequest,
  InviteCodeRecord,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
} from "./types";
import type { UpdateCompassProfileRequest, UpdateCompassProfileResponse } from "@ns/shared";

export function getIdentityModuleStatus() {
  return getModuleStatusFromRepo();
}

export async function registerIdentity(input: RegisterRequest): Promise<Result<IdentitySession>> {
  const validation = validateRegisterInput(input);
  if (validation) return err("VALIDATION_ERROR", validation, 400);

  const site = toConcreteSite(input.site);
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedUsername = input.username.trim().toLowerCase();
  const existingAccount = await findAccountByCredentialIdentifier(normalizedUsername);
  const existingEmailAccount = normalizedEmail ? await findAccountByCredentialIdentifier(normalizedEmail) : null;
  if (existingAccount || existingEmailAccount) return err("IDENTITY_EXISTS", "用户名或邮箱已被使用", 409);

  if (site === "com") {
    if (input.inviteCode?.trim()) {
      const invite = await consumeInviteCode(site, input.inviteCode.trim());
      if (!invite) return err("DATABASE_UNAVAILABLE", "邀请码服务暂不可用", 503);
      if (!invite.ok) return err("INVITE_INVALID", "邀请码无效、过期或已用完", 403);
    } else if (normalizedEmail) {
      const approved = await findApprovedApplicationByEmail(site, normalizedEmail);
      if (!approved) {
        return err("APPLICATION_REQUIRED", "当前邮箱尚未通过全球站准入审核，请先提交申请或使用邀请码", 403);
      }
    } else {
      return err("INVITE_REQUIRED", "全球站注册需要邀请码，或使用已通过审核的邮箱注册", 403);
    }
  }
  const emailVerificationToken = normalizedEmail ? randomToken() : undefined;
  const passwordHash = hashPassword(input.password);

  const account = await createAccount({
    handle: normalizedUsername,
    email: normalizedEmail,
    name: input.username.trim(),
    globalLevel: "user",
  });
  if (!account) return err("DATABASE_UNAVAILABLE", "数据库未连接，无法注册", 503);

  await createCredential({
    accountId: account.id,
    type: "password",
    identifier: normalizedUsername,
    secretHash: passwordHash,
    verified: !normalizedEmail,
  });
  if (normalizedEmail) {
    await createCredential({
      accountId: account.id,
      type: "password",
      identifier: normalizedEmail,
      secretHash: passwordHash,
      verified: false,
    });
  }

  const user = await createSiteProfile({
    accountId: account.id,
    username: normalizedUsername,
    email: normalizedEmail,
    site,
    consentVersion: input.consentVersion,
    passwordHash,
    emailVerificationToken,
    emailVerificationExpiresAt: emailVerificationToken ? afterHours(24) : undefined,
  });

  if (!user) return err("DATABASE_UNAVAILABLE", "数据库未连接，无法注册", 503);

  return ok(toSession(user, account));
}

export async function submitApplicationRequest(input: ApplicationRequestInput) {
  const validation = validateApplicationInput(input);
  if (validation) return err("VALIDATION_ERROR", validation, 400);

  const site = toConcreteSite(input.site);
  const request = await createApplicationRequest({
    site,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    useCase: input.useCase.trim(),
  });

  if (!request) return err("DATABASE_UNAVAILABLE", "申请提交失败，请稍后重试", 503);
  await createModerationTask(
    {
      site,
      type: "application_review",
      targetType: "application",
      targetId: request.id,
      title: `全球站准入申请：${request.name}`,
      reason: request.useCase,
      payload: {
        applicationId: request.id,
        name: request.name,
        email: request.email,
        useCase: request.useCase,
      },
    },
    null,
  );
  return ok(request);
}

export async function createAdminInviteCode(input: CreateInviteCodeRequest, actor: AuthTokenPayload): Promise<Result<InviteCodeRecord>> {
  if (actor.role !== "operator" && actor.role !== "admin") {
    if (input.site !== "com" || actor.site !== "com") {
      return err("INVITE_FORBIDDEN", "没有创建邀请码权限", 403);
    }
    const actorId = toNumberOrNull(actor.sub);
    if (!actorId) return err("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);
    const existing = await listInviteCodesByCreator(actorId, "com");
    const reusable = existing.find((item) => item.usedCount < item.maxUses && !isExpired(item.expiresAt));
    if (reusable) return ok(reusable);

    const invite = await createInviteCode({
      site: "com",
      code: input.code?.trim() || randomToken().slice(0, 12),
      maxUses: 1,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : afterHours(24 * 30),
      createdBy: actorId,
    });
    if (!invite) return err("DATABASE_UNAVAILABLE", "邀请码创建失败", 503);
    return ok(invite);
  }

  if (actor.role !== "operator" && actor.role !== "admin") {
    return err("INVITE_FORBIDDEN", "没有创建邀请码权限", 403);
  }
  if (input.site !== "cn" && input.site !== "com") return err("VALIDATION_ERROR", "邀请码必须选择具体站点", 400);
  if (actor.role !== "admin" && actor.site !== input.site) {
    return err("SITE_FORBIDDEN", "当前登录态不能创建该站点邀请码", 403);
  }

  const maxUses = input.maxUses ?? 1;
  if (!Number.isInteger(maxUses) || maxUses <= 0 || maxUses > 100) {
    return err("VALIDATION_ERROR", "邀请码可用次数不正确", 400);
  }

  const invite = await createInviteCode({
    site: input.site,
    code: input.code?.trim() || randomToken().slice(0, 12),
    maxUses,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    createdBy: toNumberOrNull(actor.sub),
  });
  if (!invite) return err("DATABASE_UNAVAILABLE", "邀请码创建失败", 503);
  return ok(invite);
}

function isExpired(value?: string) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

export function getGitHubOAuthStatus(): GitHubOAuthStatusResponse {
  return {
    configured: isGitHubOAuthConfigured(),
    site: "com",
    callbackUrl: getGitHubCallbackUrl(),
  };
}

export async function startGitHubOAuth(
  input: GitHubOAuthStartRequest,
  actor?: AuthTokenPayload | null,
): Promise<Result<GitHubOAuthStartResponse>> {
  if (input.site !== "com") return err("VALIDATION_ERROR", "GitHub OAuth 仅支持全球站", 400);
  if (!isGitHubOAuthConfigured()) return err("OAUTH_NOT_CONFIGURED", "GitHub OAuth 尚未配置", 503);
  if (actor && actor.site && actor.site !== "com") return err("SITE_FORBIDDEN", "当前登录态不能绑定全球站 GitHub 账号", 403);

  const bindUserId =
    actor && actor.site === "com" && Number.isInteger(Number(actor.sub)) ? String(Number(actor.sub)) : "";
  const state = signToken({
    sub: bindUserId || "oauth",
    name: "github-oauth",
    username: "github-oauth",
    email: "",
    site: "com",
    role: "visitor",
    purpose: "github_oauth",
    bindUserId,
  });

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", getGitHubClientId());
  url.searchParams.set("redirect_uri", getGitHubCallbackUrl());
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);

  return ok({ authorizeUrl: url.toString() });
}

export async function finishGitHubOAuth(input: {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}) {
  if (!isGitHubOAuthConfigured()) {
    return { redirectUrl: buildGitHubErrorRedirect("GitHub OAuth 尚未配置") };
  }
  if (input.error) {
    return { redirectUrl: buildGitHubErrorRedirect(input.errorDescription || "GitHub 授权失败") };
  }
  if (!input.code || !input.state) {
    return { redirectUrl: buildGitHubErrorRedirect("GitHub 回调缺少必要参数") };
  }

  const state = parseGitHubOAuthState(input.state);
  if (!state) {
    return { redirectUrl: buildGitHubErrorRedirect("GitHub OAuth 状态校验失败") };
  }

  try {
    const accessToken = await exchangeGitHubAccessToken(input.code);
    const profile = await readGitHubProfile(accessToken);
    const email = await readGitHubVerifiedEmail(accessToken);

    if (!email) {
      return { redirectUrl: buildGitHubErrorRedirect("GitHub 账号缺少可用的已验证邮箱") };
    }

    const session = await buildGitHubIdentitySession({
      githubId: String(profile.id),
      githubLogin: profile.login!,
      name: (profile.name?.trim() || profile.login)!,
      email,
      avatar: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
      bindUserId: state.bindUserId,
    });

    if (!session.ok || !session.data) {
      return { redirectUrl: buildGitHubErrorRedirect(session.error?.message ?? "GitHub 登录失败") };
    }

    return { redirectUrl: buildGitHubSuccessRedirect(session.data) };
  } catch (error) {
    return { redirectUrl: buildGitHubErrorRedirect(getErrorMessage(error, "GitHub 登录失败")) };
  }
}

export async function applyApplicationReview(
  applicationId: string,
  approved: boolean,
  actor: AuthTokenPayload,
) {
  const numericId = Number(applicationId);
  if (!Number.isInteger(numericId)) return null;

  const reviewerId = toNumberOrNull(actor.sub);
  const status = approved ? "approved" : "rejected";
  const updated = await updateApplicationRequestStatus(numericId, status, reviewerId);
  if (!updated) return null;

  await sendEmail({
    to: updated.email,
    subject: approved ? "盘根全球站申请已通过" : "盘根全球站申请未通过",
    body: approved
      ? `你好，${updated.name}。你的全球站准入申请已通过，可以继续使用已审核邮箱或 GitHub OAuth 登录。`
      : `你好，${updated.name}。你的全球站准入申请本次未通过，请补充更具体的使用场景后重新提交。`,
    template: "application_result",
  });

  return updated;
}

export async function loginIdentity(input: LoginRequest): Promise<Result<IdentitySession>> {
  const validation = validateLoginInput(input);
  if (validation) return err("VALIDATION_ERROR", validation, 400);

  const site = toConcreteSite(input.site);
  const identifier = input.account.trim().toLowerCase();
  const credentialResult = await findAccountByCredentialIdentifier(identifier);
  let account = credentialResult?.account ?? null;
  let user = account ? await findSiteProfileByAccount(account.id, site) : null;

  if (credentialResult && !verifyPassword(input.password, credentialResult.credential.secretHash)) {
    return err("INVALID_CREDENTIALS", "用户名、邮箱或密码不正确", 401);
  }

  if (!credentialResult) {
    user = await findUserByAccount(site, identifier);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      return err("INVALID_CREDENTIALS", "用户名、邮箱或密码不正确", 401);
    }
    account = user.accountId ? await findAccountById(user.accountId) : null;
  }

  if (!user && account) {
    const admissionError = await validateSiteProfileAdmission(site, account.email ?? identifier);
    if (admissionError) return admissionError;
    user = await ensureSiteProfile({ account, site, preferredUsername: account.handle });
  }

  if (!user) return err("INVALID_CREDENTIALS", "用户名、邮箱或密码不正确", 401);
  if (user.disabledAt || account?.disabledAt) return err("ACCOUNT_DISABLED", "账号已停用，请联系管理员", 403);

  return ok(toSession(user, account));
}

export async function readIdentityMe(actor: AuthTokenPayload): Promise<Result<IdentityMeResponse>> {
  const userId = Number(actor.sub);
  if (!Number.isInteger(userId)) return err("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const user = await findUserById(userId);
  if (!user) return err("USER_NOT_FOUND", "用户不存在", 404);
  const accountId = Number(actor.accountId ?? user.accountId);
  const account = Number.isInteger(accountId) ? await findAccountById(accountId) : null;
  const profiles = account ? await readAccountProfiles(account.id) : { campusProfile: null, compassProfile: null };

  return ok({
    user: toIdentityUserWithAccount(user, account),
    account: account ? toAccountRecord(account) : fallbackAccountRecord(user),
    ...profiles,
  });
}

export async function updateCompassProfile(
  actor: AuthTokenPayload,
  input: UpdateCompassProfileRequest,
): Promise<Result<UpdateCompassProfileResponse>> {
  if (actor.site !== "com") return err("SITE_FORBIDDEN", "全球站资料只能在 com 站点更新", 403);

  const allowedKeys = new Set(["displayName"]);
  const keys = Object.keys(input as Record<string, unknown>);
  const unknownKey = keys.find((key) => !allowedKeys.has(key));
  if (unknownKey) return err("VALIDATION_ERROR", `不支持更新字段：${unknownKey}`, 400);
  if (keys.length === 0) return err("VALIDATION_ERROR", "请提供需要更新的资料字段", 400);

  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (!displayName) return err("VALIDATION_ERROR", "昵称不能为空", 400);
    if (displayName.length > 50) return err("VALIDATION_ERROR", "昵称不能超过 50 个字符", 400);
  }

  const userId = Number(actor.sub);
  const accountId = Number(actor.accountId);
  if (!Number.isInteger(userId) || !Number.isInteger(accountId)) {
    return err("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);
  }

  const compassProfile = await updateCompassProfileInDb({
    userId,
    accountId,
    displayName: input.displayName,
  });
  if (!compassProfile) return err("PROFILE_NOT_FOUND", "全球站资料不存在", 404);

  return ok({ compassProfile });
}

export async function verifyIdentityEmail(input: EmailVerificationRequest) {
  if (!input.token?.trim()) return err("VALIDATION_ERROR", "请提供邮箱验证 token", 400);

  const result = await verifyEmailToken(input.token.trim());
  if (!result) return err("TOKEN_NOT_FOUND", "邮箱验证链接无效", 404);
  if (result.expired) return err("TOKEN_EXPIRED", "邮箱验证链接已过期", 410);

  return ok({ user: toIdentityUser(result.user) });
}

export async function requestPasswordReset(input: PasswordResetRequest): Promise<Result<PasswordResetRequestResponse>> {
  if (!input.email?.trim()) return err("VALIDATION_ERROR", "请填写邮箱", 400);
  if (input.site !== "cn" && input.site !== "com") return err("VALIDATION_ERROR", "请提供具体站点", 400);

  const user = await findUserByAccount(input.site, input.email.trim().toLowerCase());
  if (!user) return ok({ message: "如果邮箱存在，重置链接会发送到该邮箱" });

  const resetToken = randomToken();
  // TODO(上线前): 将 resetToken 改为 selector:verifier 模式，selector 明文索引，verifier 用 bcrypt hash 存储
  // 当前 plaintext 存储仅适用于原型阶段
  await setPasswordResetToken(user.id, resetToken, afterHours(2));

  // resetToken 仅通过邮件等带外渠道投递，不返回 response body
  return ok({
    message: "如果邮箱存在，重置链接会发送到该邮箱",
  });
}

export async function confirmPasswordReset(
  input: PasswordResetConfirmRequest,
): Promise<Result<PasswordResetConfirmResponse>> {
  if (!input.token?.trim()) return err("VALIDATION_ERROR", "请提供密码重置 token", 400);
  if (!input.password || input.password.length < 6) return err("VALIDATION_ERROR", "密码至少需要 6 位", 400);

  const result = await resetPasswordByToken(input.token.trim(), hashPassword(input.password));
  if (!result) return err("TOKEN_NOT_FOUND", "密码重置链接无效", 404);
  if (result.expired) return err("TOKEN_EXPIRED", "密码重置链接已过期", 410);

  return ok({ message: "密码已重置，请重新登录" });
}

function toSession(user: Parameters<typeof toIdentityUser>[0], account?: Awaited<ReturnType<typeof findAccountById>>): IdentitySession {
  const identity = toIdentityUserWithAccount(user, account ?? null);

  return {
    token: signToken({
      sub: identity.id,
      accountId: identity.accountId,
      name: identity.name,
      username: identity.username,
      email: identity.email,
      site: identity.site,
      siteContext: identity.site,
      globalLevel: identity.globalLevel,
      role: identity.role,
    }),
    user: identity,
  };
}

function validateRegisterInput(input: RegisterRequest) {
  if (input.site !== "cn" && input.site !== "com") return "注册必须选择具体站点";
  if (!input.username?.trim()) return "请填写用户名";
  const email = normalizeEmail(input.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  if (!input.password || input.password.length < 6) return "密码至少需要 6 位";
  return null;
}

function validateApplicationInput(input: ApplicationRequestInput) {
  if (input.site !== "cn" && input.site !== "com") return "申请必须选择具体站点";
  if (!input.name?.trim()) return "请填写姓名或昵称";
  const email = input.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "请填写有效邮箱";
  if (!input.useCase?.trim() || input.useCase.trim().length < 10) return "请至少用 10 个字说明使用场景";
  return null;
}

function validateLoginInput(input: LoginRequest) {
  if (input.site !== "cn" && input.site !== "com") return "登录必须选择具体站点";
  if (!input.account?.trim()) return "请填写用户名或邮箱";
  if (!input.password) return "请填写密码";
  return null;
}

function toConcreteSite(site: SiteContext): "cn" | "com" {
  return site === "com" ? "com" : "cn";
}

async function buildGitHubIdentitySession(input: {
  githubId: string;
  githubLogin: string;
  name: string;
  email: string;
  avatar?: string;
  bindUserId?: number | null;
}): Promise<Result<IdentitySession>> {
  const site = "com" as const;
  const existingCredential = await findAccountByCredentialIdentifier(input.githubId, "github");
  if (existingCredential) {
    const user = await ensureSiteProfile({ account: existingCredential.account, site, preferredUsername: input.githubLogin });
    if (!user) return err("DATABASE_UNAVAILABLE", "GitHub 登录读取账号失败", 503);
    return ok(toSession(user, existingCredential.account));
  }

  if (input.bindUserId) {
    const user = await findUserById(input.bindUserId);
    if (!user || user.site !== "com") return err("BIND_TARGET_NOT_FOUND", "待绑定的全球站账号不存在", 404);
    const updated = await bindGitHubIdentity({
      userId: user.id,
      githubId: input.githubId,
      nickname: user.nickname || input.name,
      email: user.email || input.email,
      avatar: input.avatar,
    });
    if (!updated) return err("DATABASE_UNAVAILABLE", "GitHub 绑定失败，请稍后重试", 503);
    const account = updated.accountId ? await findAccountById(updated.accountId) : null;
    if (account) {
      await bindGitHubCredential({ accountId: account.id, githubId: input.githubId, githubLogin: input.githubLogin });
    }
    return ok(toSession(updated, account));
  }

  const existingByEmailCredential = await findAccountByCredentialIdentifier(input.email);
  if (existingByEmailCredential) {
    const existingByEmail = await ensureSiteProfile({
      account: existingByEmailCredential.account,
      site,
      preferredUsername: input.githubLogin,
    });
    if (!existingByEmail) return err("DATABASE_UNAVAILABLE", "GitHub 绑定失败，请稍后重试", 503);
    const updated = await bindGitHubIdentity({
      userId: existingByEmail.id,
      githubId: input.githubId,
      nickname: existingByEmail.nickname || input.name,
      email: existingByEmail.email || input.email,
      avatar: input.avatar,
    });
    if (!updated) return err("DATABASE_UNAVAILABLE", "GitHub 绑定失败，请稍后重试", 503);
    await bindGitHubCredential({
      accountId: existingByEmailCredential.account.id,
      githubId: input.githubId,
      githubLogin: input.githubLogin,
    });
    return ok(toSession(updated, existingByEmailCredential.account));
  }

  const approved = await findApprovedApplicationByEmail(site, input.email);
  if (!approved) {
    return err("APPLICATION_REQUIRED", "当前 GitHub 邮箱尚未通过全球站准入审核，请先提交申请", 403);
  }

  const username = await buildUniqueGitHubUsername(input.githubLogin, input.email);
  const account = await createAccount({
    handle: username,
    email: input.email,
    name: input.name,
    globalLevel: "user",
  });
  if (!account) return err("DATABASE_UNAVAILABLE", "GitHub 登录创建账号失败", 503);
  await bindGitHubCredential({ accountId: account.id, githubId: input.githubId, githubLogin: input.githubLogin });

  const user = await createSiteProfile({
    accountId: account.id,
    username,
    nickname: input.name,
    email: input.email,
    site,
    githubId: input.githubId,
    avatar: input.avatar,
    emailVerified: true,
  });
  if (!user) return err("DATABASE_UNAVAILABLE", "GitHub 登录创建账号失败", 503);
  return ok(toSession(user, account));
}

async function buildUniqueGitHubUsername(githubLogin: string, email: string) {
  const raw = (githubLogin || email.split("@")[0] || "github-user").toLowerCase();
  const base = raw.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "github-user";
  let candidate = base;
  let suffix = 1;

  while (await findUserByAccount("com", candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`.slice(0, 32);
  }

  return candidate;
}

function fallbackAccountRecord(user: Parameters<typeof toIdentityUser>[0]) {
  return {
    id: String(user.accountId ?? user.id),
    handle: user.username,
    email: user.email,
    name: user.nickname,
    globalLevel: user.trustLevel,
    disabled: Boolean(user.disabledAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function parseGitHubOAuthState(token: string) {
  const payload = verifyToken(token) as (AuthTokenPayload & { purpose?: string; bindUserId?: string }) | null;
  if (!payload || payload.purpose !== "github_oauth" || payload.site !== "com") return null;
  const bindUserId = payload.bindUserId ? Number(payload.bindUserId) : null;
  return {
    bindUserId: Number.isInteger(bindUserId) ? bindUserId : null,
  };
}

async function exchangeGitHubAccessToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "NorthStar-Identity",
    },
    body: JSON.stringify({
      client_id: getGitHubClientId(),
      client_secret: getGitHubClientSecret(),
      code,
      redirect_uri: getGitHubCallbackUrl(),
    }),
  });

  const payload = (await response.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || "GitHub Access Token 获取失败");
  }

  return payload.access_token;
}

async function readGitHubProfile(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "NorthStar-Identity",
    },
  });
  const payload = (await response.json().catch(() => null)) as {
    id?: number;
    login?: string;
    name?: string | null;
    avatar_url?: string | null;
  } | null;

  if (!response.ok || !payload?.id || !payload.login) {
    throw new Error("GitHub 用户信息读取失败");
  }

  return payload;
}

async function readGitHubVerifiedEmail(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "NorthStar-Identity",
    },
  });
  const payload = (await response.json().catch(() => null)) as Array<{
    email?: string;
    primary?: boolean;
    verified?: boolean;
  }> | null;

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error("GitHub 邮箱信息读取失败");
  }

  const primaryVerified = payload.find((item) => item.primary && item.verified && item.email);
  const verified = payload.find((item) => item.verified && item.email);
  return primaryVerified?.email?.trim().toLowerCase() || verified?.email?.trim().toLowerCase() || null;
}

function isGitHubOAuthConfigured() {
  return Boolean(getGitHubClientId() && getGitHubClientSecret());
}

function getGitHubClientId() {
  return process.env.GITHUB_CLIENT_ID?.trim() || "";
}

function getGitHubClientSecret() {
  return process.env.GITHUB_CLIENT_SECRET?.trim() || "";
}

function getGitHubCallbackUrl() {
  return process.env.GITHUB_CALLBACK_URL?.trim() || "http://localhost:4000/api/identity/oauth/github/callback";
}

function getFrontaiBaseUrl() {
  return process.env.FRONTAI_BASE_URL?.trim() || "http://localhost:3000";
}

function buildGitHubSuccessRedirect(session: IdentitySession) {
  const hash = new URLSearchParams({
    token: session.token,
    id: session.user.id,
    accountId: session.user.accountId,
    profileId: session.user.profileId,
    username: session.user.username,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    site: session.user.site,
    globalLevel: session.user.globalLevel,
    emailVerified: session.user.emailVerified ? "1" : "0",
  });
  return `${getFrontaiBaseUrl()}/login?oauth=success#${hash.toString()}`;
}

function buildGitHubErrorRedirect(message: string) {
  const url = new URL("/login", getFrontaiBaseUrl());
  url.searchParams.set("oauth_error", message);
  return url.toString();
}

function normalizeEmail(email?: string) {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

function randomToken() {
  return randomBytes(24).toString("hex");
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function afterHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function validateSiteProfileAdmission(site: Exclude<SiteContext, "all">, email: string | null | undefined) {
  if (site !== "com") return null;

  const normalizedEmail = normalizeEmail(email ?? undefined);
  if (!normalizedEmail) {
    return err("APPLICATION_REQUIRED", "当前邮箱尚未通过全球站准入审核，请先提交申请或使用邀请码", 403);
  }

  const approved = await findApprovedApplicationByEmail(site, normalizedEmail);
  if (!approved) {
    return err("APPLICATION_REQUIRED", "当前邮箱尚未通过全球站准入审核，请先提交申请或使用邀请码", 403);
  }

  return null;
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 401 | 403 | 404 | 409 | 410 | 503;
  };
}

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function err(
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 410 | 503,
): Result<never> {
  return { ok: false, error: { code, message, status } };
}
