import { afterEach, describe, expect, it, vi } from "vitest";

describe("requestApi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("uses VITE_API_BASE_URL when configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { id: "1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { requestApi } = await import("./api");

    await requestApi("/api/identity/me", "com", "token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/identity/me",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
