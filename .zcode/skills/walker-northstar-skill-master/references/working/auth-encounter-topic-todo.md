# To-do List: 认证状态 + 遭遇画像 + 选题闭环（详细可执行版）

上游: `auth-encounter-topic-prd.md` / `auth-encounter-topic-plan.md`

## Execution Decision
- **Judgment**: Go
- **Reason**: PRD + plan 已定，后端 gate 已确认，UserProfile 重构方向清晰。现状代码已确认（ports.ts / user-context.service / profile.service / match / agent-orchestrator 结构清楚）。

## Completion Definition
受邀用户能在浏览器走通：邀请码 → ≤10 字锚点 → 提问 → 带锚点引用 + 遭遇切片的 NeedCase；未受邀被后端 gate；站主能在选题工作台俯瞰需求簇、生成创作简报、看命中率仪表盘。

## Todo Boundary
- **Type**: product
- **Boundary**: 认证 gate / 遭遇画像 / 选题闭环纵向切片
- **Non-goals**: 完整账号 / GitHub OAuth / 内容代写 / graph.json / Publish Interface / Skill 准入 / 经验验证 / NorthStar 社区本体
- **Verification rule**: 用户侧链路 + 后台选题闭环都可用，仅完成 API 或页面不算达标
- **Pass criteria**: 见 Final Validation

---

## 模块衔接总览（数据流）

```text
[访客浏览器]
  → ToolMatchChat 加载 (A10: GET /api/profile 探测身份)
    ├ 401 public → 显示 InviteGate (A9)
    │   → POST /api/invite/verify {code, personaAnchor} (A3)
    │     → InviteAccessService.verifyAndAdmit → InvitedSession 落库
    │     → (带 anchor) profileService.upsert (A2 字段 + A7 PII 检测) → UserProfile.personaAnchor 落库
    │     → Set-Cookie: walker-invited (HMAC, 30 天)
    └ 200 invited → 记忆条显示 personaAnchor
  → 提问 POST /api/match (A1 gate: invited/admin 才放行, public 401)
    → userContext.resolve (读 invited session + profile.personaAnchor)
    → AgentOrchestrator.handleNeed
        → matchSiteResources (本地匹配, 已有)
        → inferEncounterSlice (A5: messages + anchor → roleInContext/goal/stuckPoint)
        → NeedCase 落库 { profileSnapshot=遭遇切片, sliceInferred } (A6)
    → 返回推荐
  → 反馈 POST /api/match-feedback → 回写 NeedCase.feedbackStatus (已有)

[admin]
  → /admin/review (B3 选题工作台: ?view=clusters 簇视图 + 逐条切换)
    → TopicCandidate 簇 (B1 模型 + B2 聚类批处理)
  → 创作简报 (C2: 选题簇 → POST /api/admin/brief → 跳 /admin/content/edit)
  → 命中率仪表盘 (C1: 内容 ↔ 簇 ↔ 反馈 resolved/stuck)
  → 灵感入口 (B4: POST /api/admin/inspiration → 进选题池)
```

依赖关键路径：`A2 (UserProfile 重构) → A5 (遭遇切片) → A12 (Phase A 验收) → B1 (簇模型) → B2/B3 → C1/C2`

---

## 影响分析总览

| 变更 | 影响模块/文件 | 现有行为断点 |
| --- | --- | --- |
| A2 UserProfile schema | ports.ts / store.ts / user-profile.store.ts / profile.service.ts / agent-orchestrator.service.ts / api/profile.ts / api/invite/verify.ts / 相关 test（约 8 文件） | 前置画像表单（role/goal/stuckPoint/helpPreference/currentQuestion）不再收集 |
| A1 后端 gate | api/match.ts | public 匿名匹配断流（PRD 已确认全 gate） |
| A5 ProfileSnapshot 语义 | ports.ts ProfileSnapshot / agent-orchestrator.service.ts / admin review 显示 | profileSnapshot 从静态画像拷贝 → 遭遇切片 |
| A6 NeedCase sliceInferred | ports.ts NeedCase / admin review | 新增低置信度标记 |
| B1 TopicCandidate 模型 | ports.ts / store.ts / agent/insight.ts / admin/topics / admin/review | TopicCandidate 从"选题候选"→"需求簇" |
| A1+A10 前后端 gate | api/match.ts + ToolMatchChat.astro | 必须同批，否则体验断裂 |

