# To-do: 剩余任务总账（2026-06-16 更新）

上游: `prd.md`（U1-U15 + U17）。**范围限定个人站**（AdgaiWalker / iwalk.pro）。U16（Publish Interface 发布到社区）+ U18（NorthStar 社区网络）出局。

## 已完成（不在此列）

- U1 邀请认证画像 / U2 需求闭环 / U4 内容创作闭环 —— PR #9 ✅
- 六模块 Perception / Memory / Orchestration —— PR #10 ✅
- U13 graph.json + AI-0 过滤 —— PR #11 ✅
- U3 MCP AI-0 + walker_insights 白名单 —— PR #12 ✅
- U5 编辑器保存前字段校验 —— PR #13 ✅
- U6 内容宇宙网格/列表视图切换 —— PR #14 ✅
- U7 搜索无结果记录 + admin 搜索缺口 panel —— PR #15 ✅
- U8 Safety admin（incidents API + 页）—— PR #16 ✅
- U9 RuleCandidate 模型+store+API / U10 ExperienceEvent 模型+store+采集 API / U11 SkillCandidate 模型 —— PR #17 ✅
- U13 llms.txt 过滤 AI-0 —— PR #18 ✅
- U17 cycles 可回放链路 README —— PR #20 ✅

## 优先级原则

```text
P0 = 安全边界收口 + Agent 六模块完成（防御 + 核心）
P1 = 用户体验硬伤 + 数据闭环完善
P2 = 扩展能力（AI 接口 / MCP / 经验 / Skill）
```

每项改动统一验收：`npx astro check` 0 errors + `npm run build` Complete +（可测则补测试）；不写兼容代码；中文；代码走 PR。

---

## P0 — 安全收口 + Agent 核心

### U3 数据边界（收尾，小）

**状态**：PR #12 merged。本会话已审查 gateway logs 安全 + 前端无 env key，U3 §8.3 全满足。

**剩余**：系统性边界回归测试（可选，ROI 低 —— MCP stdio 难集成测）。

### U8 Agent 六模块剩余（Tools / Observability）

**状态**：PR #10 merged Perception/Memory/Orchestration。PR #16 merged Safety admin（incidents API + /admin/incidents 页）。

**剩余**：
- **Tools**：每个工具声明输入 / 输出 / 权限 / 失败返回 / 是否可重试 / 是否写数据
- **Observability**：字段白名单测试（gateway logs 已审查安全，insights 白名单 #12 已做）

**模块衔接**：Observability 和 U3 重叠（已审查确认）。

---

## P1 — 体验 + 数据闭环

### U6 内容宇宙 UI/UX（大）

**状态**：PR #14 merged（网格/列表视图切换）。

**剩余**：
- 内容卡片视觉体系（form / domain 差异化）
- 生活切片 / 作品展示 / 点子状态卡
- 移动端体验细化
- 更多视图（时间线 / 图集 / 点子流）

### U7 反馈台剩余（中）

**状态**：PR #15 merged（搜索无结果记录 + admin 搜索缺口 panel）。

**剩余**：
- 热门内容（点赞 / 访问排行）
- 内容表现矩阵（每篇 resolved/stuck/反馈数）

### U5 内容治理（收尾，小）

**状态**：PR #13 merged（编辑器保存校验）。

**剩余**：补少量内容的 `updated` 字段（数据，手动）。

---

## P2 — 扩展能力

### U13 AI 接口 v2 剩余（小）

**状态**：#11 merged（graph.json + index.json AI-0）+ #18 merged（llms.txt AI-0）。

**剩余**：`walker-style.md` 半自动维护（可选）。

### U14 MCP 私有验收（小）

**状态**：#12 merged（walker_insights 白名单 + MCP AI-0 过滤）。

**剩余**：真实样本验证；MCP 默认 public 自动测试。

### U15 生产内容写回验收（小）

**状态**：代码层已满足（admin-content-store token 检查 + 错误提示 + 本地降级）。

**剩余**：生产 `GITHUB_TOKEN` 配置 + 生产验收（运维）。

### U9 规则候选池（大）

**状态**：#17 merged（RuleCandidate 模型 + store + admin CRUD API）。

**剩余**：admin 规则池页（SSR）+ 评测页 + 回放评测集。

### U10 经验验证系统（大）

**状态**：#17 merged（ExperienceEvent 模型 + store + 采集 API）。

**剩余**：admin 复盘页（SSR）+ 模式分析（经验事件聚类）。

### U11 Skill 准入与 Agent 路由（大）

**状态**：#17 merged（SkillCandidate 模型）。

**剩余**：admin/注册流程 + 准入判断 + 方法卡。

### U12 内容意图工程化（部分）

**剩余**：需求来源关联 / 公开边界 / AI 边界进完整工作流（编辑页 YAML 已支持字段）。

### U17 Spec Kit 桥接（小）

**状态**：#20 merged（docs/cycles/current/README）。

**剩余**：用一条真实需求跑通 prd→plan→todo→implement→retro 链路。

---

## 出局（非个人站范围）

- **U16 Publish Interface**：发布到社区接口（Transformer/CommunityAdapter）= 非个人站。#19 放弃。
- **U18 NorthStar 社区网络**：独立仓库 `Desktop\NorthStar`。

---

## 推荐执行顺序（个人站范围）

1. **U6 内容宇宙完整**（P1 体验，用户可见，价值最高）
2. **U7 反馈台完整**（P1 数据闭环，热门内容/表现矩阵）
3. **U9/U10/U11 admin 页**（P2，已有数据模型 + API，补 admin SSR 页）
4. **U13/U14/U15 收尾**（P2，小）
5. **U8 Tools/Observability**（P0 收尾）
6. **U17 跑通链路**（流程验证）

---

## 自主决策记录

- **网络**：已恢复（#14-#18/#20 全部 push + merged）。
- **测试策略**：简单逻辑 / Astro 构建时函数 / inline script / MCP stdio 难单测，靠 build + 集成验证。
- **范围**：个人站（U1-U15 + U17）。U16/U18 出局。
