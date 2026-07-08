# Execution Log Current

本文档记录当前周期内 `walker-northstar` 和 AdgaiWalker 开发过程中的关键执行、阻滞和规则沉淀。
它不是完整历史，不替代 Git log，也不记录普通流水账。

## 记录格式

```text
日期：
阶段：P0 / P1 / P2 / P3 / P4
动作：
结果：
阻滞：
沉淀：
后续：
```

## 2026-06-10

阶段：P4

动作：

- Ferry 新增双 Git 开发范式，并发布 `v1.1.0 安全边界`。
- `walker-northstar` 明确将 Skill 仓库作为 `blueprint + .ferry`，将 AdgaiWalker 产品仓库作为 `reality`。
- 准备补充 Ferry 开发协议、Human Gate 和当前执行日志。

结果：

- Ferry 已形成公开理论表达。
- `walker-northstar` 需要接入该协议，成为实际开发调度层。

阻滞：

- `.agents/` 在 AdgaiWalker 主仓库中被忽略，本地 skill 必须依赖独立远程仓库管理版本。
- Skill 文档和产品代码分属不同 Git 边界，后续操作需要明确仓库归属。

沉淀：

```text
代码仓库保护现实实现，Skill 仓库保护思想规则。
AI 可以执行，但必须在正确仓库、正确阶段和正确权限内执行。
```

后续：

- 将 Ferry 开发协议、Human Gate、执行日志接入 `walker-northstar`。
- 后续再补最小脚本：工作区检查、文档路由检查、归档工具。
## 2026-06-11 Workspace Cleanup

- Archived completed user-demand-loop goal to `docs/archive/references/user-demand-loop-goal-2026-06-10-completed.md`.
- Archived TDD and visual reports to `docs/archive/reports/`.
- Removed build and cache outputs: `dist/`, `.vercel/output/`, `.astro/*.log`, `.astro/*.tmp`, generated visual screenshot and report workspace folder.
- Two root dev-server log files were still held by a running process and could not be deleted during cleanup: `.codex-dev-server.err.log`, `.codex-dev-server.log`.
- Added then-current PRD backlog: `references/prd-backlog-current-state.md`；该入口后来已归档，不再作为当前依据。
- Added next-round PRD: `references/invite-identity-profile-context-prd.md`.

## 2026-06-14 Skill / Zone Consistency Audit

阶段：P1

动作：

- 审理 `SKILL.md`、`agents/openai.yaml`、`examples/` 与 `references/` 四区的一致性。
- 修正 `interaction-protocol.md` 中指向旧根路径的 protocol / log 入口。
- 修正 `ferry-development-protocol.md` 中对 `*-current-state.md`、`*-todo.md` 的旧读取假设。
- 修正 `docs/README.md` 和归档文件中指向已删除旧执行材料的说明。

结果：

- 当前调度口径收敛为 skill 本体区 + 规划区 / 工作区 / 反思区 / 归档区。
- 当前执行权继续只落在 `references/working/prd.md`、`references/working/plan.md`、`references/working/to-do list.md`。

阻滞：

- 无。

沉淀：

```text
agents/openai.yaml 和 examples/ 属于 skill 本体区，不属于当前工作区或规划区。
不存在模块 current-state 文件时，不要假设 `*-current-state.md`。
```

后续：

- 等待 Walker 决定是否进入 Phase 1 reality 实现。

## 2026-06-14 current-cycle-state Write 覆盖删过头

阶段：P1

动作：

- 设计 walker-northstar 开场引导（三级优先级 + 呈现铁律），写入 `interaction-protocol.md`。
- 为配合开场引导，用 Write 整体覆盖 `current-cycle-state.md`，从 92 行瘦到 ~20 行。
- 删除了轮次名称、当前阶段、核心文档、成熟度、已完成清单、未完成、需确认等全部周期状态。

结果：

- 开场引导规则落地，但 `current-cycle-state.md` 的完整周期状态被清空。
- 破坏了 `interaction-protocol.md` 原有"文档成熟度提醒话术"的数据源（该话术需要 Stage / 核心文档 / 成熟度 / 已具备 / 缺口，被一并删掉）。
- 经 Walker 质疑后，用上下文中保留的原文重建：顶部加"开场锚点"，下方完整保留原周期状态。

阻滞：

