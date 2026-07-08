# Plan: 认证状态 + 遭遇画像 + 选题闭环

Generated: 2026-06-14

上游: `auth-encounter-topic-prd.md`（本轮 PRD）

## 1. 执行策略

```text
不写兼容代码：UserProfile 重构一次性改完所有引用
后端 gate 为准：/api/match 鉴权 public→invited，前端 gate 配合体验
三阶段顺序推进：A 地基闭环 → B 选题工作台 → C 命中率+简报
Phase A 完成后 review 一次（PRD §12），再推 B/C
每阶段独立验收（vitest + astro check + build + 浏览器走查）
```

## 2. 优先级定义

```text
P0 = 地基/阻塞项：不做完后续无从谈起；或安全红线
P1 = 核心闭环价值：没它系统不成立或体验残缺
P2 = 增强/观测：可后补，不阻塞主链路
```

## 3. 任务总表（全量）

| ID | 任务 | Phase | 优先级 | Surface | 依赖 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | 后端 gate：/api/match 鉴权 public→invited | A | P0 | API | invited-auth(已有) | public 返回 401 |
| A2 | UserProfile 重构为 personaAnchor | A | P0 | ports/store/service | — | 砍 role/goal/stuckPoint/helpPreference/currentQuestion |
| A3 | /api/invite/verify 接 personaAnchor | A | P0 | API | A2 | 准入时建 UserProfile |
| A4 | /api/profile 字段缩减为 personaAnchor | A | P1 | API | A2 | POST/GET 调整 |
| A5 | AgentOrchestrator 遭遇切片推断 | A | P0 | service | A2 | 核心改动，参考锚点推断本次角色 |
| A6 | NeedCase 增 sliceInferred 字段 | A | P0 | ports | A5 | 低置信度标记 |
| A7 | 锚点 PII 检测（红线） | A | P0 | service | A2 | redactSensitiveText，命中拒绝 |
| A8 | 删除请求关联脱敏 | A | P1 | service/store | A2 | NeedCase rawNeed/snapshot 清空 |
| A9 | 邀请页组件 | A | P1 | frontend | A3 | 邀请码+≤10字锚点+chip+consent |
| A10 | ToolMatchChat gate + 身份探测 | A | P1 | frontend | A1/A9 | 未受邀引导，受邀显锚点 |
| A11 | 砍前置画像表单残留代码 | A | P1 | cleanup | A2 | 扫尾删除旧字段引用 |
| A12 | Phase A 测试 + 验收 | A | P0 | test | A1-A11 | vitest + check + build + 走查 |
| B1 | TopicCandidate 簇模型 | B | P0(of B) | ports/store | A5 | 需求簇字段 |
| B2 | 需求聚类批处理 | B | P1 | service | B1 | 关键词+角色轻量聚类 |
| B3 | admin review 升级选题工作台 | B | P1 | frontend | B1/B2 | 簇视图+逐条切换 |
| B4 | 站主灵感入口 | B | P2 | API/frontend | B1 | 输入框+API 进选题池 |
| C1 | 命中率仪表盘 | C | P1 | frontend/API | B1 | 内容↔簇↔反馈 resolved/stuck |
| C2 | 创作简报 | C | P1 | service/frontend | B1 | 选题→简报→编辑器 |

## 4. Phase A 详细（地基闭环）

### A1. 后端 gate（P0）
- 文件：`src/pages/api/match.ts`
- 改动：rate limit 后、userContext 解析前，加 invited/admin 检查；public 返回 401
- 复用：`readInvitedSessionId`、`isAdmin`（已有）
- 风险：断现有匿名匹配。PRD §7.1 已确认全 gate
- 退出：public curl `/api/match` 返回 401

### A2. UserProfile 重构（P0，地基）
- 文件：`src/stores/ports.ts`、`src/conversation/store.ts`、`src/services/profile.service.ts`、`src/stores/user-profile.store.ts`
- 改动：UserProfile 字段 → `personaAnchor`(≤10字) + `nickname`(可选) + `consentForProfile` + `confidence` + 系统字段；删 `role/goal/stuckPoint/helpPreference/currentQuestion/contact`
- confidence 重定义：anchor 填了=1，没填=0
- 一次性改完所有引用（profile.service / user-context / agent-orchestrator / api/profile / api/invite/verify / test）
- 退出：astro check 0 errors

