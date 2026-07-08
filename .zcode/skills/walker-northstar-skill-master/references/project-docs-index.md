# Walker / iwalk.pro 当前文档入口

本文档是 `walker-northstar` skill 的当前决策入口。`references/` 内部文档发生冲突时，以本文为准；如果本文与用户即时指令或 `SKILL.md` 冲突，则按 `用户即时指令 > SKILL.md > 本文` 处理。旧 PRD、旧架构设计、旧 Agent 规划和历史讨论只用于追溯，不直接指导当前实现。

文档治理采用“skill 本体区 + 五层 / 四区”模型：

```text
Skill 本体区 = SKILL.md + agents/openai.yaml + examples/，不属于项目工作区。
SKILL.md = 调度层，决定读哪个区、怎么行动、什么时候停。
规划区 = 长期方向、背景、需求分析、功能设计、架构设计、协议和边界。
工作区 = 当前一轮工作包，核心为 prd.md / plan.md / to-do list.md。
反思区 = 执行日志、偏差、错误、经验、case、pattern、rule candidate。
归档区 = 已结束的一轮工作包和历史参考，默认不参与当前决策。
```

四区不是普通资料分类，而是文档权力系统：

- **规划区**：拥有边界权，回答为什么做、做到什么形态、不能越过什么线。
- **工作区**：拥有执行权，保存当前一轮产出的工作包；核心为 `prd.md`、`plan.md`、`to-do list.md`。
- **反思区**：拥有学习权，记录执行中发生了什么、哪里偏了、下次规则要怎么改。
- **归档区**：拥有追溯权，只用于回看历史，不再直接指导当前实现。

当前工作区保存当前这一轮产出的工作包，核心固定为 `references/working/prd.md`、`references/working/plan.md`、`references/working/to-do list.md`；允许保留本轮产生、且仍服务当前执行或验收的补充文档。规划、反思和调度入口仍在本 skill 的 `references/` 中按四区路由管理。`goal` 不作为当前执行区独立文档类型，目标、完成定义和验收证据沉入 PRD 或 to-do list。
归档、ADR、AI 赋能专题和媒体素材放在项目 `docs/`。

标准工作流：

```text
背景介绍 / 任务理解
-> 需求分析
-> 功能设计
-> 架构设计
=> prd.md
-> plan.md
-> to-do list.md
-> 执行
-> 验收
-> 反思
-> 按时间归档本轮工作包
```

归档粒度按“一轮工作包”，不按零散文件类型：

```text
docs/archive/cycles/YYYY-MM-DD-topic/
  prd.md
  plan.md
  todo.md
  retro.md
  execution-log.md
  summary.md
```

---

## 1. 当前现状

### 1.1 一句话定位

iwalk.pro 是 Walker 的个人实践场 / 样板节点，用来沉淀内容、点子、工具、方法、生活切片和 AI 协作经验。

更大的长期方向是：

> 用点子连接人与 AI，也连接人与人；独自前行时，人决策，AI 执行；共同前行时，点子让人成为同行者。

### 1.2 核心对象关系

- **FerrySpec**：演化中的世界协议，不是固定教条。它提供人类主权、熵减命令、蓝图/现实/日志、P0-P4、Skill/Flow/Log 等当前有效的方法论。
- **iwalk.pro / AdgaiWalker**：个人系统样板节点，验证一个人如何组织内容、点子、生活、工具、方法、复盘、Agent 和 skill。
- **Publish Interface**：个人系统向社区开放的选择性发布接口，决定什么能发布、以什么形态发布、发布到哪里、反馈如何回流。
- **NorthStar / PanGen AI Compass**：多个个人系统之间的连接网络，承载 idea、问题、项目、skill、案例和协作。

Ferry `v1.1.0` 已明确双 Git 开发范式：Skill 仓库保护 `blueprint + .ferry`，产品仓库保护
`reality`。本项目以 `references/planning/ferry-development-protocol.md` 和
`references/planning/human-gate-policy.md` 作为开发安全边界。

关系不是严格先后，而是节点、接口、网络并存：

```text
Ferry 当前协议
  -> 指导
iwalk.pro 个人系统节点
  -> 通过 Publish Interface 选择性发布
NorthStar 社区网络
  -> 产生阻滞、偏差、数据、反馈
Ferry vNext 方法论更新
```

### 1.3 当前站点技术现状