- 当时乐观假设"删掉的信息都沉到了 cycle-ledger / project-docs-index"，未逐条验证。
- 实际上"当前成熟度"这类快照判断，cycle-ledger 不记（它只记变更动作），是真丢失点。

沉淀：

```text
改 skill 核心状态 / 协议文件，默认用 Edit 叠加，不用 Write 覆盖。
Write 覆盖是删旧换新；一旦乐观假设"信息在别处"而其实没有，就丢东西。
一个核心文件可能服务多个消费者（开场引导要轻、成熟度话术要全），不要为单一用途清空它。
锚点字段置顶 + 保留原内容，比"瘦身重写"更稳。
```

后续：

- 该事件作为 case 记录；若再出现"用 Write 覆盖核心文件导致丢信息"，晋升为 pattern。

## 2026-06-14 Phase 1-4 Reality 实现（Need Case 主链路）

阶段：P2

动作：

- 定义 NeedCase schema，直接取代 DemandEvent 主业务地位（不写兼容代码、不做双写、不留 shim）。
- 新增 InvitedSession / UserProfile 扩展 / SafetyFlags / Incident / UserContext 数据模型与 RepositoryPort。
- 迁移 conversation/store.ts：DemandEvent → NeedCase，新增 invited session / profile / incident 存储；getDemandStats → getNeedCaseStats。
- 新增服务层：InviteAccessService、UserProfileService、UserContextService、SafetyService、AgentOrchestrator（取代 question.service）、FeedbackService、AdminReviewService。
- 新增 API：/api/invite/verify（公开邀请码入口 + 签名 Cookie）、/api/profile（画像读写）、/api/admin/review（后台复盘）。
- 改造 /api/match（接入 AgentOrchestrator + UserContext）、/api/match-feedback（回写 NeedCase）、/api/match-process、/api/insights、MCP walker_insights。
- 新增 lib/invited-session-auth.ts（HMAC 签名 Cookie，复用 ADMIN_PASSWORD 密钥）。
- 新增 /admin/review 页面（Lucide icon，Need Case 复盘 + 采纳/暂缓/忽略 + 备注）。
- 更新所有 admin 导航加入"需求复盘"入口。
- ToolMatchChat 前端 eventId → needCaseId。
- 删除旧文件：question.service.ts、demand-event.store.ts、invite.service.ts、invite.service.test.ts、/api/admin/invite-verify.ts。
- insight.ts 移除直连 ANTHROPIC_API_KEY 的模型增强路径，保留规则聚类（第一轮 TopicCandidate 自动化移出范围）。

结果：

- npx astro check：0 errors。
- vitest：32 passed（含新增 invite-access、更新 visibility 测试）。
- npm run build + pagefind：Complete。

阻滞：

- 无。

沉淀：

```text
NeedCase 双状态维度：adminReviewStatus（复盘）+ topicProcessedAt（聚类去重），避免聚类与复盘语义混淆。
"不写兼容代码"在全局 breaking change 下意味着一次性改完所有引用（15 文件）。
invited session 复用 ADMIN_PASSWORD 作签名密钥，避免新增环境变量。
强耦合 + 全局 breaking change 任务，主实现者串行比子智能体并行更可靠（避免写冲突）。
```

后续：

- 手动用真实邀请码走完整链路（邀请 → 画像 → 提问 → 反馈 → 后台复盘）。
- 配置 INVITE_CODES 环境变量提供测试邀请码。
- 观察首批 Need Case 质量，决定是否恢复 insight 模型增强聚类。

## 2026-06-14 Phase 1-4 运行时端到端冒烟验证

阶段：P2

动作：

- 启动 dev server（无 Redis、无 Gateway 配置），对 NeedCase 主链路做真实 HTTP 冒烟。
- 验证端点：GET /、GET /admin/review（302 重定向登录）、GET /api/stats、GET /api/profile（401 无 session）、POST /api/invite/verify（伪码 403 拒绝）、POST /api/match（合法 UUID 全链路）、GET /api/admin/review?status=pending（带 admin cookie）。

结果：

- 全链路打通：POST /api/match 返回 needCaseId + responseMode=recommendation + 本地匹配产出的 categories/tools/bridge/reason；fallbackUsed=false（本地匹配到工具，未调模型，无需 Gateway）。
- 落库可观测：同一 NeedCase 完整出现在 GET /api/admin/review?status=pending，含 profileSnapshot=null（公开身份）、agentRecommendation.actionPlan、safetyFlags、adminReviewStatus=pending。
- admin HMAC cookie 鉴权（复用 ADMIN_PASSWORD 密钥）登录 + 复盘读取均通过。
- 验证后关停 server，Redis 未配置 → 测试数据仅在内存，关停即清除，无生产污染。