---

## Phase A Todos（地基闭环）

### A1. 后端 gate（P0）
**影响范围**：`src/pages/api/match.ts`（POST handler 加鉴权）；现有 public 匿名匹配行为断流；连带 ToolMatchChat 前端 sendMessage 会收 401（A10 处理）。
**模块衔接**：依赖 `lib/invited-session-auth.readInvitedSessionId` + `lib/admin-auth.isAdmin`（已有）；被 A10 依赖（前端探测 401 引导邀请）。
**可执行步骤**：
1. `match.ts` POST 先解析 `invitedSessionId = readInvitedSessionId(request)` + `isAdmin(request)`。
2. 先 `userContextService.resolve` 做后端 gate；若 `authState=public` → 返回 401 `{ error: '需要邀请码才能使用匹配功能。' }`。
3. 受邀 / 管理员通过 gate 后再限流：invited 按 sessionId 限流，admin 按 IP 限流。
**验收标准**：
- 无 cookie POST `/api/match` → 401 + 中文错误
- `walker-invited` cookie → 200
- `walker-admin` cookie → 200
- 受邀 / 管理员超过限流时 → 429
**风险**：现有匿名用户断流。PRD §7.1 已确认全 gate。回退 = 删 gate 检查（一处）。

### A2. UserProfile 重构为 personaAnchor（P0，地基）
**影响范围**（约 8 文件）：`ports.ts:196` UserProfile 接口、`conversation/store.ts` saveUserProfile/getUserProfileBySession、`stores/user-profile.store.ts`、`services/profile.service.ts`、`services/agent-orchestrator.service.ts`（buildProfileSnapshot）、`pages/api/profile.ts`、`pages/api/invite/verify.ts`、相关 test。
**模块衔接**：地基，A3/A4/A5/A7/A8/A11 全依赖。数据流：invite/verify 或 profile POST → upsert → store → user-context 读 → orchestrator。`user-context.service` 透传 profile，不用改。
**可执行步骤**：
1. `ports.ts` UserProfile：删 `role/goal/stuckPoint/helpPreference/currentQuestion/contact`，加 `personaAnchor?: string`。
2. `profile.service.ts` upsert：只处理 `personaAnchor + nickname`；`computeConfidence` 改为 `anchor 填了=1，没填=0`；删 `sanitizeContact`（不收 contact）。
3. `store.ts` / `user-profile.store.ts`：saveUserProfile 存新结构（内存 Map + Redis key 不变）。
4. `api/profile.ts`：`PROFILE_STRING_FIELDS = ['personaAnchor','nickname']`；`validateProfileInput` 调整。
5. `agent-orchestrator.buildProfileSnapshot`：临时适配读 `personaAnchor`（A5 会重写为遭遇切片，此处先保证不报错）。
6. 更新引用旧字段的 test（invite-access / visibility / profile）。
**验收标准**：
- `npx astro check` 0 errors（证明所有引用改完）
- UserProfile 无 role/goal/stuckPoint/helpPreference/currentQuestion/contact，有 personaAnchor
- vitest 通过
**风险**：改漏导致类型错。astro check 兜底；不写兼容代码，一次性改完。

### A3. /api/invite/verify 接 personaAnchor（P0）
**影响范围**：`src/pages/api/invite/verify.ts`（POST body 解析 + 调 profileService）。
**模块衔接**：依赖 A2（UserProfile）；A7 PII 检测在 profileService.upsert 内层；被 A9 前端邀请页调用。
**可执行步骤**：
1. verify.ts POST body 解析增 `personaAnchor?: string`（可选，≤10 字）。
2. `verifyAndAdmit` 成功后，若 body 带 personaAnchor → `profileService.upsert(sessionId, { personaAnchor })`。
3. upsert 内 PII 检测（A7）命中 → 抛错 → verify 返回 400。
**验收标准**：
- POST verify `{code, personaAnchor:"大三学生"}` → admitted + UserProfile.personaAnchor 落库
- POST verify `{code}`（无 anchor）→ admitted，后续可 /api/profile 补
- POST verify `{code, personaAnchor:"13800138000"}` → 400（PII）