- 框架：Astro 6
- 部署：Vercel SSR adapter
- 样式：Tailwind CSS v4 + 全局 CSS 变量
- 内容：Astro Content Collections，集合名为 `log`
- 搜索：Pagefind
- 点赞：Upstash Redis via `/api/like`
- 评论：Giscus
- 图标：Lucide via `astro-icon`
- AI 接口：`/llms.txt`、`/walker-style.md`、`/index.json`
- 管理后台：`/admin`、`/admin/insights`、`/admin/topics`、`/admin/ai-gateway`、`/admin/content`
- MCP：`walker_query`、`walker_search`、`walker_get`、`walker_stats`、`walker_insights`

---

## 2. 当前问题

1. **内容结构仍需迁移**：现有内容还没有全部补齐 `form`、`domain`、`intent`、`valueMode`、`aiUsePolicy` 等字段。
2. **内容宇宙体验还未完成**：`/content` 已经承担内容宇宙方向，但多视图、卡片体系、生活切片和移动端体验仍需继续设计。
3. **反馈数据闭环还不完整**：公开统计和后台洞察已有基础，但 TopicCandidate 到文章/教程/直播选题的闭环还未稳定。
4. **个人系统、发布接口与社区网络边界需要保持**：NorthStar 可以并存，但 iwalk.pro 不应承担社区本体复杂度，个人内容也不应默认进入社区。
5. **邀请制身份入口需要落地**：已决定纳入 iwalk.pro 近期路线，但只做轻身份、轻会话和画像理解，不做完整社区账号系统。

### 已解决的问题

- AI 可读接口已落地：`/llms.txt`、`/walker-style.md`、`/index.json`。
- 决策文档过多已初步解决：旧文档已归档或标为参考，以本文档为唯一决策入口。
- 当前路由和长期方向不一致已解决：主导航收敛为 `首页 / 内容 / 关于`，旧路由保留兼容。
- 管理后台已上线：`/admin`、`/admin/insights`、`/admin/topics`、`/admin/ai-gateway`。
- 需求匹配 Agent 已上线：ToolMatchChat + 匹配 API + 需求洞察聚类 + 选题库管理页。
- 对话消息持久化已有基础：Redis 持久化 + 用户历史查看 + 管理员对话查看。
- 内联编辑已有基础：AdminEditBar + 内容 CRUD API + 编辑器页。
- MCP server 已实现基础版：5 个工具 query/search/get/stats/insights。

---

## 3. 已确认决策

### 3.1 产品与哲学决策

- 人是目的，AI 是工具。
- 人负责目标、判断、审美、选择、责任、意义、是否公开、是否继续。
- AI 负责读取、检索、整理、生成、拆解、提醒、执行、辅助沉淀。
- 点子不是静态灵感箱，而是人对现实“不必如此”的回应。
- 生活内容不是点子的附属品，但生活内容是点子的土壤。
- 内容同时拥有工具价值与存在价值；厨艺、书法、日记、吐槽、迷茫不能被功利化。
- 数据提供现象，不提供目的；公开方向，不公开脆弱。
- 系统帮助人成为自己，不把人系统化。

### 3.2 iwalk.pro 产品决策

- 主导航目标：`首页 / 内容 / 关于`。
- `/content` 是内容宇宙，不是普通文章列表。
- 旧路由 `/posts`、`/tools`、`/ideas`、`/projects` 先保留兼容，不立即删除。
- `/about` 承载关于我、关于站、路线图、数据台、技术与 AI、联系方式。
- 数据台先做轻量公开数据入口，后台分析只给管理员。
- iwalk.pro 短期仍以个人站、个人 Agent、内容沉淀、需求匹配和发布接口验证为主，不做完整社区系统。
- NorthStar 可以并行存在，但社区账号、信息流、协作、推荐和审核属于社区网络本体，不默认塞进 iwalk.pro。
- 邀请制身份入口进入 iwalk.pro 近期路线，但目标是测试阶段的轻身份理解，不是注册登录社区化。

### 3.3 内容模型决策

内容不只按 `type` 分类，而按多个维度组织：

- `form`：文章、笔记、日记、吐槽、图集、视频、菜谱、书法、资源、项目、点子、教程。
- `domain`：AI、编程、产品、哲学、生活、厨艺、书法、阅读、旅行、情绪、社群。
- `intent`：思考、记录、教学、分享、验证、展示、复盘、连接、表达。
- `valueMode`：工具价值、存在价值、二者兼有。
- `status`：`thinking`、`validating`、`building`、`verified`、`archived`。
- `aiUsePolicy`：AI-0 不可读，AI-1 可读作背景，AI-2 可引用，AI-3 可推荐，AI-4 可执行任务。

点子生命周期当前以 `status` 为准：