沉淀：

```text
dev 无 Redis 时的可观测性限制：/api/stats 只在 if(url&&token) 分支读计数，无 Redis 永远 matchCount=0；
/api/match-history 的 !isAdmin 直接返回空。这不是 bug，是既有设计——排查"为什么 0"时先查这两点，别误判为迁移回归。
AgentOrchestrator 全链路在无 Redis + 无 Gateway 的纯本地环境下即可跑通（本地匹配路径），便于冒烟。
```

后续：

- 真实邀请码端到端（需 INVITE_CODES 环境变量）仍待 Walker 手动走一遍。
- 生产环境配 Redis 后，stats / match-history / review 三条读路径才会同时生效。

## 2026-06-14 Phase A 完成（认证 gate + 遭遇画像 + 邀请页）

阶段：P2

动作：

- UserProfile 重构为 personaAnchor（砍 role/goal/stuckPoint/helpPreference/currentQuestion/contact）。
- ProfileSnapshot 语义升级为遭遇切片（roleInContext/goal/stuckPoint/socialContext/personaAnchor/sliceInferred）。
- AgentOrchestrator.inferEncounterSlice：复用 frictionLayer/audienceGroup/needFrame/needSummary 已有信号，不引入复杂推断；失败静默降级 sliceInferred=false。
- 后端 gate（/api/match：public→401，rate limit 之后、userContext.resolve 之前）。
- PII 检测（锚点 redactSensitiveText，命中 400）—— 修复 validateAnchor "先截断到10字再检测" 导致 11 位手机号变 10 位逃过正则的 bug，改为先 PII 检测再截断。
- 删除请求关联脱敏（redactNeedCasesBySession：清空该 session 的 NeedCase rawNeedRedacted/profileSnapshot）。
- InviteGate 邀请页组件（≤10字锚点输入 + 示例 chip + consent + Lucide 图标，无 Emoji）。
- ToolMatchChat gate（GET /api/profile 身份探测 + isPublic gate + sendMessage 收 401 兜底打开 invite-dialog）。
- /api/invite/verify 接 personaAnchor，准入时建 UserProfile。
- /api/profile 字段缩减为 personaAnchor+nickname。

结果：

- astro check 0 errors（134 文件）。
- vitest 32 passed。
- npm run build + pagefind Complete。
- 端到端冒烟：public→401 / 手机号锚点→400 / 正常锚点"大三学生"落库 / 提问生成带 roleInContext+sliceInferred 的遭遇切片 / admin review 可见。

沉淀：

```text
PII 检测顺序：先检测完整文本，再截断。先截断会让长 PII（11位手机号）变短逃过正则。
遭遇切片复用已有信号（frictionLayer/audienceGroup），不引入复杂推断——规则版先行，sliceInferred 标质量。
后端 gate + 前端 isPublic 双保险：前端探测未完成时，后端 401 兜底引导邀请。
A2+A5 紧耦合（UserProfile 字段删 → buildProfileSnapshot 必须同步改 → 顺势做 inferEncounterSlice），合并一次做避免中间类型错。
```

后续：

- Phase B（选题工作台 + 需求聚类 + 灵感入口）待推进。
- Phase C（命中率仪表盘 + 创作简报）待推进。
- PRD §12 建议 Phase A 完成 review 一次再推 B/C。

## 2026-06-14 Phase B 核心 + C2 完成（选题闭环接上遭遇画像）

阶段：P2

动作：

- TopicCandidate 字段补：clusterKey / producedContentSlug / status produced（B1）。
- insight.ts 聚类用遭遇切片：summarizeAudience 优先 profileSnapshot.roleInContext + personaAnchor（B2）；admin/topics 的 audience 自动含场景化角色（B3）。
- 创作简报（C2）：brief.service.generateBrief（规则生成建议角度/结构，不代写正文）+ /admin/brief SSR 简报页 + admin/topics 选题卡"生成简报"链接 → 跳编辑器。

结果：

- astro check 0 errors（136 文件）。
- 选题闭环接上遭遇画像：需求聚类 → 选题簇（含遭遇切片角色分布）→ 创作简报 → 编辑器。

沉淀：