### A4. /api/profile 字段缩减（P1）
**影响范围**：`src/pages/api/profile.ts`。
**模块衔接**：依赖 A2；前端 A10 通过 GET /api/profile 探测身份（200/401）。
**可执行步骤**：
1. `PROFILE_STRING_FIELDS = ['personaAnchor','nickname']`。
2. `validateProfileInput` 只认这两个字段。
3. GET 返回 `{ profile }`（profile 含 personaAnchor）。
**验收标准**：
- POST goal/stuckPoint 等旧字段 → 被忽略（不落库）
- POST personaAnchor → 落库
- GET → 返回当前锚点

### A5. AgentOrchestrator 遭遇切片推断（P0，核心）
**影响范围**：`src/services/agent-orchestrator.service.ts`（buildProfileSnapshot → inferEncounterSlice）、`src/stores/ports.ts` ProfileSnapshot 接口、可能 `src/agent/match.ts` 加推断辅助。
**模块衔接**：依赖 A2（personaAnchor 作默认）；衔接 A6（sliceInferred 标记）；被 B1 依赖（切片 roleInContext 是聚类维度）。数据流：messages + anchor + localMatch → inferEncounterSlice → profileSnapshot → NeedCase。
**可执行步骤**：
1. `ports.ts` ProfileSnapshot 改：`{ roleInContext?, goal?, stuckPoint?, socialContext?, personaAnchor?, sliceInferred: boolean, capturedAt }`（删 role/goal/stuckPoint/helpPreference/audienceGroup/aiStage/nickname 旧语义）。
2. agent-orchestrator 新增 `inferEncounterSlice(input, localMatch, personaAnchor)`：
   - `roleInContext`：前端传的 `audienceGroup`（select）+ latest user message 关键词推断；无信号 → 回退 personaAnchor；都无 → undefined + `sliceInferred=false`。
   - `goal`：`needFrame.purpose` / `needSummary`。
   - `stuckPoint`：`frictionLayer` 映射（如 account-config→"账号配置"，tool-understanding→"工具理解"）+ 关键词。
   - `socialContext`：audience 信号（学生/职场/家长/创作者）。
3. handleNeed 中 `profileSnapshot = inferEncounterSlice(...)`，替换原 buildProfileSnapshot。
4. 推断失败静默降级：`sliceInferred=false`，切片={roleInContext:anchor, goal:summary}，用户不报错。
**验收标准**：
- 锚点"学生"，问"怎么教孩子编程" → roleInContext 偏"家长/帮家人"（≠ 锚点，场景化）
- 问"GLM 怎么注册"（无角色信号）→ sliceInferred=false, roleInContext=anchor
- 推断失败时用户无感知错误，推荐照常返回
**风险**：推断质量。规则版先行 + sliceInferred 标记，后续可接模型增强。

### A6. NeedCase 增 sliceInferred（P0）
**影响范围**：`src/stores/ports.ts` NeedCase 接口。
**模块衔接**：被 A5 写入；admin review（A12/B3）可显示低置信度。
**可执行步骤**：NeedCase 增 `sliceInferred?: boolean`。
**验收标准**：NeedCase 可带 sliceInferred；admin review 列表能区分高/低置信度切片。

### A7. 锚点 PII 检测（P0，红线）
**影响范围**：`src/services/profile.service.ts`（upsert 内）。
**模块衔接**：复用 `src/agent/privacy.ts` 的 `redactSensitiveText`；被 A3（verify）/A4（profile）的 upsert 调用触发。
**可执行步骤**：
1. profile.service upsert 中，personaAnchor 写入前过 `redactSensitiveText(anchor)`。
2. 若 `piiDetected` → 抛 `PiiDetectedError`。
3. api 层（verify.ts / profile.ts）捕获 → 返回 400"锚点含敏感信息，请重填"。
**验收标准**：
- anchor="13800138000" / "test@qq.com" → 被拒（400）
- anchor="大三计算机学生" → 通过

