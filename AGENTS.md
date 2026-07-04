# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Architecture

pnpm workspace monorepo at `NorthStar/`，全栈 TypeScript：

- **前端**：React + Tailwind CSS + TypeScript
- **后端**：Hono + Drizzle ORM + PostgreSQL
- **包管理**：pnpm

双前端 + 管理后台 + 单后端：

- **校园站** `frontlife-web`（xyzidea.cn）→ localhost:3001
- **全球站** `frontai-web`（xyzidea.com）→ localhost:3000
- **管理后台** `admin-console` → localhost:3002
- **共享包** `shared`（`@ns/shared`）— 纯 TS，无 React/UI 依赖
- **后端** `server`（`@ns/server`）→ localhost:4000

后端通过 `SITE=cn|com` 环境变量切换站点行为。开发环境三个前端通过 Vite proxy 连接后端；生产环境已按 Railway + Vercel / Docker 多阶段构建准备独立部署。两站共享统一账号（`accounts` 表）和账号级等级，但产品 profile 和行为数据按站点隔离。

当前目标架构主文档：`specs/架构设计.md`。该文档裁定统一账号、账号级 LV 两站共享、产品 profile 与知识库分离。

## Document Hierarchy

```
宪法（五条公理）→ 使命（specs/MISSION.md）→ PRD → 实现规格
```

- 宪法：`.specify/memory/constitution.md`（最高约束）
- 校园站 PRD：`specs/PRD-盘根校园-v9.md`
- 全球站 PRD：`specs/PRD-盘根AI指南针-标准版.md`
- 目标架构：`specs/架构设计.md`
- 全球站实现规格：`specs/全球specs.md`
- 冲突时以上层为准

## Commands

```bash
cd NorthStar && pnpm install                    # 安装依赖

# 校园站
cd NorthStar/packages/frontlife-web && pnpm dev  # localhost:3001

# 全球站
cd NorthStar/packages/frontai-web && pnpm dev    # localhost:3000

# 管理后台
cd NorthStar/packages/admin-console && pnpm dev  # localhost:3002

# 后端
cd NorthStar/packages/server && pnpm start       # localhost:4000

# 类型检查
cd NorthStar/packages/frontlife-web && npx tsc --noEmit
cd NorthStar/packages/frontai-web && npx tsc --noEmit
cd NorthStar/packages/admin-console && pnpm typecheck
cd NorthStar/packages/server && npx tsc --noEmit

# 测试
cd NorthStar/packages/server && npx vitest run
cd NorthStar/packages/frontai-web && npx vitest run
cd NorthStar/packages/frontlife-web && npx vitest run
cd NorthStar/packages/admin-console && npx vitest run

# 数据库/维护命令
cd NorthStar/packages/server && pnpm db:push
cd NorthStar/packages/server && pnpm db:seed
cd NorthStar/packages/server && pnpm search:refresh
cd NorthStar/packages/server && pnpm clean:analytics

# 缓存清理（修改 Vite 配置或安装新依赖后）
rm -rf NorthStar/packages/frontlife-web/node_modules/.vite
rm -rf NorthStar/packages/frontai-web/node_modules/.vite
rm -rf NorthStar/packages/admin-console/node_modules/.vite
```

### AI Local Config

AI 通过后端网关代理调用智谱 API。配置只在后端环境变量中保存，前端不持有 key：

