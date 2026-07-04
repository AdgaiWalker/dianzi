import type { IncomingMessage, ServerResponse } from "node:http";

const { app } = require("../src/app");

function getRequestUrl(req: IncomingMessage) {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const firstHost = Array.isArray(host) ? host[0] : host;
  const firstProtocol = Array.isArray(protocol) ? protocol[0] : protocol;
  return new URL(req.url ?? "/", `${firstProtocol}://${firstHost}`);
}

function getRequestHeaders(req: IncomingMessage) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  return headers;
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method ?? "GET";
  const request = new Request(getRequestUrl(req), {
    method,
    headers: getRequestHeaders(req),
    body: method === "GET" || method === "HEAD" ? undefined : req,
    duplex: "half",
  } as unknown as RequestInit & { duplex: "half" });

  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  if (!response.body) {
    res.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

module.exports = handler;
module.exports.config = {
  maxDuration: 30,
};