### A8. 删除请求关联脱敏（P1）
**影响范围**：`src/services/profile.service.ts`（requestDeletion）、`src/conversation/store.ts`（新增 redactNeedCasesBySession）。
**模块衔接**：依赖 A2；记忆层关联处理（PRD §7.3）。
**可执行步骤**：
1. store.ts 新增 `redactNeedCasesBySession(sessionId)`：按 sessionId 找该用户所有 NeedCase，清空 `rawNeedRedacted` 和 `profileSnapshot`（保留聚合统计匿名性）。
2. profile.service requestDeletion：标记 `deleteRequestedAt` + 调 `redactNeedCasesBySession`。
**验收标准**：
- 用户请求删画像后，该 session 的 NeedCase rawNeedRedacted/profileSnapshot 为空
- deleteRequestedAt 已标记
- Feedback 保留（已脱敏聚合）

### A9. 邀请页组件（P1，frontend）
**影响范围**：新建 `src/components/invite/InviteGate.astro`（或嵌入 ToolMatchChat）。
**模块衔接**：提交 POST `/api/invite/verify`（带 code + personaAnchor）；被 A10 调用打开。
**可执行步骤**：
1. dialog 结构：邀请码 input + ≤10 字锚点 input（maxlength=10）+ 4 个示例 chip（学生/上班族/自由职业/想搞副业，点击填入可改）+ consent checkbox + 提交按钮。
2. Lucide 图标（`lucide:key-round` / `lucide:user` / `lucide:shield-check`），无 Emoji。
3. 提交逻辑：POST verify `{code, personaAnchor}` → 成功 reload（或更新身份状态）；失败显示中文错误（无效码/PII）。
**验收标准**：
- 浏览器能完成邀请码 + 锚点填写提交
- 无效邀请码 / PII 锚点 → 有明确错误提示
- 样式复用 ToolMatchChat 的玻璃/圆角语言

### A10. ToolMatchChat gate + 身份探测（P1，frontend）
**影响范围**：`src/components/tools/ToolMatchChat.astro`（initToolMatch）。
**模块衔接**：依赖 A1（后端 401）、A9（InviteGate 组件）；身份探测复用 GET /api/profile。
**可执行步骤**：
1. `initToolMatch` 启动时 fetch `GET /api/profile`：
   - 200 → invited，记忆条 `memory-role-label` 显示 `profile.personaAnchor`。
   - 401 → public，设 `isPublic = true`。
2. `match-open` / `sendBtn` 点击：`if (isPublic) { 打开 InviteGate dialog; return; }`（不进入提问流）。
3. InviteGate 成功后 reload 或重新探测身份，切换为 invited。
**验收标准**：
- 未受邀点开 ToolMatchChat → 显示邀请入口，不能直接提问
- 受邀 → 记忆条显示锚点，可正常提问
- 后端 401 与前端 gate 一致（联调）

### A11. 砍前置画像表单残留（P1，cleanup）
**影响范围**：全局扫描。
**可执行步骤**：grep `role|goal|stuckPoint|helpPreference|currentQuestion` 在 UserProfile 上下文的引用，清除残留（A2 已改大部分）。
**验收标准**：astro check 0 errors + grep 无 UserProfile 旧字段残留引用。

### A12. Phase A 测试 + 验收（P0）
**可执行步骤**：
1. vitest：invite-access / profile / orchestrator 遭遇切片推断 / PII 检测。
2. `npx astro check` 0 errors。
3. `npm run build` 通过。
4. 浏览器走查：临时设 `INVITE_CODES=test:内测:10` 起 dev，走通 邀请→锚点→提问→admin review 看带切片的 NeedCase；未受邀被 gate。
**验收标准**：见 Final Validation。

---

## Phase B Todos（选题工作台）— Phase A 完成后细化

### B1. TopicCandidate 簇模型（P0 of B）
**影响**：`ports.ts` TopicCandidate 接口、`conversation/store.ts` 簇存储、`agent/insight.ts`。
**衔接**：依赖 A5（遭遇切片是聚类维度）。
**步骤**：TopicCandidate 字段改簇模型（clusterKey/density/roleDistribution/representativeNeed/relatedContentIds/status/producedContentSlug）。
**验收**：簇可存储读取，含密度和角色分布。

