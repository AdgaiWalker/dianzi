import type { AuthTokenPayload } from "../../lib/auth";
import { checkSensitiveWords } from "@dianzi/shared";
import {
  createRawIdea,
  findIdeaById,
  saveStructuredResult,
  queryIdeas,
  createReaction,
  createResponse,
} from "./repository";
import { callGatewayChat, type ChatMessage } from "../ai-gateway/service";
import type { CreateIdeaInput, RefineIdeaResponse } from "./types";

export class IdeaValidationError extends Error {
  status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = "IdeaValidationError";
  }
}

export class IdeaNotFoundError extends Error {
  status = 404 as const;
  constructor(message: string) {
    super(message);
    this.name = "IdeaNotFoundError";
  }
}

export async function publishRawIdea(
  actor: AuthTokenPayload | null,
  input: CreateIdeaInput
) {
  const text = input.rawInput?.trim();
  if (!text || text.length < 5) {
    throw new IdeaValidationError("点子内容太短，多写几个字吧。(最少5字)");
  }

  // Content safety check
  const check = checkSensitiveWords(text);
  if (check.hit) {
    throw new IdeaValidationError(`想法包含不合规词汇: ${check.words.join(", ")}，请修改后提交。`);
  }

  const userId = actor ? Number(actor.sub) : null;
  const idea = await createRawIdea(
    userId,
    text,
    input.sourceType,
    input.visibility || "public",
    input.allowCollaboration !== false
  );

  return resultOk(idea);
}

export async function refineIdeaWithAI(
  site: "cn" | "com",
  actor: AuthTokenPayload | null,
  guestKey: string,
  ideaId: number
) {
  const idea = await findIdeaById(ideaId);
  if (!idea) {
    throw new IdeaNotFoundError("未找到该想法或点子");
  }

  const systemPrompt = `你是「点子 DIANZI」平台的 AI 结构化整理引擎。
你的任务是将用户模糊、零碎的想法整理成清晰、可讨论、可验证的点子规划。
要求：
- 保持真实、具体，不夸大，不营销化。
- 不要承诺结果，不替用户下绝对可行的结论。
- 必须严格只返回一个 JSON 对象，结构如下：
{
  "title": "点子标题（不超过20字）",
  "summary": "一句话简介（不超过50字）",
  "sourceScene": "来源场景分析",
  "problem": "用户想解决的痛点/问题",
  "targetUsers": "可能需要它的人/目标群体",
  "solutions": ["可能实现方向1", "可能实现方向2"],
  "validationSteps": ["下一步验证建议1", "下一步验证建议2"],
  "risks": ["潜在风险1", "潜在风险2"],
  "tags": ["标签1", "标签2", "标签3"]
}`;

  const fallback: RefineIdeaResponse = {
    title: idea.rawInput.slice(0, 15) + (idea.rawInput.length > 15 ? "..." : ""),
    summary: idea.rawInput.slice(0, 45) + (idea.rawInput.length > 45 ? "..." : ""),
    sourceScene: idea.sourceType === "life_observation" ? "生活中的微小观察与启发" : "日常工作中发现的效率痛点",
    problem: "目前想法较为模糊，需要进行结构化和明确定义。",
    targetUsers: "对该领域有共同兴趣的同行者。",
    solutions: ["通过微信群或低代码工具快速搭建原型", "小范围调研目标用户"],
    validationSteps: ["发布到点子广场收集同频者反馈", "向潜在需求者发起 1v1 访谈"],
    risks: ["想法过于早期，商业路径不明确", "执行成本和时间精力有限"],
    tags: ["早期想法", "行动派"],
  };

  const messages: ChatMessage[] = [
    { role: "user", content: `点子原始内容: "${idea.rawInput}"\n来源类别: "${idea.sourceType}"` }
  ];

  // Request AI Gateway
  const result = await callGatewayChat({
    site,
    actor,
    guestKey,
    route: "ideas/refine",
    body: {
      messages,
      temperature: 0.2,
      max_tokens: 1000,
    },
    fallback: {
      choices: [{ message: { content: JSON.stringify(fallback) } }],
    },
    quotaCost: 1,
  });

  const outputText = result.response.choices?.[0]?.message?.content?.trim() || "";
  let refined: RefineIdeaResponse;
  try {
    const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
    refined = JSON.parse(cleaned) as RefineIdeaResponse;
  } catch {
    refined = fallback;
  }

  // Save the structure in DB
  const structure = await saveStructuredResult(ideaId, {
    title: refined.title,
    summary: refined.summary,
    tags: refined.tags,
    aiStructure: {
      problem: refined.problem,
      targetUsers: refined.targetUsers,
      possibleSolutions: refined.solutions,
      validationSteps: refined.validationSteps,
      risks: refined.risks,
    },
  });

  return resultOk({
    ideaId,
    title: refined.title,
    summary: refined.summary,
    tags: refined.tags,
    aiStructure: {
      problem: refined.problem,
      targetUsers: refined.targetUsers,
      possibleSolutions: refined.solutions,
      validationSteps: refined.validationSteps,
      risks: refined.risks,
    },
  });
}

export async function getIdeaDetail(id: number) {
  const idea = await findIdeaById(id);
  if (!idea) {
    throw new IdeaNotFoundError("未找到该想法或点子");
  }
  return resultOk(idea);
}

export async function listPublicIdeas(sort?: string, tag?: string) {
  const list = await queryIdeas(sort, tag);
  return resultOk({ items: list });
}

export async function reactionInteract(ideaId: number, actor: AuthTokenPayload, type: string) {
  const userId = Number(actor.sub);
  if (!userId) {
    throw new IdeaValidationError("登录状态已失效");
  }

  const idea = await findIdeaById(ideaId);
  if (!idea) {
    throw new IdeaNotFoundError("想法不存在");
  }

  const reaction = await createReaction(ideaId, userId, type);
  return resultOk(reaction);
}

export async function responseInteract(
  ideaId: number,
  actor: AuthTokenPayload,
  type: string,
  content: string,
  linkedIdeaId?: number
) {
  const userId = Number(actor.sub);
  if (!userId) {
    throw new IdeaValidationError("登录状态已失效");
  }

  if (!content?.trim()) {
    throw new IdeaValidationError("回应内容不能为空");
  }

  const idea = await findIdeaById(ideaId);
  if (!idea) {
    throw new IdeaNotFoundError("想法不存在");
  }

  const response = await createResponse(ideaId, userId, type, content.trim(), linkedIdeaId);
  return resultOk(response);
}

// Result format helpers
interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 401 | 403 | 404 | 503;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}
