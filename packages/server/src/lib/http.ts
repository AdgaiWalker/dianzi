import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiEnvelope } from "@dianzi/shared";

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  const payload: ApiEnvelope<T> = { ok: true, data };
  return c.json(payload, status);
}

export function fail(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  const payload: ApiEnvelope<never> = {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return c.json(
    payload,
    status,
  );
}

export async function readJson<T>(c: Context): Promise<T> {
  try {
    return await c.req.json<T>();
  } catch {
    throw new HttpBadRequest('请求体 JSON 格式不正确');
  }
}

export class HttpBadRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpBadRequest';
  }
}

interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; status: number };
}

export function sendResult<T>(
  c: Context,
  result: ServiceResult<T>,
  successStatus: ContentfulStatusCode = 200,
) {
  if (!result.ok || result.error) {
    return fail(c, (result.error?.status ?? 400) as ContentfulStatusCode, result.error?.code ?? "REQUEST_FAILED", result.error?.message ?? "请求失败");
  }

  return ok(c, result.data as T, successStatus);
}
