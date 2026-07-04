# 架构差距当前核对清单

> 日期：2026-05-17  
> 基准文档：`specs/架构设计.md`（最终裁定主文档）  
> 涉及范围：server / frontai-web / frontlife-web / admin-console / shared  
> 核对原则：以当前代码为真，已落地能力不再列为“缺失”。

---

## 已核实完成

| 原 GAP | 当前状态 | 代码证据 |
|--------|----------|----------|
| GAP-01 旧 AI 路由清理 | 已完成，旧 `server/src/routes/*.ts` 路由已迁移至 `modules/` 命名空间 | `server/src/app.ts` 挂载 `aiGatewayRoute` 等模块路由，前端调用 `/api/ai-gateway/chat` |
| GAP-02 insights 独立命名空间 | 已完成 | `server/src/modules/insights/routes.ts` 提供 `/api/insights/*`，`server/src/index.ts` 已挂载 |
| GAP-04 全球站通知类型 | 已完成 | `server/src/db/schema.ts` 的 `notifyTypeEnum` 已包含 `application_result`、`invite_code`、`solution_feedback`、`content_review_result`、`quota_billing_notice` |
| GAP-05 跨站自然转化触点 | 已完成/已决策 | 校园站已有两个低权重入口；第三触点经评估不做 |
| GAP-07 compass profile 更新 API | 已完成 | `PATCH /api/identity/compass-profile` 已实现，全球站 ProfileTab 已接入 |
| GAP-08 用户统计 API | 已完成 | `GET /api/compass/my-stats` 已实现 |
| GAP-09 `/topics` | 已完成 | `frontai-web/src/routes.tsx` 已挂载 `TopicsPage` |
| GAP-10 `/topics/:id` | 已完成 | `frontai-web/src/routes.tsx` 已挂载 `TopicDetailPage` |
| GAP-11 `/articles` | 已完成 | `frontai-web/src/routes.tsx` 已挂载 `ArticlesPage` |
| GAP-12 `/news/:id` | 已完成 | `frontai-web/src/routes.tsx` 已挂载 `NewsDetailPage`，后端提供 `GET /api/compass/news/:id` |
| GAP-14 互动系统 | 已完成 | `ContentInteractions` 已接入 like/comment API |
| GAP-18 个人资料编辑 | 已完成 | `ProfileTab` 调用 `identityApi.updateCompassProfile` 并提供保存按钮 |
| GAP-19 账号注销 UI | 已完成 | 全球站 SettingsTab 已启用注销确认与请求，admin-console 合规页可审批 |
| GAP-21 全球站通知中心 | 已完成 | `NotificationsTab` 已接入通知收件箱 |
| GAP-22 全球站到校园站入口 | 已完成 | `AppLayout` 页脚包含“校园站”链接 |
| GAP-23 工具沉浸式展示 | 已部分完成 | `ToolDetailPage` 支持 screenshots 展示与互动组件 |
| GAP-24 专题封面卡片 | 已完成 | `TopicCard` / `TopicsPage` / `TopicDetailPage` 使用 `coverUrl` |
| GAP-25 全球站行为分析上报 | 已部分完成 | `frontai-web/src/services/analyticsService.ts` 已提供 `trackCompassEvent` |
| GAP-27 ContentVersion 模型 | 已完成 | `content_versions` 表已存在，创建/更新内容时保留版本 |
| GAP-29 校园站行为分析上报 | 已部分完成 | `frontlife-web` 已接入 `trackCampusEvent` |
| GAP-30 校园站通知 UI | 已完成 | Header 铃铛 + ProfilePage 通知列表 + notification API |
| GAP-31 内容创建/编辑表单 | 已完成 | `ContentStudioPage` / `ContentStudioEditPage` 已存在 |
| GAP-32 用户账号启停 | 已完成 | `PATCH /api/admin/users/:id/status` 已实现 |
| GAP-33 数据导出触发 | 已完成 | 前台合规导出 API 已接入，后台合规页处理注销；后台导出入口需按运营需要验收 |
| GAP-34 协议/隐私版本管理 | 已完成 | `legal_documents` 表与合规 API 已存在 |
| GAP-36 需求洞察工作台 | 已部分完成 | `AnalyticsPage` 已有 insights / quality / ai-cost 标签页，后端 `insights` 模块已存在 |
| GAP-37 search refresh | 已完成 | `pnpm search:refresh` 已存在 |
| GAP-38 admin typecheck | 已完成 | `admin-console` 有 `pnpm typecheck` |
| GAP-39 行为数据 90 天清理 | 已完成 | `server/src/index.ts` 启动后定时执行清理 |
| R3-1 生产级邮件 Provider | 已完成 | `email-provider.ts` 已支持 SMTP 环境变量和 dev fallback |
| R3-3 Moderation 任务去重 | 已完成 | `moderation/repository.ts` 创建 pending 任务前做去重检查 |

---

## 仍需确认或补齐

### 1. 校园搜索响应字段命名需统一

- **现状**: shared 契约中存在 `CampusSearchMode = 'exact' | 'partial' | 'empty'`；架构差距旧文档写的是 `matchStatus: "exact" | "partial" | "none"`。
- **风险**: 命名不一致会让前后端和文档出现二次分叉。
- **建议**: 以 `campus-contract.ts` 为准，将架构/PRD 中的 `matchStatus` 统一为 `mode`，或在 API 层显式兼容并文档化。

### 2. 专项 smoke 测试覆盖需验收

- **现状**: 仓库已有 server/frontai/frontlife/admin 多处 Vitest 测试，但架构要求的专项 smoke 列表仍需逐项映射。
- **建议**: 建立 smoke 覆盖矩阵，至少覆盖 cn/com 数据隔离、无 AI key fallback、额度不足、失效 token、空数据态、断 server。

### 3. 已完成能力需要端到端验收

- **现状**: 大量原 GAP 已在代码中落地，但仍需要真实浏览器或 API 级验收。
- **建议**: 按 `specs/计划方案.md` 的验证阶段逐项标记“已实现 / 已验证 / 需修复”，避免把实现完成误写成生产通过。

---

## 当前汇总

| 类型 | 数量 | 说明 |
|------|------|------|
| 已完成或已决策 | 31 | 旧清单中大多数“缺失”已由当前代码补齐 |
| 需确认/验收 | 3 | 搜索字段命名、专项 smoke、端到端验收 |
| P0 架构原则违反 | 0 | 旧 AI 路由和 insights 命名空间问题均已解决 |

---

## 后续处理建议

1. 将本文件作为“当前核对清单”，不要再用旧的 35 项缺口数量作为排期基线。
2. 新增任务文档前先核对 `specs/计划方案.md`，只记录“需确认/验收”和真实未完成项。
3. 每完成一个验收项，在本文件同步从“需确认”迁移到“已核实完成”。