### A3. /api/invite/verify 接 personaAnchor（P0）
- 文件：`src/pages/api/invite/verify.ts`、`src/services/invite-access.service.ts`
- 改动：POST body 增 `personaAnchor` 可选字段；verifyAndAdmit 后若带 anchor 则 `createUserProfileService.upsert` 存锚点
- PII 检测接 A7
- 退出：带 anchor 的 verify 请求，UserProfile 落库 personaAnchor

### A4. /api/profile 字段缩减（P1）
- 文件：`src/pages/api/profile.ts`
- 改动：POST 只接受 personaAnchor（+nickname）；`validateProfileInput` 调整；GET 返回 anchor
- 退出：POST goal/stuckPoint 等旧字段被忽略/拒绝

### A5. AgentOrchestrator 遭遇切片推断（P0，核心）
- 文件：`src/services/agent-orchestrator.service.ts`、`src/agent/match.ts`（可能加推断辅助）
- 改动：handleNeed 中，profileSnapshot 从"UserProfile 拷贝"改为"本次对话推断的角色切片"
  - `roleInContext`：从 latest user message + audienceGroup 信号推断（参考 personaAnchor 默认）
  - `goal`：从 needFrame.purpose / needSummary
  - `stuckPoint`：从 frictionLayer + 关键词
  - `socialContext`：可选，从 audience 信号
- 推断失败静默降级：`sliceInferred=false`，切片={role:anchor, goal:summary}
- 写入 NeedCase.profileSnapshot
- 退出：同用户不同提问，profileSnapshot.roleInContext 可不同

### A6. NeedCase 增 sliceInferred（P0）
- 文件：`src/stores/ports.ts`（NeedCase 接口）
- 改动：NeedCase 增 `sliceInferred?: boolean`
- 退出：低置信度切片可标记

### A7. 锚点 PII 检测（P0，红线）
- 文件：`src/services/profile.service.ts`
- 改动：personaAnchor 写入前过 `redactSensitiveText`；命中 PII 拒绝/提示重填
- 退出：anchor 填手机号被拒

### A8. 删除请求关联脱敏（P1）
- 文件：`src/services/profile.service.ts`、`src/conversation/store.ts`
- 改动：requestDeletion 时，关联 NeedCase 的 rawNeedRedacted/profileSnapshot 清空（保留聚合匿名）
- 退出：删画像后，相关 NeedCase 脱敏

### A9. 邀请页组件（P1，frontend）
- 文件：`src/components/invite/InviteGate.astro`（新）或嵌入 ToolMatchChat
- 内容：邀请码输入 + ≤10字锚点输入（maxlength=10）+ 示例 chip（学生/上班族/自由职业/想搞副业）+ consent
- Lucide 图标，无 Emoji
- 提交：POST `/api/invite/verify`（带 anchor）→ 成功后刷新身份状态
- 退出：浏览器能完成邀请+填锚点

### A10. ToolMatchChat gate + 身份探测（P1，frontend）
- 文件：`src/components/tools/ToolMatchChat.astro`
- 改动：
  - 加载时 GET `/api/profile` 探测（200=invited / 401=public）
  - 未受邀：信号按钮点击 → 显示邀请入口（A9），禁用直接提问
  - 受邀：记忆条显示 personaAnchor
- 退出：未受邀不能提问，受邀显锚点

### A11. 砍前置画像表单残留（P1，cleanup）
- 删除/调整所有引用旧 UserProfile 字段（role/goal/...）的代码
- A2 已改大部分，此步扫尾

### A12. Phase A 测试 + 验收（P0）
- vitest：invite-access / profile / orchestrator 遭遇切片
- astro check 0 errors
- npm run build 通过
- 浏览器走查：邀请→锚点→提问→带切片的 NeedCase；未受邀被 gate

