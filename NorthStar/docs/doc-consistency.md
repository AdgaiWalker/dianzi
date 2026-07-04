# 文档一致性修复状态

> 更新日期：2026-05-20
> 适用范围：`README.md`、`AGENTS.md`、`CLAUDE.md`、`specs/`、`NorthStar/docs/`
> 原则：以代码为真，合同优先，安全默认收紧。

## 当前结论

- **结论**：通过
- **本轮清单**：46/46 已处理
- **处理顺序**：P0 → P1 → P2 → P3
- **当前权威文档**：`.specify/memory/constitution.md`、`specs/MISSION.md`、两份 PRD、`specs/架构设计.md`、`specs/全球specs.md`
- **当前执行文档**：`specs/architecture-gaps.md`、`specs/计划方案.md`

## 本轮修复摘要

| 严重级别 | 数量 | 状态 | 主要修复 |
|----------|------|------|----------|
| P0 | 4 | 已完成 | 修正 `specs/全球specs.md` 的服务端目录、认证 API、AI API；修正 `specs/架构设计.md` 的 Campus 数据模型 |
| P1 | 11 | 已完成 | 修正互动/方案/收藏/用户 API 路径、删除不存在模型说明、修复 `.gitignore` 密钥忽略、统一文档层级和 cwd 约定 |
| P2 | 16 | 已完成 | 补全 admin-console 命令、数据库维护命令、管理端导航/API、frontai 路径别名和实际 store 结构 |
| P3 | 15 | 已完成 | 修正项目树、PRD 版本、根目录名、服务入口、模块文件、DOMAIN_MAP 路径和 GAP-01 描述 |

## 当前统一口径

| 领域 | 当前统一口径 |
|------|--------------|
| 服务端结构 | `NorthStar/packages/server/src/app.ts` 定义 Hono 应用，`index.ts` 启动 Node.js 进程；路由集中在 `src/modules/*/routes.ts` |
| 认证 API | 当前入口为 `/api/identity/*`；不提供 SMS 主注册和旧 `/api/auth/*` |
| AI API | 当前入口为 `/api/ai-gateway/chat`、`/api/ai-gateway/health`、`/api/ai-gateway/logs` |
| 全球站 API | 内容、互动、收藏、方案均走 `/api/compass/*` |
| 平台 API | `/api/platform/capabilities` 与 `/api/platform/feature-flags`；无 `/api/platform/quota` |
| 校园数据模型 | 知识库为 `knowledge_bases`，文章为 `articles`，反馈为 `feedbacks`；字段以 Drizzle schema 为准 |
| 管理后台 | 导航与 `admin-console/src/App.tsx` 保持一致：总览、审核队列、用户管理、内容管理、合规处理、审计日志、通知投递、功能开关、系统配置、数据中心、支付管理 |
| 环境变量安全 | `.env`、`.env.local`、`.env.*.local`、`*.local.json` 均被 `.gitignore` 忽略 |

## 后续维护规则

1. 新增能力先更新 shared 契约或服务端路由，再同步 README/AGENTS/CLAUDE 中的开发入口。
2. API 文档必须写当前可调用路径；未实现能力只能标注“待实现”，不得给出伪端点。
3. 数据模型字段以 `NorthStar/packages/server/src/db/schema.ts` 为准。
4. 修改 Vite、测试、数据库维护命令后，同步检查 README、AGENTS、CLAUDE 三份入口文档。
5. 任何涉及 API key、环境变量、mock、旧路径、数据库字段、测试数量的描述都必须重新核对代码后再写入。
