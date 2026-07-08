# Cycle Ledger

Generated: 2026-06-11

Stage: AdgaiWalker 个人系统 / 发布接口桥接

## 目的

本文件用于记录双 Git 模式下每一轮开发的对应关系：

```text
Skill 仓库记录 blueprint。
产品仓库记录 reality。
Cycle Ledger 记录二者如何对应。
```

## 记录规则

每一轮结束时至少记录：

- 轮次名称
- 起止阶段
- Skill 侧变更
- 产品仓库侧变更
- 验证结果
- 复盘结论
- 是否产生 case
- 是否产生 pattern
- 是否需要更新 SKILL.md
- Skill commit
- 产品 commit

没有 commit 时写 `pending`，不要伪造。

## 当前轮次

### 2026-06-14 auth-encounter-topic-full-reality

起始阶段：P2 Reality

当前状态：完成，产品 commit 已推送，PR 已 ready for review

目标：

```text
按 auth-encounter-topic-prd.md 全量完成邀请认证 gate、遭遇画像、需求聚类、选题工作台、创作简报和每篇内容命中率闭环。
```

Skill 侧变更：

- 更新 `references/working/auth-encounter-topic-todo.md`，修正 gate / rate limit 顺序，并写入 Completion Evidence。
- 更新 `references/reflection/execution-log-current.md`，记录全量收口修正与验证结果。
- 更新本 `cycle-ledger.md`，记录 blueprint 与 reality 对应关系。

产品仓库侧变更：

- `src/stores/ports.ts`：NeedCase 顶层补 `sliceInferred`；TopicCandidate 收敛为需求簇模型。
- `src/services/agent-orchestrator.service.ts`：遭遇切片优先读本次问题关键词，personaAnchor 仅作低置信回退。
- `src/agent/insight.ts`：需求聚类按遭遇角色合并，同簇合并并回写 NeedCase `topicCandidateId`。
- `src/conversation/store.ts`：新增 TopicCandidate 查询、clusterKey 查找与状态更新能力，状态更新支持 Redis 与内存降级。
- `src/pages/admin/review.astro`：新增 `?view=clusters` 需求簇视图与 `?view=list` 逐条复盘。
- `src/pages/admin/topics.astro`：按新需求簇模型重写选题池。
- `src/services/brief.service.ts`、`src/pages/admin/brief.astro`、`src/pages/api/admin/brief.ts`、`src/pages/admin/content/edit.astro`、`src/pages/api/admin/content/[slug].ts`：选题簇生成结构化简报，带 `sourceTopicId` 跳编辑器预填参考骨架，并在保存/发布时回写 TopicCandidate 内容关联。
- `src/services/hit-rate.service.ts`、`src/pages/admin/hit-rate.astro`、`src/pages/api/admin/hit-rate.ts`：按已发布内容聚合 resolved/stuck 命中率。
- 新增/扩展测试：profile、agent-orchestrator、insight、brief、hit-rate。

验证结果：

- `npx astro check`：0 errors。
- `npm test`：8 files / 47 tests passed。
- `npm run build`：Complete。
- 浏览器 smoke：`/tools` 邀请码主链路通过；后台 review/topics/hit-rate 页面通过 admin 登录 smoke。

复盘结论：

- 旧的“topic 卡片命中率够用”判断不满足 PRD，需要每篇内容维度。
- TopicCandidate 必须是需求簇模型，不应继续保留旧 audience/coreQuestion/contentAngle/sourceNeedCount 双轨。
- personaAnchor 是身份底色，不是本次遭遇推断成功的证据。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有改变调度规则。

Skill commit：

- pending

产品 commit：

- ac8b286 Complete auth encounter topic loop

