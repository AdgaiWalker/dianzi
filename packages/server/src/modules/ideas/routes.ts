import { Hono } from "hono";
import type { Context } from "hono";
import { fail, ok, readJson, sendResult } from "../../lib/http";
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  publishRawIdea,
  refineIdeaWithAI,
  getIdeaDetail,
  listPublicIdeas,
  reactionInteract,
  responseInteract,
  IdeaValidationError,
  IdeaNotFoundError,
} from "./service";
import type { CreateIdeaInput, SaveStructuredIdeaInput } from "./types";

export const ideasRoute = new Hono();

// Helper to extract or fallback guestKey (for AI rate-limiting)
function getGuestKey(c: Context): string {
  return c.req.header("x-guest-key") || c.req.header("user-agent") || "anonymous-guest";
}

// Helper to handle known service errors
function handleKnownError(c: Context, error: unknown) {
  if (error instanceof IdeaValidationError) {
    return fail(c, error.status, "VALIDATION_ERROR", error.message);
  }
  if (error instanceof IdeaNotFoundError) {
    return fail(c, error.status, "NOT_FOUND", error.message);
  }
  return fail(c, 500, "INTERNAL_ERROR", "服务器内部错误，请稍后重试");
}

// 1. Submit raw idea (Guest or authenticated)
ideasRoute.post("/api/ideas", async (c) => {
  try {
    const actor = resolveAuthUser(c);
    const body = await readJson<CreateIdeaInput>(c);
    const result = await publishRawIdea(actor, body);
    return sendResult(c, result, 201);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

// 2. Refine idea using GLM-4 AI (Guest or authenticated)
ideasRoute.post("/api/ideas/:id/structure", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return fail(c, 400, "VALIDATION_ERROR", "点子 ID 不正确");
  }

  try {
    const site = requireSiteContext(c) === "com" ? "com" : "cn";
    const actor = resolveAuthUser(c);
    const guestKey = getGuestKey(c);

    const result = await refineIdeaWithAI(site, actor, guestKey, id);
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

// 3. Get idea detail
ideasRoute.get("/api/ideas/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return fail(c, 400, "VALIDATION_ERROR", "点子 ID 不正确");
  }

  try {
    const result = await getIdeaDetail(id);
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

// 4. List public ideas on plaza (Supports filtering & sorting)
ideasRoute.get("/api/ideas", async (c) => {
  try {
    const sort = c.req.query("sort") || "latest"; // 'latest' | 'gravity'
    const tag = c.req.query("tag");
    const result = await listPublicIdeas(sort, tag);
    return sendResult(c, result);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

// 5. Submit reaction interaction (Requires authentication)
ideasRoute.post("/api/ideas/:id/reactions", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return fail(c, 400, "VALIDATION_ERROR", "点子 ID 不正确");
  }

  try {
    const actor = requireAuthUser(c);
    const body = await readJson<{ reaction_type: string }>(c);
    const result = await reactionInteract(id, actor, body.reaction_type);
    return sendResult(c, result, 201);
  } catch (error) {
    return handleKnownError(c, error);
  }
});

// 6. Submit growth response comment (Requires authentication)
ideasRoute.post("/api/ideas/:id/responses", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return fail(c, 400, "VALIDATION_ERROR", "点子 ID 不正确");
  }

  try {
    const actor = requireAuthUser(c);
    const body = await readJson<{ response_type: string; content: string; linked_idea_id?: number }>(c);
    const result = await responseInteract(
      id,
      actor,
      body.response_type,
      body.content,
      body.linked_idea_id
    );
    return sendResult(c, result, 201);
  } catch (error) {
    return handleKnownError(c, error);
  }
});