### B2. 需求聚类批处理（P1）
**影响**：`agent/insight.ts`（processPendingNeedCases）或新增。
**步骤**：轻量聚类（needCategories 关键词 + profileSnapshot.roleInContext 合并同簇），复用 `/api/match-process` Cron。
**验收**：未处理 NeedCase 能聚成簇，簇密度=含 case 数。

### B3. admin review 升级选题工作台（P1）
**影响**：`pages/admin/review.astro`、`services/admin-review.service.ts`。
**步骤**：增 `?view=clusters` 簇视图（密度/角色分布/代表性需求/已有内容）+ 逐条视图切换。
**验收**：后台能按簇俯瞰，切换逐条/簇视图。

### B4. 站主灵感入口（P2）
**影响**：`pages/admin/`（新或并入 review）、`pages/api/admin/inspiration.ts`（新）。
**步骤**：admin 输入框 + POST API，进 TopicCandidate 选题池（source=inspiration）。
**验收**：灵感能进选题池，与需求簇并置。

---

## Phase C Todos（命中率+简报）— Phase B 完成后细化

### C1. 命中率仪表盘（P1）
**影响**：`pages/admin/`（新或并入 insights）、`pages/api/admin/hit-rate.ts`（新）。
**衔接**：依赖 B1（簇）+ feedback（已有）。
**步骤**：内容 ↔ 簇 ↔ 反馈关联；每篇已发布内容显示 resolved/stuck 比例。
**验收**：每篇内容命中率可见。

### C2. 创作简报（P1）
**影响**：`pages/api/admin/brief.ts`（新）、`pages/admin/`（简报入口）。
**步骤**：选题簇 → 简报（目标角色/核心卡点/站内可引用/建议角度/建议结构）→ 跳 `/admin/content/edit`。简报只给框架不给代写。
**验收**：选题能生成简报并跳编辑器；简报不含代写正文。

---

## UI 规格（前端任务细化）

本轮前端任务（A9/A10/B3/B4/C1/C2）遵循现有视觉语言：`.panel-glass` 玻璃面板、`var(--color-brand)` 主题色、圆角、Lucide 图标（`astro-icon` + `@iconify-json/lucide`）、**无 Emoji**、多主题兼容（.theme-nature/aurora/sunset/mint）、移动端适配。所有新组件复用 ToolMatchChat 的玻璃/圆角/字体体系，不另起设计语言。

### A9. 邀请页 InviteGate（dialog）
**形态**：dialog，复用 ToolMatchChat `.match-dialog` 样式语言（玻璃面板 + 圆角 16px + backdrop blur）。
**布局**：
- Header：`lucide:shield-check` 图标 + 标题"受邀进入 iwalk.pro" + 关闭按钮 `lucide:x`
- 邀请码输入框：`lucide:key-round` 前缀图标，placeholder"输入邀请码"
- 锚点输入框：`lucide:user` 前缀图标，placeholder"一句话说说你是谁"，maxlength=10，右侧字符计数"0/10"
- 示例 chip 行：`[学生][上班族][自由职业][想搞副业]`，点击填入锚点框（填入后可改）
- consent：checkbox + "同意被 Walker 记住需求，用于选题改进"
- Footer：提交按钮"进入"（主色 `var(--color-brand)` 填充），loading 时禁用 + spinner
**交互**：打开 → focus 邀请码框；提交 → 禁用按钮 + loading → 成功 reload；失败在邀请码框下显红色提示（"邀请码无效"/"锚点含敏感信息，请重填"）；Enter 提交。
**状态**：默认 / loading / error（无效码/PII/已用完）/ success。
**移动端**：dialog 全宽 `calc(100vw - 1rem)`，chip 自动换行。

### A10. ToolMatchChat gate + 身份探测
**未受邀状态**：
- 信号按钮 `.match-signal` 副标题改为"需要邀请码才能使用"
- 点击 → 打开 InviteGate（A9），**不开**聊天 dialog
- 记忆条 `memory-role-label` 显示"未受邀"（灰色）
**受邀状态**：
- 记忆条 `memory-role-label` 显示 personaAnchor（如"大三学生"），前缀 `lucide:user` 图标，主色高亮
- 聊天流正常
**视觉**：受邀时记忆条角色项加锚点 chip 样式（主色淡背景）。