### 2026-06-14 walker-northstar-skill-zone-consistency-audit

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
审理 walker-northstar skill 本体区、规划区、工作区、反思区、归档区之间的职责、路径和权威顺序一致性。
```

Skill 侧变更：

- 更新 `SKILL.md`，明确 skill 本体区由 `SKILL.md`、`agents/openai.yaml`、`examples/` 组成。
- 更新 `references/project-docs-index.md`，明确 references 内部冲突、用户即时指令与 SKILL.md 的权威顺序。
- 更新 `references/planning/interaction-protocol.md`，修正旧 protocol / log 路径和冲突处理顺序。
- 更新 `references/planning/ferry-development-protocol.md`，修正 P1/P2/P3 阶段读取文件。
- 更新 `references/planning/adgaiwalker-to-northstar-roadmap.md`，移除对 `*-current-state.md` 的默认假设。
- 更新 `references/current-cycle-state.md` 与 `references/reflection/execution-log-current.md`，记录本轮一致性审理。
- 更新 `docs/README.md` 与部分 `docs/archive/references/` 说明，避免归档区指向已删除旧执行材料。

产品仓库侧变更：

- 无代码变更；仅 `docs/README.md` 和归档说明随 blueprint 治理同步更新。

验证结果：

- `references/` 根目录仍只保留入口文件与分区目录。
- 工作区仍只保留 `README.md`、`prd.md`、`plan.md`、`to-do list.md`。
- 旧路径残留只存在于 historical ledger / archive audit 中，不参与当前决策。

复盘结论：

- `agents/openai.yaml` 和 `examples/` 需要被正式纳入 skill 本体区，否则会被误判为多余目录。
- 当前状态入口应是 `references/current-cycle-state.md`，不要默认寻找已不存在的模块 `*-current-state.md`。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 是，本轮已更新 skill 本体区与 current-state 读取规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 product-user-manual-walkthrough

起始阶段：P2 验收 / 文档沉淀

当前状态：完成

目标：

```text
基于当前 commit 的真实 App 行为，生成面向普通用户的产品说明持续记录，
并沉淀可复用的 App walkthrough / 产品说明生成 Skill。
```

Skill 侧变更：

- 新增 `references/working/product-user-manual.md`
- 新增 `.agents/skills/product-walkthrough/SKILL.md`
- 更新 `references/project-docs-index.md`，登记产品说明持续记录
- 更新 `references/reflection/execution-log-current.md` 与本 ledger

产品仓库侧变更：

- 无代码功能变更
- 新增运行检查产物：`output/playwright/` 截图与 `cdp-page-summary.json`

验证结果：

- 本地 App 启动成功，`http://127.0.0.1:4321/` 返回 200。
- 使用 Playwright + Chromium + CDP 截图并检查公开页、邀请 gate、管理员登录和后台页面。
- 产品说明覆盖主要页面、按钮、入口、状态变化与点击结果。

复盘结论：

- 产品说明应作为当前工作区补充文档保存，并通过版本记录持续追加。
- walkthrough 流程具备可复用性，应独立成 `product-walkthrough` skill。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 是，新增独立 `product-walkthrough` skill，不修改 walker-northstar 调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-11 walker-northstar-artifact-readiness-retrofit

起始阶段：P1 Blueprint

当前状态：进行中

目标：

```text
为 walker-northstar 补齐文档成熟度提醒、交互闸门、双 Git 对账和经验沉淀入口。
```

Skill 侧变更：

- 初始化 `walker-northstar` 本地独立 Git 仓库，当前未提交、未配置远程。
- 新增 `.gitignore`
- 新增 `references/current-cycle-state.md`
- 新增 `references/artifact-readiness-protocol.md`
- 新增 `references/interaction-protocol.md`
- 新增 `references/cycle-ledger.md`
- 新增 `references/cases/README.md`
- 新增 `references/patterns/README.md`
- 更新 `SKILL.md` 读取路由
- 更新 `SKILL.md` 任务规模分级标准：小任务直接做，中任务确认当前状态后做，大任务先走成熟度提醒并等待 Walker 确认

产品仓库侧变更：

- pending

验证结果：

- pending

复盘结论：