| Ferry 阶段 | 当前 status | 前端显示 |
| --- | --- | --- |
| P0 Chaos | `thinking` | 构思中 |
| P1 Blueprint | `validating` | 验证中 |
| P2 Reality | `building` | 实现中 |
| P3 Dialectic | 暂无正式字段 | 暂不映射 |
| P4 Synthesis | `verified` | 已完成 |

`archived` 是额外归档状态，不映射 Ferry 阶段。

---

## 4. 整体路线

跨阶段路线以 `references/planning/adgaiwalker-to-northstar-roadmap.md` 为准。本文中的 Plan 描述
当前项目入口和阶段状态；NorthStar 可以并行存在，但社区网络本体任务不进入 iwalk.pro 的
当前 todo。

### Plan 1：iwalk.pro 第一阶段落地（已完成）

目标：先让个人系统成为可理解、可扩展、可读取的样板。

已完成范围：

- `/content` 内容宇宙基础
- 内容模型字段扩展
- 主导航收敛为 `首页 / 内容 / 关于`
- `/about` 轻量数据台
- `llms.txt`
- `walker-style.md`
- `index.json`
- 旧路由兼容

历史执行细节已提炼到 `docs/archive/references/legacy-docs-extracted-value.md`，不再作为当前执行入口。

### Plan 2：内容迁移与治理（进行中）

目标：把现有内容逐步补成新内容模型。

范围：

- 给现有内容补 `form`、`domain`、`intent`、`valueMode`、`aiUsePolicy`、`related`、`updated`、`summary`
- 建立厨艺、书法、日记、吐槽、点子、项目、工具、教程的写作规范
- 明确哪些内容可被 AI 引用，哪些只能作为背景

### Plan 3：内容宇宙 UI/UX（未开始）

目标：把 `/content` 从功能可用升级成真正的内容宇宙。

范围：

- 时间线 / 网格 / 图集 / 点子流等多视图
- 内容卡片视觉体系
- 生活切片展示
- 作品展示
- 点子状态卡
- 移动端适配

### Plan 4：反馈数据台 v1（部分完成）

目标：形成真实内容反馈闭环。

已完成：

- 公开数据台在 `/about` 轻量落地
- 私有分析后台在 `/admin/insights`
- 选题候选页在 `/admin/topics`

剩余范围：

- 搜索无结果记录
- 热门内容和内容表现矩阵
- TopicCandidate 到内容创作的工作流
- 发布后内容反向关联需求来源

### Plan 5：AI 可读接口 v2（未开始）

目标：让 AI 更稳定地读取和理解 iwalk.pro。

已完成基础版：

- `/llms.txt`
- `/walker-style.md`
- `/index.json`
- MCP 基础工具

剩余范围：

- 自动生成 `llms.txt`
- `graph.json`
- `index.json` 增强
- JSON-LD 增强
- related graph
- `walker-style.md` 半自动维护

### Plan 6：个人 Agent / MCP（基础版已完成）

目标：让 Walker 自己的 Agent 能调用个人知识系统。

已完成基础能力：

- `walker_query`
- `walker_search`
- `walker_get`
- `walker_stats`
- `walker_insights`

剩余范围：

- 更严格的 public/private/admin-only 权限验收
- 需求洞察数据质量验证
- ~~Agent 六模块逐步从 `/api/match.ts` 中拆清边界~~ ✓ 已完成（2026-06-15，分支 `refactor/agent-six-modules`，三步：Perception 独立 service / Memory 收口 port / handleNeed 拆生命周期）

### Plan 7：邀请制身份理解入口（近期路线，未开始）

目标：在资源有限、仍处测试阶段的前提下，用邀请码控制访问规模，用轻量画像理解用户是谁、为什么来、需要什么，并把这些上下文交给需求匹配模块和 Agent 答案系统。

范围：

- 邀请码准入
- 轻量会话
- 用户画像问卷
- 画像上下文供需求匹配和 Agent 路由读取
- 用户提问后形成需求事件
- 管理员复盘画像、需求事件、匹配结果和反馈
- 用户知情提示、画像修改、数据删除和需求事件脱敏

不做：

- 完整社区账号系统
- 关注、粉丝、积分、等级
- 用户个人主页
- 复杂角色权限
- 找回密码
- 重型 CRM

当前执行入口：`references/working/prd.md`。Phase 1 执行清单见 `references/working/to-do list.md`。

### Plan 8：NorthStar 社区网络（并行长期方向）

目标：在 `C:\Users\26296\Desktop\NorthStar` 单独推进多人个人系统网络与点子共创平台。

范围：

- 个人系统模型
- 个人系统发布接口
- 点子发布
- 点子协作
- 角色与能力
- 贡献记录
- 协作空间
- 平台数据台
- 审核与权限