### B3. 选题工作台（admin/review 升级）
**视图 Tab**（顶部）：`[需求簇] [逐条复盘]` 切换。
**簇视图**：
- 簇卡片网格（响应式 2-3 列），每张卡：
  - 密度徽章"12 条需求"（主色背景圆角）
  - 角色分布 chip 行：`学生×5 家长×3 创作者×4`
  - 代表性需求摘要（1-2 行，灰色省略）
  - 已有相关内容链接（`lucide:link`，如有）
  - 操作行：采纳 `lucide:check` / 暂缓 `lucide:clock` / 忽略 `lucide:eye-off` + "生成简报" `lucide:file-text`
- 排序：密度降序
**逐条视图**：保留现有 admin/review.astro 的 case 列表（带 profileSnapshot/feedbacks）。
**空状态**：簇视图无数据 → "还没有足够的需求聚类，继续积累"。

### B4. 站主灵感入口
**位置**：选题工作台顶部。
**布局**：输入框（`lucide:lightbulb` 前缀，placeholder"记下一个选题灵感"）+ 提交按钮。
**交互**：提交 → 进选题池（source=inspiration 标记）+ toast"已加入选题池"。灵感在簇视图以独立卡片显示（`lucide:lightbulb` 角标，区别于需求簇）。

### C1. 命中率仪表盘
**位置**：`/admin/hit-rate` 或并入 `/admin/insights` 新 Tab"内容命中率"。
**布局**：列表，每行一篇已发布内容：
- 内容标题（链接到文章）
- 关联簇（chip）
- 命中率条：绿色 resolved / 橙色 stuck 比例条 + 数字"resolved 8 / stuck 2"
- 总反馈数
**视觉**：进度条 + 颜色编码（绿=resolved，橙=stuck，灰=无反馈）。无反馈内容标灰"暂无反馈"。

### C2. 创作简报
**入口**：簇卡片"生成简报"按钮（`lucide:file-text`）。
**形态**：简报全屏页或大弹窗。
**布局**（分块卡片）：
- 目标角色：簇角色分布 top1-2（`lucide:users`）
- 核心卡点：最高频 stuckPoint（`lucide:alert-circle`）
- 站内可引用：relatedContentIds 列表（`lucide:link`）
- 建议角度：2-3 个 bullet（`lucide:compass`）
- 建议结构：大纲骨架数字列表（`lucide:list`）
- Footer："去编辑器"按钮（`lucide:pencil`）→ 跳 `/admin/content/edit?prefill=...`（预填标题/分类/需求来源）
**强调**：简报顶部标注"框架与弹药，正文请自行创作"（不代写，对齐 PRD §3.5）。

### 通用 UI 规则
- **图标**：全部 Lucide（`astro-icon`），无 Emoji，无 Iconify CDN 运行时
- **样式**：复用 `src/styles/global.css` 的 `@theme` 变量（`--color-brand`/`--color-surface`/`--color-border`），不硬编码颜色
- **主题兼容**：新组件用 CSS 变量，自动适配 4 套主题（nature/aurora/sunset/mint）
- **玻璃面板**：用 `.panel-glass`，不另写
- **移动端**：所有新页面/弹窗测 `max-width: 640px` 断点，不依赖 hover
- **可访问性**：按钮带 `aria-label`，dialog 带 `aria-labelledby`，表单 label 关联

## Final Validation（详细验收标准）

### 用户侧链路
- [ ] 浏览器走通：邀请码 → ≤10 字锚点 → 提问 → NeedCase 带 personaAnchor 引用 + 遭遇切片
- [ ] 未受邀访客点开 ToolMatchChat → 显示邀请入口，不能直接提问
- [ ] 后端 gate：无 cookie POST `/api/match` → 401
- [ ] 受邀后 ToolMatchChat 记忆条显示锚点
- [ ] 同用户多次提问，遭遇切片 roleInContext 可不同（场景化，验证画像两层模型）
- [ ] 推断失败时用户无感知错误（A3 静默降级）

### 安全与隐私
- [ ] 零 PII：锚点填手机号/邮箱 → 被拒（400）
- [ ] 不收集手机/邮箱/身份证（UserProfile 无 contact 字段）
- [ ] 删除请求后，相关 NeedCase 的 rawNeedRedacted/profileSnapshot 清空

