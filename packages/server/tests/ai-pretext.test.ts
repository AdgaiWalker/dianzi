import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAiPretextMessages } from "../src/modules/ai-gateway/pretext";
import { callGatewayChat } from "../src/modules/ai-gateway/service";

describe("AI pretext", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
  });

  it("builds site-specific global pretext messages", () => {
    const cnMessages = buildAiPretextMessages({
      site: "cn",
      route: "ai-gateway.chat",
      goal: "校园打印",
      scenario: "campus_search",
      messages: [{ role: "user", content: "打印店在哪" }],
    });
    const comMessages = buildAiPretextMessages({
      site: "com",
      route: "ai-gateway.chat",
      goal: "论文写作",
      scenario: "compass_solution",
      messages: [{ role: "user", content: "写论文" }],
    });

    expect(cnMessages[0]).toMatchObject({ role: "system" });
    expect(cnMessages[0].content).toContain("盘根校园");
    expect(cnMessages[0].content).toContain("cn 用户数据绝不流向海外");
    expect(cnMessages[0].content).toContain("campus_search");

    expect(comMessages[0]).toMatchObject({ role: "system" });
    expect(comMessages[0].content).toContain("盘根 AI 指南针");
    expect(comMessages[0].content).toContain("禁止收集中国敏感个人信息");
    expect(comMessages[0].content).toContain("compass_solution");
  });

  it("injects global pretext before caller messages when sending model requests", async () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://ai.example.test";

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "可执行方案" } }],
          usage: { prompt_tokens: 11, completion_tokens: 3, total_tokens: 14 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await callGatewayChat({
      site: "com",
      actor: null,
      guestKey: "pretext-test",
      route: "ai-gateway.chat",
      body: {
        goal: "论文写作",
        scenario: "compass_solution",
        messages: [
          { role: "system", content: "调用方局部提示" },
          { role: "user", content: "帮我组合工具" },
        ],
      },
      fallback: { choices: [{ message: { content: "fallback" } }] },
      quotaCost: 0,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: Array<{ role: string; content: string }>;
    };

    expect(requestBody.messages[0]).toMatchObject({ role: "system" });
    expect(requestBody.messages[0].content).toContain("AI Pretext");
    expect(requestBody.messages[0].content).toContain("盘根 AI 指南针");
    expect(requestBody.messages[1]).toEqual({ role: "system", content: "调用方局部提示" });
    expect(requestBody.messages[2]).toEqual({ role: "user", content: "帮我组合工具" });
    expect(requestBody).not.toHaveProperty("goal");
    expect(requestBody).not.toHaveProperty("scenario");
  });
});
