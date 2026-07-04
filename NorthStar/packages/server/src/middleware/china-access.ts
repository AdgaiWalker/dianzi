import type { MiddlewareHandler } from "hono";

const LOCAL_MEDIA_PLACEHOLDER = "/media-placeholder.svg";

export const chinaAccessMediaMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  const contentType = c.res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return;

  const payload = (await c.res.clone().json().catch(() => null)) as unknown;
  if (payload === null) return;

  const headers = new Headers(c.res.headers);
  headers.delete("content-length");

  c.res = new Response(JSON.stringify(sanitizeBlockedMedia(payload)), {
    status: c.res.status,
    statusText: c.res.statusText,
    headers,
  });
};

function sanitizeBlockedMedia(value: unknown): unknown {
  if (typeof value === "string") {
    return isBlockedPlaceholderImage(value) ? LOCAL_MEDIA_PLACEHOLDER : value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeBlockedMedia);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeBlockedMedia(entry)]),
    );
  }

  return value;
}

function isBlockedPlaceholderImage(value: string) {
  return value.includes("picsum.photos") || value.includes("fastly.picsum.photos");
}
