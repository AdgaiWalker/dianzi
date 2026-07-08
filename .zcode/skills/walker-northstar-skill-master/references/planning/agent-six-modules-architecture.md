# Agent 六模块架构边界

> 日期：2026-06-08  
> 范围：iwalk.pro 当前 Agent 能力的责任边界。  
> 规则：先固定边界，再逐步迁移代码；不为了抽象而大拆现有可用流程。

## 1. Perception：感知与输入

职责：

- 接收用户输入。
- 校验请求大小、消息轮数、单条长度、来源页面。
- 压缩文本。
- 脱敏 PII。
- 识别未成年人场景。
- 标记敏感或合规风险。

当前承载：

- `src/pages/api/match.ts`
- `src/agent/privacy.ts`
- `src/agent/sensitive.ts`

禁止事项：

- 不做工具推荐。
- 不写入持久化存储。
- 不调用 LLM。
- 不决定哪些数据公开。

验收证据：

- 超长请求在进入推荐逻辑前被拒绝。
- PII 在保存和规划前已替换。
- 未成年人场景有 `isMinorContext` 标记。

## 2. Memory：记忆系统

职责：

- 管理 session。
- 保存脱敏后的对话消息。
- 保存匿名需求事件。
- 保存反馈事件。
- 保存选题候选。
- 保存公开聚合计数。

当前承载：

- `src/conversation/store.ts`

禁止事项：

- 公开读取函数不返回原始对话。
- 不保存原始 IP。
- 不保存未脱敏联系方式、API Key、token。

验收证据：

- `/api/stats` 只读聚合计数。
- `/admin/insights` 和 `/api/admin/conversations` 需要管理员或系统 secret。
- Redis 不可用时降级，不影响基础回复。

## 3. Planning：LLM 引擎与规划

职责：

- 判断响应模式。
- 判断需求类别。
- 判断卡点层级。
- 判断能力方向。
- 选择站内资源。
- 生成下一步行动计划。
- 必要时通过 Gateway 调用模型增强模糊判断。

当前承载：

- `src/agent/match.ts`
- `src/agent/pretext.ts`
- `src/agent/gateway.ts`
- `src/profiles/resource-index.ts`
- `src/profiles/tool-profiles.ts`

禁止事项：

- 不覆盖本地合规规则。
- 不编造站内不存在的资源。
- 不直接写 session、event、feedback。

验收证据：

- `matchSiteResources()` 可独立返回结构化结果。
- 合规入口只做合规转向。
- 资源推荐来自 `resource-index.ts`。

## 4. Tools & Execution：工具体系与执行

职责：

- 统一封装可执行能力。
- 调用 GitHub 内容写回。
- 调用 MCP 内容查询。
- 调用 AI Gateway。
- 读取统计或洞察。

当前承载：

- `src/mcp/index.ts`
- `src/pages/api/admin/content/[slug].ts`
- `src/agent/gateway.ts`
- `src/pages/api/admin/gateway.ts`

权限表：

| 工具 | 权限 |
|---|---|
| `/api/admin/content/[slug]` | admin |
| `/api/admin/gateway` | admin |
| `walker_query/search/get/stats` | public-only |
| `walker_insights` | system environment |
| `callGateway()` | server-only |

禁止事项：

- 访客不能触发内容写入。
- 默认 MCP 不能读取 draft/private。
- 前端不能拿到 provider key 或 GitHub token。

验收证据：

- 未登录写内容返回 401。
- MCP 默认只返回 public 内容。
- Gateway 失败时有 fallback。

## 5. Orchestration：编排与生命周期

职责：

- 串起一次请求的生命周期。
- 决定失败是否降级。
- 决定哪些结果返回给用户。
- 决定哪些结果进入 Memory。
- 维护 session 创建、更新、结束。

当前承载：

- `src/pages/api/match.ts`
- `src/pages/api/match-end.ts`
- `src/pages/api/match-feedback.ts`
- `src/pages/api/match-process.ts`

目标生命周期：

```text
receive
  -> perceive
  -> plan
  -> execute
  -> persist
  -> respond
  -> observe
```

禁止事项：

- 不在 API 路由里继续无限堆业务规则。
- 不让存储失败阻塞基础回复。
- 不让模型失败覆盖本地规则。

验收证据：

- `/api/match` 在模型失败时仍有本地推荐。
- 保存 demand event 失败不影响用户响应。
- session 结束有独立 API。

## 6. Observability：监控与可观测性

职责：

- 公开聚合统计。
- 后台需求洞察。
- Gateway 调用日志。
- 反馈统计。
- 内容缺口和选题候选。

当前承载：

- `src/pages/api/stats.ts`
- `src/pages/admin/insights.astro`
- `src/pages/api/insights.ts`
- `src/agent/gateway.ts`
- `src/agent/gateway-config.ts`

公开指标：

- `matchCount`
- `contentCount`
- `topCategories`

后台指标：

- 需求趋势。
- 卡点层级。
- 能力方向。
- 反馈分布。
- 内容缺口。
- Gateway 成功率和延迟。

禁止事项：

- 不公开 sessionId。
- 不公开 messages。
- 不公开 rawNeedRedacted。
- 不公开 gateway logs。
- 不记录 API key、完整 prompt、未脱敏输入。

验收证据：

- `/api/stats` 不包含后台字段。
- `/admin/insights` 未登录跳登录。
- Gateway logs 不包含密钥。

## 7. 后续迁移顺序

> **2026-06-15 完成**：四步全部落地，分支 `refactor/agent-six-modules`（commit `836b6ab` / `9927f49` / `be1b6bd`）。
>
> - 步骤 1（Perception）→ 新增 `src/services/perception.service.ts` + `PerceptionServicePort` + 6 测试。
> - 步骤 2（Memory）→ orchestrator 不再 import `conversation/store`，会话/消息/统计收口到 `MatchSessionRepositoryPort`。
> - 步骤 3（Planning 核心）→ `matchSiteResources()` 保持不变，并封装为 `planRecommendation`。
> - 步骤 4（Orchestration）→ `handleNeed` 从 ~180 行收缩为 ~50 行编排主线 + 5 个命名步骤函数。
>
> 验收：53 测试通过、`astro check` 0 errors、`build` Complete。对外 `handleNeed` 签名零变化。

1. 先将 `/api/match.ts` 中的输入校验和脱敏抽为 Perception。
2. 再将 session/event/feedback 写入调用收敛到 Memory API。
3. 保持 `matchSiteResources()` 作为 Planning 核心。
4. 最后抽 Orchestration，避免一次性大重构。