- pending

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 是，本轮需要让 `SKILL.md` 知道新增协议文件的读取顺序。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 walker-northstar-old-execution-docs-cleanup

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
删除规划区中已经被 working 三件套替代的旧执行材料，降低当前执行入口噪音。
```

Skill 侧变更：

- 删除 `references/planning/creator-system-current-state.md`
- 删除 `references/planning/demand-intelligence-todo.md`
- 删除 `references/planning/iwalk-agent-system-plan.md`
- 删除 `references/planning/tool-match-agent-to-do-list.md`
- 更新 `references/project-docs-index.md`，移除上述旧执行材料入口

产品仓库侧变更：

- 无代码变更

验证结果：

- 四个旧执行材料文件均已不存在。
- `references/project-docs-index.md` 中已无上述文件入口。
- 全局残留命中仅保留在本 ledger 删除记录中。

复盘结论：

- 旧 plan / todo / current-state 材料不应继续占据规划区入口。
- 当前执行权只落在 `references/working/prd.md`、`references/working/plan.md`、`references/working/to-do list.md`。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮是旧执行材料清理，不改变调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 planning-docs-no-execution-authority

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
明确 planning 中带 prd / plan / todo 名字的文件没有当前执行权，
只有进入 working/prd.md、working/plan.md、working/to-do list.md 后才参与当前执行。
```

Skill 侧变更：

- 更新 `references/planning/README.md`
- 更新 `references/project-docs-index.md`

产品仓库侧变更：

- 无代码变更

验证结果：

- planning README 已写入硬规则
- project docs index 已写入同一条入口规则

复盘结论：

- 文件名不能决定执行权，所在区和是否进入 working 三件套才决定当前执行权。
- 这条规则可以降低旧 PRD、旧 plan、旧 todo 对当前轮的干扰。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮是 planning 区局部权力规则，已由 index 和 planning README 承载。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 working-zone-cycle-package-clarification

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
修正工作区语义：工作区不是死板只能有三个文件，
而是承载当前一轮产出的工作包；prd.md、plan.md、to-do list.md 是核心三件套。
```

Skill 侧变更：

- 更新 `references/working/README.md`
- 更新 `SKILL.md`
- 更新 `references/project-docs-index.md`
- 更新 `references/current-cycle-state.md`

产品仓库侧变更：

- 无代码变更

验证结果：

- 当前工作区仍保持核心三件套命名：`prd.md`、`plan.md`、`to-do list.md`
- 文档规则已允许当前轮补充产物留在工作区，但不得混入长期架构、历史材料、旧 PRD 或旧计划

复盘结论：

- “简单”不是只能有三个文件，而是当前轮的核心入口必须稳定。
- 工作区的边界应是“当前轮工作包”，不是某个固定文件数量。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 已更新。原因：工作区语义影响后续读取与归档规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 working-three-file-contract

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
将工作区简化为 prd.md、plan.md、to-do list.md 三个固定文件，
并明确三件套职责：PRD 承载需求分析、功能设计、架构设计；plan 承载开发规划；to-do list 承载可执行可验收。
```

Skill 侧变更：

- 将 `references/working/unimplemented-blueprint-master-prd.md` 重命名为 `references/working/prd.md`
- 将 `references/working/unimplemented-blueprint-phase1-invited-need-case-plan.md` 重命名为 `references/working/plan.md`
- 将 `references/working/unimplemented-blueprint-phase1-invited-need-case-todo.md` 重命名为 `references/working/to-do list.md`
- 更新 `SKILL.md` 中的工作区读取规则
- 更新 `references/project-docs-index.md` 中的工作区职责定义
- 更新 `references/current-cycle-state.md` 中的当前轮次状态
- 更新 `references/working/README.md` 中的工作区文件约束
- 更新 `references/working/prd.md` 内部对三件套职责和 Spec 映射的描述

产品仓库侧变更：

- 无代码变更

验证结果：

- `references/working/` 除 README 外，只包含 `prd.md`、`plan.md`、`to-do list.md`
- 当前入口引用已指向三个固定文件
- 工作区读取规则不再依赖长文件名或 `*-prd.md` / `*-plan.md` / `*-todo.md` 通配

复盘结论：