## 5. Phase B 详细（选题工作台）

### B1. TopicCandidate 簇模型（P0 of B）
- 文件：`src/stores/ports.ts`、`src/conversation/store.ts`
- 改动：TopicCandidate 字段改为簇模型（clusterKey/density/roleDistribution/representativeNeed/relatedContentIds/status/producedContentSlug）
- 依赖 A5（遭遇切片是聚类维度）

### B2. 需求聚类批处理（P1）
- 文件：`src/agent/insight.ts`（processPendingNeedCases）或新增
- 轻量聚类：关键词（needCategories）+ 角色（profileSnapshot.roleInContext）合并同簇
- 复用 `/api/match-process` Cron 路径

### B3. admin review 升级选题工作台（P1）
- 文件：`src/pages/admin/review.astro`、`src/services/admin-review.service.ts`
- 增簇视图（`?view=clusters`）：密度/角色分布/代表性需求/已有内容
- 簇视图 ↔ 逐条视图切换

### B4. 站主灵感入口（P2）
- 文件：`src/pages/admin/`（新页面或并入 review）、`src/pages/api/admin/inspiration.ts`（新）
- admin 输入框 + POST API，进 TopicCandidate 选题池（source=inspiration）

## 6. Phase C 详细（命中率+简报）

### C1. 命中率仪表盘（P1）
- 文件：`src/pages/admin/`（新或并入 review/insights）、`src/pages/api/admin/hit-rate.ts`
- 内容 ↔ 簇 ↔ 反馈关联；每篇已发布内容显示 resolved/stuck 比例
- 依赖 B1（簇）+ feedback（已有）

### C2. 创作简报（P1）
- 文件：`src/pages/api/admin/brief.ts`（新）、`src/pages/admin/`（简报生成入口）
- 选题簇 → 简报（目标角色/核心卡点/站内可引用/建议角度/建议结构）→ 跳 `/admin/content/edit`
- 简报只给框架不给代写

## 7. 依赖关系

```text
A2（UserProfile 重构）── 地基，A3/A4/A5/A7/A8/A11 都依赖
A1（后端 gate）── 独立，A10 前端配合
A5（遭遇切片）── 核心，A6 依赖，B1 依赖（聚类维度）
A9（邀请页）── A10 依赖
Phase A 整体 ── Phase B/C 的前提
B1（簇模型）── B2/B3/B4/C1/C2 依赖
```

关键路径：`A2 → A5 → A12（Phase A 验收）→ B1 → B2/B3 → C1/C2`

## 8. 风险与回退

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| A1 后端 gate 断现有匿名匹配 | 现有匿名用户不能用 /tools 提问 | PRD 已确认全 gate；回退=gate 改回 public（一行） |
| A5 遭遇切片推断质量差 | 切片不准，调查价值降低 | 第一版规则推断，标 sliceInferred；后续可接模型增强 |
| A2 UserProfile 重构触及多文件 | 改漏导致类型错 | astro check 兜底；一次性改完不留兼容 |
| A1+A10 前后端 gate 不同步 | 体验断裂（前端让提问后端拒） | A1/A10 同批做，验收前后端联调 |
| 锚点 PII 漏检 | 零 PII 红线破 | A7 redactSensitiveText + 测试覆盖 |

## 9. 验收节奏

```text
Phase A 完成 → review 一次（PRD §12 建议）
  验收：浏览器走通受邀全链路 + 后端 gate + 遭遇切片 + astro check/build/test
Phase B 视 A 结果推进
Phase C 视 B 结果推进
每阶段：execution-log-current.md 记录
```

## 10. 配套文档归档

Phase 1-4 的 `working/plan.md` + `to-do list.md` 已完成，按 `working/README` 归档到 `docs/archive/cycles/`，让出标准名。本轮三件套：

```text
auth-encounter-topic-prd.md（已写）
auth-encounter-topic-plan.md（本文档）
auth-encounter-topic-todo.md（下一步，可验收任务清单）
```