### 数据模型
- [ ] UserProfile 无 role/goal/stuckPoint/helpPreference/currentQuestion/contact
- [ ] UserProfile 有 personaAnchor
- [ ] ProfileSnapshot 语义为遭遇切片（roleInContext/goal/stuckPoint/socialContext/sliceInferred）
- [ ] NeedCase 有 sliceInferred 标记

### 后台选题闭环（Phase B/C）
- [ ] 选题工作台能按需求簇俯瞰（密度/角色分布/代表性需求/已有内容）
- [ ] 创作简报能从选题簇生成并跳 /admin/content/edit
- [ ] 命中率仪表盘显示每篇已发布内容的 resolved/stuck
- [ ] 站主灵感能进选题池

### 工程验收
- [ ] vitest 覆盖 invite / profile / orchestrator 遭遇切片 / PII 检测核心行为
- [ ] `npx astro check` 0 errors
- [ ] `npm run build` 通过
- [ ] execution-log-current.md 记录本轮

---

## 2026-06-14 Completion Evidence

- 用户侧浏览器 smoke：`/tools` 200；无 cookie `POST /api/match` 返回 401；点击 ToolMatchChat 打开 `#invite-dialog`；`alpha-preview + 学生` 通过后 `#match-dialog` 打开；`GET /api/profile` 返回 invited；受邀 `POST /api/match` 返回 200 + needCaseId。
- 后台 smoke：用本地 `.env` 的 ADMIN_PASSWORD 登录后，`POST /api/match-process` 返回 200 并生成 observed TopicCandidate；`/admin/review?view=clusters` 返回 200，存在 2 个 view-switch link 和 cluster card；`/admin/topics` 返回 200；`/admin/hit-rate` 返回 200；从选题简报进入内容编辑器会写入 `sourceTopicId`，保存内容后回写 TopicCandidate 的 `producedContentSlug`。
- API 权限：未登录 `GET /api/admin/hit-rate` 与 `GET /api/admin/review?view=clusters` 均返回 401；未登录 `/admin/hit-rate` 返回 302 到登录页。
- 工程验证：`npm test` 8 files / 47 tests passed；`npx astro check` 0 errors；`npm run build` Complete。
- 测试覆盖新增：`agent-orchestrator.service.test.ts`（遭遇切片 + 低置信回退 + 保存失败降级）、`agent/insight.test.ts`（需求簇模型 + NeedCase topicCandidateId 回写）、`brief.service.test.ts`（简报结构不代写正文）、`hit-rate.service.test.ts`（每篇内容 resolved/stuck 聚合 + 内容 frontmatter `sourceTopicId` 回连）、`profile.service.test.ts`（confidence + 删除脱敏）。
- 产品提交：`ac8b286 Complete auth encounter topic loop` 已推送到 PR #9（`codex/invite-tools-access`），PR 已 ready for review。

当前实现决策：后端 gate 优先于 rate limit，原因是邀请制交互的真实权限门应稳定返回 401，引导用户进入邀请码流程；防刷仍在受邀/admin 通过 gate 后按 session/IP 限流。

---

## First Execution Step
A2（UserProfile 重构）是地基，先做（一次性改完 8 文件，astro check 兜底）；然后 A1（后端 gate）+ A5（遭遇切片）可并行（A1 独立，A5 依赖 A2）；A6/A7 跟随 A5/A2；前端 A9/A10 待后端 A1/A3 就绪；A11 扫尾；A12 验收。Phase A 完成后 review 一次（PRD §12），再推 B/C。

## 自主决策记录（遇问题自行决定）
- **rate limit vs gate 顺序**：gate 在前（public 稳定 401 进入邀请码流程），rate limit 在受邀/admin 通过 gate 后执行。
- **gate 位置**：userContext.resolve 之后、checkRateLimit 之前。
- **A5 推断失败处理**：静默降级，绝不报错（PRD §7.4 A3）。
- **Phase B/C 细化时机**：Phase A 完成后，依据真实遭遇切片质量再定聚类规则和简报结构。
- **文档命名**：本轮三件套用主题前缀名（auth-encounter-topic-*），总账 prd.md 保持不动。