```dotenv
AI_API_KEY=your-key
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

两站统一调用后端 `/api/ai-gateway/chat`。`.env`、`.env.*.local`、`*.local.json` 已在 `.gitignore`，勿提交密钥。

## Key Patterns

### 校园站（frontlife-web）

- **拆分 Zustand store**：useSearchStore（搜索）、useSpaceStore（空间/内容）、useUserStore（用户/认证）、useUIStore（UI 状态）
- **混合路由 + overlay 模式**：react-router-dom 页面路由 + SearchOverlay 等 overlay 由 useUIStore 控制
- **移动端优先**：BottomNav 是 `md:hidden`，Header tabs 是 `hidden md:flex`
- **路径别名**：`@/` → `src/`
- **Tailwind 自定义 token**：颜色（sage 主色、ink 文字、amber 警告、rose）、间距（nav-h 56px、bottom-nav-h 60px、content-max 960px、reader-max 720px）
- **内容渲染**：react-markdown + rehype，自定义 CodeBlock / ImageRenderer / Callout 组件
- **数据模式**：前端直接请求 `/api`，由 Vite proxy 转发到 server；如需连接非默认后端，使用 `VITE_API_BASE_URL`

### 全球站（frontai-web）

- **单 Zustand store**（`useAppStore`）：全局状态 + 认证 + 收藏 + 主题
- **路径别名**：`@/` → `src/`
- **AI 服务**：`services/AIService.ts` 通过后端 AI 网关（`/api/ai-gateway/chat`）代理调用智谱 Chat API，支持 function calling；失败时回退到 `aiFallback.ts` 的关键词匹配
- **返回结构**：所有 AI 调用返回 `mode: 'ai' | 'demo'` + `fallbackReason`

### 管理后台（admin-console）

- 独立 React 应用，基于 `useApiResource` hook 统一数据加载
- 通过 `/api` 代理连接后端

### 共享包（@ns/shared）

核心类型与契约（`shared/src/index.ts` 导出 24 个模块）：

- **类型**: `types.ts` — Domain / Tool / Article / Topic / User / ContentType 等
- **契约**: `identity-contract.ts` / `compass-contract.ts` / `campus-contract.ts` / `platform-contract.ts` / `billing-contract.ts` / `compliance-contract.ts` / `moderation-contract.ts` / `notification-contract.ts` / `analytics-contract.ts` / `insights-contract.ts` / `admin-contract.ts` / `search-contract.ts` / `news-contract.ts`
- **基础设施**: `api-envelope.ts` / `api-error.ts` / `api-types.ts` / `api.ts` / `site.ts`
- **校园站专用**: `frontlife-constants.ts`（8 分类 + 3 展示领域 + DOMAIN_MAP）/ `frontlife-seed.ts`（种子数据）
- **AI**: `ai-contract.ts` / `ai-utils.ts`
- **安全**: `sensitive.ts`（6 类敏感词，输入拦截 + 输出过滤）

### 服务端（server）

- **入口**：`src/index.ts`（Node.js 进程入口，Hono 应用定义在 `src/app.ts`）
- **数据库**：`src/db/schema.ts` — Drizzle ORM + PostgreSQL，41 张表
- **模块**：`src/modules/` 下 11 个模块（identity / campus / compass / platform / compliance / moderation / notification / analytics / billing / ai-gateway / insights），各自带 routes.ts + service.ts + repository.ts + types.ts
- **中间件**：`src/middleware/` — auth.ts（JWT 验证 + token 作废检查）、site.ts（站点上下文解析）
- **测试**：`tests/api.test.ts` — 集成测试覆盖主要 API 行为

## Constraints

- 前端构建产物不得包含任何 API Key
- cn 用户数据绝不流向海外；com 站禁止收集中国敏感个人信息
- 两站共享统一账号和账号级等级；校园 profile、全球 profile、知识库、个人行为数据按站点隔离
- `@ns/shared` 必须保持纯 TS，不得引入 React 或任何 UI 依赖
- 敏感词管控：`shared/src/sensitive.ts`，输入拦截 + 输出过滤
- UI 图标统一使用 Lucide（SVG），禁止 emoji 做 UI 图标。emoji 只出现在用户输入的文本中
- 文档/注释中文，变量/函数/类型英文驼峰
- 校园站数据层 8 分类 → 展示层 3 领域（映射见 `frontlife-constants.ts` DOMAIN_MAP）