```text
Phase B 现状比预期好：TopicCandidate + 聚类（insight.ts）+ admin/topics 工作台都已存在，核心增量是让聚类用遭遇切片角色（B2），不是从零搭。
简报只给框架不给代写，对齐 PRD §3.5（雷达+辅助器，不替代创作者判断）。
遭遇切片复用已有信号（frictionLayer/audienceGroup）让 B2 改动极小——summarizeAudience 一处。
```

后续：

- B4 站主灵感入口（选题池双源）待做。
- C1 命中率仪表盘（反馈回流）待做。
- 两项是独立增强，可后续轮次推进。

## 2026-06-14 B4 + C1 完成（选题闭环全通，Phase A/B/C 全量完成）

阶段：P2

动作：

- B4 站主灵感入口：`/api/admin/inspiration`（POST，存 TopicCandidate clusterKey=inspiration）+ admin/topics 顶部输入框 + 提交 script。选题池双源（用户需求 + 站主灵感）成立。
- C1 命中率（admin/topics SSR）：`getRecentNeedCases` 按 `topicCandidateId` 关联反馈，卡片显示命中率 chip（resolved/反馈数，绿/橙/红分档）。

结果：

- astro check 0 errors（137 文件）。
- 选题闭环全通：需求聚类（用遭遇切片角色）→ 选题工作台（含命中率 + 灵感双源）→ 创作简报 → 编辑器。

沉淀：

```text
C1 用 SSR 直接算命中率（admin/topics frontmatter getHitRate），不做独立 hit-rate API —— 展示需求在选题工作台内满足，避免过度拆分。
命中率按簇视角（topicCandidateId 关联 NeedCase.feedbackStatus），不做内容视角反向关联（relatedContentIds 是 resource ID 非 slug，关联复杂），簇视角够用。
```

Phase A/B/C 全量完成。创作者操作系统切片闭环：邀请认证 gate → 遭遇画像 → 需求聚类 → 选题工作台 → 创作简报 → 命中率反馈。

## 2026-06-14 auth-encounter-topic 全量收口修正

阶段：P2

动作：

- 启用多智能体审计 Phase A 与 Phase B/C；B/C 审计指出：NeedCase 未回写 `topicCandidateId`、命中率不是按内容、`/admin/review` 没有簇/逐条切换。
- 将 TopicCandidate 从旧选题卡字段收敛为需求簇模型：`density`、`roleDistribution`、`representativeNeed`、`status=observed/accepted/deferred/ignored/produced`、`source`、`producedContentSlug`。
- 修复 `processPendingNeedCases`：同簇合并，保存 TopicCandidate 后按簇回写 NeedCase `topicCandidateId` 与 `topicProcessedAt`。
- 增强遭遇切片：本次问题关键词优先，其次 audienceGroup，最后才回退 personaAnchor；纯锚点回退标 `sliceInferred=false`，NeedCase 顶层同步写入 `sliceInferred`。
- `/admin/review?view=clusters` 新增需求簇视图，并保留 `/admin/review?view=list` 逐条复盘。
- 新增 `/admin/hit-rate` 与 `GET /api/admin/hit-rate`，按已发布内容聚合关联需求簇的 resolved/stuck。
- 新增 `POST /api/admin/brief`；`/admin/brief` 跳 `/admin/content/edit?topicId=...&prefill=brief`；编辑器按简报生成结构参考，不代写正文，并通过 `sourceTopicId` / `producedContentSlug` 回连内容与需求簇。
- `/admin/topics` 改为新需求簇模型与 observed 状态，继续支持站主灵感入口。
- 更新测试：orchestrator 遭遇切片、insight 聚类回写、brief、hit-rate、profile confidence/delete redaction。

结果：

- `npx astro check`：0 errors。
- `npm test`：8 files / 47 tests passed。
- `npm run build`：Complete。
- 浏览器 smoke：`/tools` public gate → invite dialog → 邀请码 + 锚点 → invited profile → invited `/api/match` 200 + needCaseId。
- 后台 smoke：admin 登录后 `/api/match-process` 200 生成 observed TopicCandidate；`/admin/review?view=clusters` 200，存在 view switch 与 cluster card；`/admin/topics` 200；`/admin/hit-rate` 200。

阻滞：

- PowerShell 控制台对中文 JSON 输出显示为 `??`，但浏览器状态、接口状态与页面结构验证通过。

沉淀：

