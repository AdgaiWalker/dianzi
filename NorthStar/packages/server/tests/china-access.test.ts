import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { chinaAccessMediaMiddleware } from "../src/middleware/china-access";

describe("china access media middleware", () => {
  it("replaces blocked placeholder image URLs in JSON responses without changing normal links", async () => {
    const app = new Hono();
    app.use("/api/*", chinaAccessMediaMiddleware);
    app.get("/api/sample", (c) =>
      c.json({
        ok: true,
        data: {
          imageUrl: "https://picsum.photos/400/300?random=42",
          nested: {
            coverUrl: "https://fastly.picsum.photos/id/1/400/300.jpg",
          },
          officialUrl: "https://cursor.sh",
        },
      }),
    );

    const response = await app.request("/api/sample");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.imageUrl).toBe("/media-placeholder.svg");
    expect(body.data.nested.coverUrl).toBe("/media-placeholder.svg");
    expect(body.data.officialUrl).toBe("https://cursor.sh");
  });
});