---

## 5. 当前工作重心

1. **内容迁移与治理**：补齐内容模型字段，建立写作规范。
2. **内容宇宙 UI/UX**：推进 `/content` 多视图和内容卡片体系。
3. **反馈数据闭环**：把 `/admin/topics` 中的选题候选变成真实文章、教程或直播选题。
4. **Agent 边界治理**：按六模块边界逐步拆清 Perception、Memory、Planning、Tools、Orchestration、Observability。
5. **邀请制身份入口**：先做轻身份、轻会话和画像理解，让需求匹配更贴近真实用户。
6. **发布接口定义**：明确个人系统中哪些对象能发布到社区，以及反馈如何回流。
7. **Ferry 安全边界落地**：用双 Git、Human Gate 和 execution log 管住 AI 协作开发风险。
8. **AI 可读接口增强**：增强 `graph.json`、`index.json` 和 related graph。
9. **Spec Kit / OpenSpec 改造桥接**：把需求、设计、计划、任务、执行和归档串成一条可回放的规范链条。

---

## 6. 文档使用规则

### 6.0 Skill 本体区与五层 / 四区读取规则

`SKILL.md` 不是规划区、工作区、反思区或归档区的一部分。它是调度层，职责是决定当前任务属于哪一层、读取哪些最小文档、什么时候需要 Walker 确认、以及执行后是否需要沉淀到反思区。

`agents/openai.yaml` 和 `examples/` 属于 skill 本体区：前者只保存展示名、简介和默认提示；后者只保存正反例。它们不承载当前 PRD、plan、to-do list、长期规划或反思日志。

默认读取顺序：

```text
1. SKILL.md：确认任务路由、边界和安全规则。
2. project-docs-index.md：确认当前文档入口和四区权力关系。
3. 工作区：读取当前轮工作包，优先读取 `prd.md` / `plan.md` / `to-do list.md`。
4. 规划区：仅在需要边界、架构、协议、长期方向时读取。
5. 反思区：仅在出现阻滞、错误、复盘、规则沉淀或需要更新日志时读取。
6. 归档区：仅在追溯历史原因、比较旧方案或提炼历史价值时读取。
```

工作区规则：

```text
工作区永远只保留当前一轮工作包。
当前执行核心只认 `prd.md` / `plan.md` / `to-do list.md`。
本轮补充文档可以留在工作区，但必须仍服务当前执行或验收。
不新建当前区 goal 文件。
一轮结束后，工作区本轮工作包连同反思材料一起按时间归档。
```

反思区第一版只回答四个问题：

```text
这轮做成了什么？
哪里偏了或错了？
下次要改哪条规则？
哪些内容要进入下一轮 PRD / plan / to-do list？
```

反思区内容的晋升路径：

```text
一次具体事件 -> case
重复出现两次 -> pattern
稳定有效三次以上 -> rule candidate，才考虑进入 SKILL.md 或协议文件
```

### 6.1 当前决策入口

- `references/project-docs-index.md`：唯一当前决策入口。
- `docs/README.md`：只说明 `docs/` 作为归档和额外材料区的使用规则。

### 6.2 现有文件四区归属

#### Skill 本体区与调度入口

- `SKILL.md`：任务路由、安全边界、最小读取集、case/pattern/rule 晋升规则；不承载 PRD、plan、todo 或长期架构全文。
- `agents/openai.yaml`：skill 展示名、简介和默认提示配置；不是项目文档。
- `examples/`：skill 使用正反例；不是当前工作材料。
- `references/project-docs-index.md`：当前文档入口和四区权力关系。
- `references/current-cycle-state.md`：当前周期状态提醒。

#### 规划区

- `references/planning/README.md`：规划区入口；当前阶段已完成第一轮物理归位。
- `references/planning/charter.md`：项目边界和阶段原则。
- `references/planning/ferry-development-protocol.md`：Ferry `v1.1.0` 在本项目中的开发协议和双 Git 边界。
- `references/planning/human-gate-policy.md`：AI 可直接执行、需要确认、禁止自动执行的操作边界。
- `references/planning/artifact-readiness-protocol.md`：文档成熟度提醒与进入执行前的判断规则。
- `references/planning/interaction-protocol.md`：Walker 与 AI 协作交互规则。
- `references/planning/architecture-expression.md`：大图架构表达。
- `references/planning/adgaiwalker-personal-agent-system-architecture.md`：个人 Agent / Skill / 经验沉淀总架构。
- `references/planning/agent-six-modules-architecture.md`：Agent 六模块责任边界。
- `references/planning/adgaiwalker-to-northstar-roadmap.md`：AdgaiWalker 到 NorthStar 的跨阶段路线。
- `references/planning/personal-system-publish-interface-architecture.md`：个人系统到社区的发布接口架构。
- `references/planning/northstar-future.md`：长期 NorthStar 社区边界。
- `references/planning/spec-engine-adaptation.md`：把 Spec Kit / OpenSpec 翻译成 Walker 的文档协议、执行节奏和归档边界。
- `references/planning/content-intent.md`：内容分类与创作规则。
- `references/planning/idea-operating-system.md`：想法到结果工作流。
- `references/planning/skill-philosophy.md`：Skill 哲学与准入标准。
- `references/planning/identity-entry.md`：邀请制身份入口与需求匹配边界。
- `docs/adr/ADR-0001-agent-core-separation.md`：Agent 核心和展示层分离决策记录。