- 固定三件套比长文件名更符合 Walker 的工作流，也更适合 AI 后续稳定读取。
- 未来一轮结束时，这三个文件整体归档；下一轮重新生成同名三件套即可。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 已更新。原因：工作区固定文件名和读取规则发生变化。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 references-root-cleanup

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
回应 Walker 对 references 根目录仍然过多文件的反馈，
将根目录瘦身为入口文件 + 分区目录，并把规划/反思材料物理归位。
```

Skill 侧变更：

- 将规划区文件移动到 `references/planning/`
- 将 `cycle-ledger.md`、`execution-log-current.md` 移动到 `references/reflection/`
- 将 `cases/`、`patterns/` 移动到 `references/reflection/`
- 保留 `references/project-docs-index.md` 与 `references/current-cycle-state.md` 作为根目录入口文件
- 更新 `SKILL.md` 中的读取路径：规划材料走 `references/planning/`，反思材料走 `references/reflection/`
- 更新 `references/project-docs-index.md` 中的四区归属路径
- 更新 `references/current-cycle-state.md`，同步根目录瘦身状态
- 更新 `references/planning/README.md` 与 `references/reflection/README.md`

产品仓库侧变更：

- 无代码变更

验证结果：

- `references/` 根目录只剩 `project-docs-index.md`、`current-cycle-state.md`、`planning/`、`working/`、`reflection/`
- 当前入口文件未发现指向已移动根目录文件的旧路径
- `references/planning/` 当前包含 24 个文件
- `references/working/` 当前包含 README + PRD / plan / to-do list
- `references/reflection/` 当前包含 README、cycle ledger、execution log、cases、patterns

复盘结论：

- 第一刀只迁移 working 后，视觉上仍然像“很多文件”，不符合 Walker 对工作台清爽度的要求。
- 当前更合适的状态是：根目录只做入口，真实材料都进入分区目录。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 已更新。原因：规划区和反思区物理路径发生变化，调度规则必须同步。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 working-zone-physical-slice

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把五层 / 四区文档治理从规则推进到第一步物理结构：
创建当前工作区目录，并把当前 Phase 1 PRD / plan / to-do list 三件套迁入 working。
```

Skill 侧变更：

- 新增 `references/working/README.md`
- 新增 `references/planning/README.md`
- 新增 `references/reflection/README.md`
- 移动 `references/unimplemented-blueprint-master-prd.md` 到 `references/working/unimplemented-blueprint-master-prd.md`
- 移动 `references/unimplemented-blueprint-phase1-invited-need-case-plan.md` 到 `references/working/unimplemented-blueprint-phase1-invited-need-case-plan.md`
- 移动 `references/unimplemented-blueprint-phase1-invited-need-case-todo.md` 到 `references/working/unimplemented-blueprint-phase1-invited-need-case-todo.md`
- 更新 `SKILL.md`，让“开始 / 继续 / 执行 / 实现”优先读取 `references/working/*-plan.md` 和 `references/working/*-todo.md`
- 更新 `references/project-docs-index.md`，把当前执行入口和工作区三件套路径改为 `references/working/`
- 更新 `references/current-cycle-state.md`，同步当前文档治理与 Phase 1 工作区状态

产品仓库侧变更：

- 无代码变更

验证结果：

- 已确认 `references/working/` 中包含当前 PRD / plan / to-do list 三件套。
- 已确认当前 index 与三件套内部引用指向 `references/working/`。
- 已确认当前根 `references/` 中不再存在 `unimplemented-blueprint-*.md` 三件套。

复盘结论：