```text
C1 不能只用 topic 卡片命中率代替；PRD 要的是每篇已发布内容 resolved/stuck。
需求聚类若不把 TopicCandidateId 回写 NeedCase，后续命中率、简报、内容关联都会断。
personaAnchor 是冷启动底色，不等于本次遭遇切片推断成功；只有本次问题或显式 audience 信号才能把 sliceInferred 标 true。
后端 gate 优先于 rate limit 更符合邀请制体验：public 稳定 401 进入邀请码流程，通过 gate 后再按 session/IP 限流。
```

后续：

- 产品 commit `ac8b286 Complete auth encounter topic loop` 已推送到 PR #9；PR 描述已更新，并已标记 ready for review。

## 2026-06-14 产品说明与 walkthrough skill 沉淀

阶段：P2 验收 / 文档沉淀

动作：

- 本地启动当前产品：`npm run dev -- --host 127.0.0.1 --port 4321`。
- 使用 Playwright + Chromium + CDP 检查公开页、邀请 gate、管理员登录和后台页面。
- 截图保存到 `output/playwright/`，页面 CDP 摘要保存为 `output/playwright/cdp-page-summary.json`。
- 新增 `references/working/product-user-manual.md`，面向普通用户说明主要页面、按钮、状态变化和点击结果。
- 新增 `.agents/skills/product-walkthrough/SKILL.md`，沉淀“运行 App -> CDP 检查 -> 截图 -> 梳理 -> 撰写 -> 更新文档”的可复用流程。
- 更新 `references/project-docs-index.md`，把产品说明持续记录加入当前工作区入口。

结果：

- App 本地运行成功，`http://127.0.0.1:4321/` 返回 200。
- 截图覆盖首页、搜索、内容宇宙、文章、点子、资源/邀请、学习、项目、关于、管理员登录、内容管理、选题池、需求复盘、数据看板、命中率、AI Gateway、管理员态匹配器。

沉淀：

```text
产品说明不能只从源码推断，必须先跑真实页面并保存截图证据。
普通用户文档应讲“入口、点击、状态、结果、价值”，不讲实现细节。
后续更新应追加到同一份持续记录，配 commit 与截图证据。
```

## 2026-06-15 Agent 六模块拆分（Perception / Memory / Orchestration）

阶段：P2

动作：

- 新建 `src/services/perception.service.ts` + `PerceptionServicePort`：把消息截断、PII 脱敏、压缩、未成年标记从 orchestrator 内联抽成独立服务，并补 6 个测试锁定契约（Step 1）。
- `MatchSessionRepositoryPort` 收口：orchestrator 不再 import `conversation/store`，`createSessionId` / `saveMessages` / `incrementStats` 走 port；`ConversationMessage` 接口移入 ports（Step 2）。
- `handleNeed` 拆生命周期：从 ~180 行单方法收缩为 ~50 行编排主线（perceive → plan → persist → safety → record → respond），业务规则下沉到 `planRecommendation` / `persistSession` / `buildAgentRecommendation` / `recordNeedCase` / `buildResponsePayload` 五个命名步骤函数（Step 3）。
- 分支 `refactor/agent-six-modules`，三 commit：`836b6ab` / `9927f49` / `be1b6bd`。

结果：

- `npx vitest run`：9 files / 53 tests passed（含新增 6 个 perception 测试）。
- `npx astro check`：0 errors。
- `npm run build`：Complete。
- 对外 `handleNeed` 签名零变化，执行顺序逐行对照等价。

阻滞：

- 无。

沉淀：

```text
大重构的安全网是"先有覆盖行为的测试再动"。orchestrator 原有 47 测试（encounter slice + 降级）在 Step 3 重组后仍全过，是逻辑等价的证据。
边界拆分按文档第 7 节顺序逐步走（Perception → Memory → Planning 核心 → Orchestration），每步独立 commit + 三重验证（test / check / build），比一次性大改稳。
Perception 原本没有独立测试覆盖是既存债务；抽取时顺手补 6 个测试锁定契约，既保护抽取又补齐债务。
六模块"当前承载"和 Plan 6"剩余范围"是活文档，完成一步就更新一步，避免文档和 reality 漂移。
```

后续：

- 决定 `refactor/agent-six-modules` 是否 merge 回 main。
- 真实浏览器验证（product-walkthrough 方法跑一遍 match 会话）为可选，测试已覆盖核心逻辑。