#### 工作区

- `references/working/README.md`：工作区规则。
- `references/working/prd.md`：承载当前轮的需求分析、功能设计、架构设计。
- `references/working/plan.md`：承载基于 `prd.md` 的开发规划、阶段顺序、依赖关系。
- `references/working/to-do list.md`：承载基于 `prd.md` 和 `plan.md` 的可执行、可验收任务清单。
- `references/working/product-user-manual.md`：基于当前 App 真实运行、浏览器/CDP 检查和截图生成的用户侧产品说明持续记录。

#### 反思区

- `references/reflection/README.md`：反思区入口；当前阶段已完成第一轮物理归位。
- `references/reflection/execution-log-current.md`：当前周期关键执行、阻滞和规则沉淀。
- `references/reflection/cycle-ledger.md`：blueprint 与 reality 的对应账。
- `references/reflection/cases/`：一次性具体事件。
- `references/reflection/patterns/`：重复出现的模式。

#### 规划区候选模块材料

以下文档仍有价值，但不属于当前执行三件套；后续应吸收进总 PRD、规划区或归档区：

硬规则：规划区中即使文件名包含 `prd`、`plan` 或 `todo`，也只是背景、候选或历史设计材料；只有内容进入 `references/working/prd.md`、`references/working/plan.md`、`references/working/to-do list.md` 后，才拥有当前执行权。

- `references/planning/skill-admission-system-prd.md`：Skill 准入与 Agent 路由设计。
- `references/planning/experience-validation-system-prd.md`：原始经验采集、复盘和验证设计。
- `references/planning/content-intent-demand-policy-prd.md`：内容创作意图、需求来源和公开边界。

### 6.3 历史参考

以下文件只作表达、图式、经验提炼或历史追溯，不作为当前状态依据：

- `docs/archive/references/2026-05-30-ai-era-idea-co-creation-architecture-design.md`
- `docs/archive/references/architecture-expression-patterns.md`
- `docs/archive/references/invite-identity-understanding-prd.md`
- `docs/archive/references/invite-identity-profile-context-prd.md`
- `docs/archive/references/prd-backlog-current-state.md`
- `docs/archive/references/user-demand-integrated-prd.md`
- `docs/AI赋能/`
- `docs/archive/references/legacy-docs-extracted-value.md`
- `docs/archive/references/completed-execution-summary-2026-06.md`

### 6.4 归档规则

旧 PRD、旧架构设计、旧 Agent 规划和历史讨论统一归档到 `docs/archive/`。

当前有效文档只保留在 `walker-northstar/references/`；完成、过期或被替代后再移回 `docs/archive/`。

归档文档只用于追溯“当时怎么想”，不再作为当前决策依据。当前判断以本文件为准。
---

## 2026-06-11 Update

Archived completed cycle:

- `docs/archive/references/user-demand-loop-goal-2026-06-10-completed.md`: 用户需求闭环第一轮落地 goal，已完成。
- `docs/archive/reports/hai-tdd-report-2026-06-10.md`: 上轮 TDD 证据报告。
- `docs/archive/reports/architecture-tdd-report-2026-06-10.html`: 上轮架构与 TDD 可视化报告。
- `docs/archive/references/invite-identity-understanding-prd.md`: 邀请制身份入口旧 PRD，已被总 PRD + Phase 1 plan/to-do list 取代。
- `docs/archive/references/invite-identity-profile-context-prd.md`: 邀请码通过到画像上下文的旧专项 PRD，已被总 PRD + Phase 1 plan/to-do list 吸收。
- `docs/archive/references/prd-backlog-current-state.md`: 上一轮 PRD backlog 判断，已失去当前入口地位。
- `docs/archive/references/user-demand-integrated-prd.md`: 用户需求闭环整合旧 PRD，保留作历史参考。