- 先迁移 working 是正确的第一刀：它让当前执行权变清楚，同时避免一次性移动规划和反思材料导致引用混乱。
- 规划区和反思区先建立 README 入口，等下一轮稳定后再迁移具体文件。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 已更新。原因：当前执行三件套的物理路径已从 `references/` 根目录变为 `references/working/`。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 five-layer-four-zone-doc-governance

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把 Walker 的文档流转明确为 SKILL 调度层 + 规划区 / 工作区 / 反思区 / 归档区，
并把一轮开发流程固化为背景理解 -> 需求分析 -> 功能设计 -> 架构设计 -> PRD -> plan -> to-do list -> 执行 -> 反思 -> 归档。
```

Skill 侧变更：

- 更新 `SKILL.md`，明确 skill 本身是调度层，不是资料库
- 更新 `references/project-docs-index.md`，加入五层 / 四区模型
- 更新 `references/project-docs-index.md`，写入标准工作流
- 更新 `references/project-docs-index.md`，写入当前执行区只认 PRD / plan / to-do list
- 更新 `references/project-docs-index.md`，写入反思区四个问题和 case -> pattern -> rule candidate 晋升路径
- 更新 `references/project-docs-index.md`，按四区列出现有文件归属
- 明确归档区按“一轮工作包”归档到 `docs/archive/cycles/YYYY-MM-DD-topic/`

产品仓库侧变更：

- 无代码变更

验证结果：

- 已检查 `SKILL.md` 只新增调度层规则，没有塞入 PRD、plan、todo 或长期架构细节。
- 已检查 `project-docs-index.md` 已包含 skill、规划区、工作区、反思区、归档区的职责和读取顺序。

复盘结论：

- 四区不是普通文件分类，而是文档权力系统：规划区有边界权，工作区有执行权，反思区有学习权，归档区只有追溯权。
- 反思区第一版不需要复杂化，只需要回答“做成什么、哪里偏了、下次改哪条规则、哪些回流下一轮”。
- 当前阶段先确立规则，不做大规模物理搬目录。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 已更新。原因：本轮明确改变了 AI 读取文档和判断当前执行权的调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 current-execution-doc-types-prd-plan-todo

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把当前执行区的文档身份收敛为 PRD、plan、to-do list 三类；
不再把 goal 作为当前执行区独立文档类型，原 goal 内容归入 to-do list。
```

Skill 侧变更：

- 将 `references/unimplemented-blueprint-phase1-invited-need-case-goal.md` 重命名为 `references/unimplemented-blueprint-phase1-invited-need-case-todo.md`
- 更新 `references/unimplemented-blueprint-master-prd.md`，加入当前执行区文档身份规则
- 更新 `references/unimplemented-blueprint-phase1-invited-need-case-plan.md`，改为引用 Phase 1 to-do list
- 更新 `references/project-docs-index.md`，移除当前区的 goal 入口和不存在的 `user-demand-loop-goal.md` 当前入口

产品仓库侧变更：

- 无代码变更

验证结果：

- 已检查 `references/` 当前文件名，当前 Phase 1 执行文档只保留 PRD、plan、to-do list 三件套。
- 已检查当前索引和 PRD/plan 引用，当前入口不再引用 Phase 1 goal 文件。

复盘结论：

- goal 更像“为什么值得做”和“完成后算什么”，在当前执行区会和 PRD、plan 发生职责重叠。
- 后续执行区用 to-do list 承载完成定义、验收证据、停止条件和具体任务，更利于直接推进 reality。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 暂不更新；先作为本轮文档治理决策沉淀在 index、PRD 和 ledger。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 references-archive-pass-1

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把已经被总 PRD 和 Phase 1 goal/plan 吸收的旧专项文档从 `references/`
归档到项目 `docs/archive/references/`，避免继续被当成当前入口读取。
```

Skill 侧变更：

- 更新 `references/project-docs-index.md`
- 从“当前设计与任务文档”中移除：
  - `invite-identity-understanding-prd.md`
  - `user-demand-integrated-prd.md`
- 将以下文件标记为历史参考：
  - `docs/archive/references/invite-identity-understanding-prd.md`
  - `docs/archive/references/invite-identity-profile-context-prd.md`
  - `docs/archive/references/prd-backlog-current-state.md`
  - `docs/archive/references/user-demand-integrated-prd.md`

产品仓库侧变更：

- 新增归档文件到 `docs/archive/references/`
- 无产品代码变更

验证结果：

- 待通过文件存在性和索引引用检查确认

复盘结论：

- 当前 `references/` 应继续收缩，只保留真正会被下一轮执行直接读取的文档。
- 这次先归档“已被总 PRD 和 Phase 1 文档吸收”的一组，未处理的旧 Agent 计划类文档留作下一轮审查。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 no-compatibility-code-need-case

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
记录 Walker 明确决策：Need Case 直接取代 DemandEvent 主业务地位，
实现时不写兼容代码、不做双写、不保留长期双轨。
```

Skill 侧变更：

- 更新 `references/unimplemented-blueprint-master-prd.md`
- 更新 `references/unimplemented-blueprint-phase1-invited-need-case-plan.md`
- 更新 `references/unimplemented-blueprint-phase1-invited-need-case-goal.md`
- 明确：
  - 不写兼容 shim
  - 不做 Need Case / DemandEvent 双写
  - 不保留两套后台主数据源
  - 如果旧代码依赖 DemandEvent，就直接改调用方

