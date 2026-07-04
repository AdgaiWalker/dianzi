import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { signToken } from "../src/lib/auth";

function userAuthorization(userId = "1", site = "cn") {
  return `Bearer ${signToken({ sub: userId, name: "Test User", site, role: "user" })}`;
}

describe("Ideas API Endpoints", () => {
  it("should allow guests or users to submit a raw idea", async () => {
    const res = await app.request("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: "我想做一个帮公司整理旧发票的 AI 助理",
        sourceType: "work_efficiency",
        visibility: "public",
        allowCollaboration: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.rawInput).toBe("我想做一个帮公司整理旧发票的 AI 助理");
  });

  it("should block raw ideas containing sensitive terms", async () => {
    const res = await app.request("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: "我想做一个买卖枪支交易网", // '买卖枪支' is sensitive
        sourceType: "life_observation",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should fail validation if the input is too short", async () => {
    const res = await app.request("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: "想法",
        sourceType: "random_spark",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("should allow a guest or user to trigger AI refinement and fetch details", async () => {
    // 1. Submit raw
    const submitRes = await app.request("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: "我想做一个可以在寝室顺便代拿快递并收取低代金券的工具",
        sourceType: "life_observation",
      }),
    });
    const submitBody = await submitRes.json();
    const ideaId = submitBody.data.id;

    // 2. Trigger structure refinement
    const refineRes = await app.request(`/api/ideas/${ideaId}/structure`, {
      method: "POST",
      headers: { "x-guest-key": "test-key" },
    });
    expect(refineRes.status).toBe(200);
    const refineBody = await refineRes.json();
    expect(refineBody.ok).toBe(true);
    expect(refineBody.data.title).toBeDefined();
    expect(refineBody.data.aiStructure.problem).toBeDefined();

    // 3. Get Details
    const detailRes = await app.request(`/api/ideas/${ideaId}`);
    expect(detailRes.status).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.ok).toBe(true);
    expect(detailBody.data.title).toBe(refineBody.data.title);
    expect(detailBody.data.structure).toBeDefined();
  });

  it("should allow authenticated users to post reactions and replies", async () => {
    // 1. Submit raw & Refine
    const submitRes = await app.request("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: "在校门外摆摊卖多肉植物的想法和推广方式",
        sourceType: "random_spark",
      }),
    });
    const submitBody = await submitRes.json();
    const ideaId = submitBody.data.id;

    await app.request(`/api/ideas/${ideaId}/structure`, { method: "POST" });

    const authHeader = userAuthorization();

    // 2. Post Reaction (need)
    const reactionRes = await app.request(`/api/ideas/${ideaId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({ reaction_type: "need" }),
    });
    expect(reactionRes.status).toBe(201);
    const reactionBody = await reactionRes.json();
    expect(reactionBody.ok).toBe(true);

    // 3. Post Response (solution)
    const responseRes = await app.request(`/api/ideas/${ideaId}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        response_type: "solution",
        content: "我认为这个点子可以通过在校园贴吧先进行赠送引流测试。",
      }),
    });
    expect(responseRes.status).toBe(201);
    const responseBody = await responseRes.json();
    expect(responseBody.ok).toBe(true);
  });
});