产品仓库侧变更：

- 无代码变更

验证结果：

- 已清理 goal 中残留的“关系待定”表述。

复盘结论：

- 后续实现将更陡，但模型更干净。
- 如果执行中必须依赖兼容层才能推进，应暂停并回到模型边界，而不是让错误模型固化。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 phase1-invited-need-case-goal

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把 Phase 1 纵向切片从 plan 提升为 goal document，
在执行前固定目标、边界、阶段规则、proof 和 stop condition。
```

Skill 侧变更：

- 新增 `references/unimplemented-blueprint-phase1-invited-need-case-goal.md`
- 更新 `references/project-docs-index.md`，加入该 goal document
- 更新 `references/unimplemented-blueprint-master-prd.md`，在 Phase 1 下引用 goal document
- 更新 `references/unimplemented-blueprint-phase1-invited-need-case-plan.md`，引用 goal document

产品仓库侧变更：

- 无代码变更

验证结果：

- pending

复盘结论：

- 总 PRD 继续作为唯一入口，但 Phase 1 现在具备 goal + plan 两层执行文档。
- 当前最关键未决项被压缩为一个：`DemandEvent` 与 `Need Case` 的关系。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 phase1-invited-need-case-plan

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
在不拆分新 PRD 的前提下，为总 PRD 补充 Phase 1 执行计划和 todo，
聚焦 Invited User -> Need Case -> Agent Recommendation -> User Feedback -> Admin Review 纵向切片。
```

Skill 侧变更：

- 新增 `references/unimplemented-blueprint-phase1-invited-need-case-plan.md`
- 更新 `references/project-docs-index.md`，把 Phase 1 plan 加入当前设计与任务文档入口
- 更新 `references/unimplemented-blueprint-master-prd.md`，在 Phase 1 中引用该 plan

产品仓库侧变更：

- 无代码变更

验证结果：

- pending

复盘结论：

- 保持一个总 PRD，但允许在其下挂 plan/todo，避免执行时被 U1-U18 总表淹没。
- 第一刀只证明邀请用户的真实需求能进入 Need Case，并在后台被复盘。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 single-master-prd-decision

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
记录 Walker 明确决策：不拆分新的平级执行 PRD，
就按 `unimplemented-blueprint-master-prd.md` 作为总入口推进。
```

Skill 侧变更：

- 更新 `references/unimplemented-blueprint-master-prd.md`
- 新增 `3.1 PRD 边界决策`
- 在 Phase 0 中加入“不拆分新的平级执行 PRD”
- 将“不拆分”写入已确认决策

产品仓库侧变更：

- 无代码变更

验证结果：

- pending

复盘结论：

- 当前保持一个总 PRD，避免再次形成多 PRD 分散。
- 后续细化只补 architecture / plan / todo / execution log，不另开当前同级 PRD。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 core-module-dependency-architecture

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
根据全量 PRD 产出架构师视角的核心模块、模块关系和依赖倒置方案，
明确业务服务依赖 Port，而不是依赖具体实现。
```

Skill 侧变更：

- 更新 `references/unimplemented-blueprint-master-prd.md`
- 新增 `4.6 核心模块与依赖倒置架构`
- 列出 Invite Access、Authz Policy、User Profile、User Context、Need Case、Conversation Intake、Agent Orchestrator、Need Matching、Tool Execution、Memory、Safety Layer、Feedback、Admin Review、Topic Candidate、Content Work、Experience Validation、Skill Admission、Observability、Publish Interface 等核心模块
- 用“依赖 / 调用 / 触发 / 实现”标注模块间关系
- 明确第一轮最小架构切片：`/api/invite/verify`、`/api/profile`、`/api/match`、`/admin/review`
- 更新 Phase 0 和 Phase 5，加入核心模块与 Port 契约确认

产品仓库侧变更：

- 无代码变更

验证结果：

- pending

复盘结论：

- 后续实现应避免按页面或数据库表拆分。
- `/api/match` 不应继续增长业务逻辑，应收敛为调用 `AgentOrchestrator.handleNeed()` 的入口层。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 agent-application-layering-and-safety

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把 Agent 应用的业务层、工具层、记忆层、编排层、安全层和观测层写入未完成蓝图总 PRD，
并明确安全层的含义是环节出错后的降级、回滚、记录、提醒和交给人。
```

Skill 侧变更：

- 更新 `references/unimplemented-blueprint-master-prd.md`
- 新增 `4.5 Agent 应用分层`
- 将 U8 从“Agent 六模块边界迁移”调整为“Agent 应用分层与安全层迁移”
- 新增安全层失败处理矩阵，覆盖邀请码错误、画像保存失败、AI 调用失败、工具匹配失败、需求事件保存失败、内容写回失败、权限不确定、敏感信息、低置信度和连续失败
- 更新 Phase 5 和总验收标准，要求关键失败场景都有降级、记录和交给人的处理方式

产品仓库侧变更：

- 无代码变更

验证结果：

- pending

复盘结论：

- 安全层不是单纯内容安全，而是 Agent 应用的故障吸收层。
- 失败状态应进入后台复盘，成为修规则、补内容、改工具和做选题的信号。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 invitation-only-user-definition

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
明确“用户”不是泛指访客，而是被 Walker 邀请并通过邀请码准入的人。
```

Skill 侧变更：

- 更新 `references/unimplemented-blueprint-master-prd.md`
- 将认证状态统一为：
  - `public` = 访客，还不是用户
  - `invited` = 已通过邀请码的用户
  - `admin` = 管理员
- 明确邀请码是成为用户的唯一入口
- 明确未通过邀请码的人不能访问用户授权功能
- 明确邀请制身份不是完整社区账号系统

产品仓库侧变更：

- 无代码变更

验证结果：

- 已搜索并修正“普通用户”等容易混淆的表述。

复盘结论：

- 后续实现应避免开放注册模型，先做邀请制准入与轻量会话。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 creator-demand-management-reframe

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
根据 Walker 对原始产品意图的补充，把未完成蓝图总 PRD 从“模块总账”
重构为“用户端到管理端的创作者需求管理系统”叙事。
```

Skill 侧变更：

- 更新 `references/unimplemented-blueprint-master-prd.md`
- 将最高层产品主线明确为：
  - 用户端认证状态与授权功能
  - 管理员文章编辑和实时管理
  - 用户需求调查、需求匹配工具和 AI 聊天分析
  - 原始信息前期积累、阶段性分析和标准沉淀
  - 从选题到作品交付的创作者闭环
  - Agent 系统作为分析、匹配、复盘和沉淀的编排层
- 将 U1 从“邀请制身份画像上下文”修正为“用户认证授权与身份画像上下文”
- 将实施顺序修正为先做认证授权底座，再做用户需求匹配与后台复盘闭环

产品仓库侧变更：

- 无代码变更

验证结果：

- 已检查 PRD 顶层主线与 Phase 顺序更新。

复盘结论：

- 原先 U1-U18 清单适合做覆盖账本，但不足以表达产品主线。
- 当前应把所有模块挂到“用户端 -> 管理端 -> Agent -> 内容交付”的闭环上。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending

### 2026-06-14 unimplemented-blueprint-master-prd

起始阶段：P1 Blueprint

当前状态：完成

目标：

```text
把当前 blueprint 中仍未完成、部分完成但未闭环、已有骨架但未验收的模块收拢成一个总 PRD，
作为后续开发排期和验收的统一入口。
```

Skill 侧变更：

- 新增 `references/unimplemented-blueprint-master-prd.md`
- 更新 `references/project-docs-index.md`，把该 PRD 加入当前设计与任务文档入口
- 更新 `references/cycle-ledger.md` 记录本轮 blueprint/reality 对应关系

产品仓库侧变更：

- 无代码变更

验证结果：

- pending

复盘结论：

- 该 PRD 用于统一未完成模块总账，不代表任何 reality 功能已经实现。
- 下一轮建议从 `Phase 1: 邀请身份画像上下文` 开始，因为它直接承接已完成的邀请码 P0 骨架。

case：

- pending

pattern：

- pending

是否需要更新 SKILL.md：

- 否，本轮没有修改调度规则。

Skill commit：

- pending

产品 commit：

- pending
