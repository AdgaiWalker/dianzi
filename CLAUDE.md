# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

pnpm workspace monorepo at `NorthStar/`，全栈 TypeScript。

本文所有命令默认从仓库代码目录 `NorthStar/` 开始执行；README 和 AGENTS 中的命令默认从父目录 `NS开发/` 开始执行。

```
NorthStar/packages/
├── server/          @ns/server      Hono + Drizzle ORM + PostgreSQL  → :4000
├── shared/          @ns/shared      纯 TS 类型与契约（无构建步骤，源码直接消费）
├── frontai-web/     全球站          React + Tailwind CSS 3 + Vite    → :3000
├── frontlife-web/   校园站          React + Tailwind CSS 3 + Vite    → :3001
└── admin-console/   管理后台        React + Tailwind CSS 3 + Vite    → :3002
```

后端单实例通过 `SITE=cn|com` + `x-pangen-site` header 做多租户。两前端共享统一账号（`accounts` 表）和账号级等级，产品 profile 和行为数据按站点隔离。

## Commands

```bash
cd NorthStar && pnpm install                                          # 安装依赖

# 开发（各包独立启动）
cd packages/server && pnpm start                                      # :4000
cd packages/frontai-web && pnpm dev                                   # :3000
cd packages/frontlife-web && pnpm dev                                 # :3001
cd packages/admin-console && pnpm dev                                 # :3002

# 类型检查（server 和 admin-console 有 typecheck 脚本，frontai/frontlife 直接用 npx tsc）
cd packages/server && npx tsc --noEmit
cd packages/admin-console && pnpm typecheck
cd packages/<frontai-web|frontlife-web> && npx tsc --noEmit

# 测试
cd packages/server && npx vitest run
cd packages/frontai-web && npx vitest run
cd packages/frontlife-web && npx vitest run
cd packages/admin-console && npx vitest run                          # admin-console 无 test 脚本，直接调用 vitest

# 单文件 / 单用例
cd packages/<pkg> && npx vitest run src/path/to/file.test.ts
cd packages/<pkg> && npx vitest run -t "test name pattern"

# Lint（仅前端三包有 eslint）
cd packages/<frontai-web|frontlife-web|admin-console> && pnpm lint

# Format（仅 frontai-web、frontlife-web 有 prettier）
cd packages/<frontai-web|frontlife-web> && pnpm format

# 数据库
cd packages/server && pnpm db:push                                    # schema 推送到 DB（无 migration 文件）
cd packages/server && pnpm db:seed                                    # 种子数据
cd packages/server && pnpm search:refresh                             # 刷新搜索文档
cd packages/server && pnpm clean:analytics                            # 清理 90 天前分析数据

# 缓存清理（修改 Vite 配置或安装新依赖后）
rm -rf packages/frontlife-web/node_modules/.vite
rm -rf packages/frontai-web/node_modules/.vite
rm -rf packages/admin-console/node_modules/.vite
```

### Environment

后端 `packages/server/.env` 需要以下变量（无 `.env.example`）：

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接 | `postgres://postgres:postgres@localhost:5432/northstar` |
| `JWT_SECRET` | JWT 签名 | 无，必填 |
| `SITE` | 站点租户 cn/com | `cn` |
| `PORT` | 监听端口 | `4000` |
| `AI_API_KEY` | 智谱 API Key | 无则 AI 网关禁用 |
| `AI_BASE_URL` | 智谱 API URL | `https://open.bigmodel.cn/api/paas/v4` |
| `AI_MODEL` | 默认模型 | `glm-4-flash` |
| `LOCK_SITE` | 设为 `"1"` 锁定服务端站点，防客户端伪造 | 无 |

前端可通过 `VITE_API_BASE_URL` 覆盖 Vite proxy 默认的 `localhost:4000`（构建时注入，Vercel 部署必须设置）。

AI 配置只在后端环境变量中保存，前端通过 `/api/ai-gateway/chat` 调用后端网关。`.env`、`.env.*.local`、`*.local.json` 已在 `.gitignore`，勿提交密钥。

## Document Hierarchy

```text
宪法（五条公理）→ 使命（specs/MISSION.md）→ PRD → 实现规格
```

- 宪法：`.specify/memory/constitution.md`（最高约束）
- 校园站 PRD：`specs/PRD-盘根校园-v9.md`
- 全球站 PRD：`specs/PRD-盘根AI指南针-标准版.md`
- 目标架构：`specs/架构设计.md`
- 全球站实现规格：`specs/全球specs.md`
- 冲突时以上层为准

## Key Patterns

### 服务端三层架构

每个模块（`src/modules/<name>/`）遵循 routes → service → repository 分层：

- **routes.ts**：HTTP 处理，参数校验，调用 service。用 `ok()` / `fail()` / `sendResult()` 返回 `ApiEnvelope`。请求体用 `readJson<T>(c)` 解析。
- **service.ts**：业务逻辑，权限检查。导出公开函数供 routes 调用。调用 repository 时用 import alias 避免与自身同名导出冲突（如 `import { getXModuleStatus as getModuleStatusFromRepo }`）。
- **repository.ts**：纯数据访问，Drizzle ORM 查询。模块健康检查统一命名为 `getXModuleStatus()`。

**中间件链**（`src/app.ts`）：CORS → siteMiddleware（多租户）→ 全局 error handler → 模块路由。`index.ts` 负责启动 Node.js server + 后台 cron 任务。

**双层部署**：`app.ts` export `app` 供 Vercel Serverless（Hono preset）；`index.ts` 用 `@hono/node-server` 跑 Node.js 进程。两者通过 `isDirectRun` 判断区分。

**权限双轨制**：
- 平台角色：`src/modules/platform/permissions.ts` 导出 `isAtLeastOperator(role)` / `isAtLeastReviewer(role)` / `isAdmin(role)` / `isAtLeastEditor(role)`，层级 `["visitor", "user", "editor", "reviewer", "operator", "admin"]`
- 信任等级（校园站）：`src/lib/permissions.ts` 管理 `guest → user → active → author → senior → admin`，用 `getTrustRank()` 排序

**认证**：自研 JWT（HMAC-SHA256，无第三方库），`lib/auth.ts` 的 `signToken()`/`verifyToken()`。Token 含 `sub`(userId)、`site`、`role`、`issuedAtMs`。`authMiddleware` 通过对比 `tokenInvalidBefore` 字段实现 Token 失效。

**站点上下文**：`src/middleware/site.ts` 从 `x-pangen-site` header / `?site` query / `SITE` env 解析，`LOCK_SITE=1` 时服务端环境变量优先。

**遗留数据层**：`src/data/postgres.ts` 是早期的单体数据层，仍被校园站逻辑引用。新模块走 `modules/<name>/repository.ts`。两套共存——修改校园站相关代码时注意区分。

**DB null 安全模式**：`src/db/client.ts` 中 `db` 在 `DATABASE_URL` 未设置时为 `null`。各模块处理方式不一致——compass 返回空数组 `[]`（静默降级），campus 返回 `null`（触发错误响应）。新增模块应显式处理 `!db` 场景。

**后台任务**（`src/index.ts`）：每 24h 清理 90 天以上 analytics 数据；每 24h 自动扫描空间声明。

**Schema 迁移防护**：`src/db/schema-guards.ts` 含运行时检查函数（如 `ensureSearchLogsSiteColumn()`），在 `db:push` 后自动修补缺失列。

### 共享包（@ns/shared）

纯 TS，无构建步骤（`"main": "./src/index.ts"`）。禁止引入 React 或任何 UI 依赖。

`shared/src/index.ts` 导出约 24 个模块：
- **类型**: `types.ts` — Domain / Tool / Article / Topic / User / ContentType 等
- **契约**: `identity-contract.ts` / `compass-contract.ts` / `campus-contract.ts` / `platform-contract.ts` / `billing-contract.ts` / `compliance-contract.ts` / `moderation-contract.ts` / `notification-contract.ts` / `analytics-contract.ts` / `insights-contract.ts` / `admin-contract.ts` / `search-contract.ts` / `news-contract.ts`
- **基础设施**: `api-envelope.ts` / `api-error.ts`（含 `getErrorMessage` / `ApiError`）/ `api-types.ts` / `api.ts` / `site.ts`
- **校园站专用**: `frontlife-constants.ts`（8 分类 + 3 展示领域 + DOMAIN_MAP）/ `frontlife-seed.ts`
- **AI**: `ai-contract.ts` / `ai-utils.ts`
- **安全**: `sensitive.ts`（6 类敏感词，输入拦截 + 输出过滤）

### 校园站（frontlife-web）

- **拆分 Zustand store**：useSearchStore（搜索）、useSpaceStore（空间/内容）、useUserStore（用户/认证）、useUIStore（UI 状态）
- **混合路由 + overlay 模式**：react-router-dom 页面路由 + SearchOverlay 等 overlay 由 useUIStore 控制
- **移动端优先**：BottomNav `md:hidden`，Header tabs `hidden md:flex`
- **路径别名**：`@/` → `src/`
- **Tailwind 自定义 token**：sage 主色、ink 文字、amber 警告、rose；间距 nav-h 56px、bottom-nav-h 60px、content-max 960px、reader-max 720px
- **内容渲染**：react-markdown + rehype，自定义 CodeBlock / ImageRenderer / Callout
- **数据模式**：前端直接请求 `/api`，由 Vite proxy 转发到 server；如需连接非默认后端，使用 `VITE_API_BASE_URL`

### 全球站（frontai-web）

- **单 Zustand store**（`useAppStore`）：全局状态 + 认证 + 收藏 + 主题
- **路径别名**：`@/` → `src/`
- **AI 服务**：`services/AIService.ts` → 后端 AI 网关 → 智谱 Chat API；失败回退 `aiFallback.ts` 关键词匹配
- **组件拆分模式**：大型页面提取 hooks（`src/hooks/`）+ 子组件（`src/components/<feature>/`），如 ToolsPage → hooks + tools/ 子组件

### 管理后台（admin-console）

- 独立 React + Tailwind 应用，`useApiResource` hook 统一数据加载
- 无 `@` 路径别名；已有 `useApiResource` 相关 Vitest 测试

## Constraints

- 前端构建产物不得包含任何 API Key
- cn 用户数据绝不流向海外；com 站禁止收集中国敏感个人信息
- 两站共享统一账号和账号级等级；校园 profile、全球 profile、知识库、个人行为数据按站点隔离
- `@ns/shared` 纯 TS，禁止 React 或 UI 依赖
- 敏感词管控：`shared/src/sensitive.ts`，输入拦截 + 输出过滤
- UI 图标统一 Lucide SVG，禁止 emoji 做 UI 图标（emoji 只出现在用户输入文本中）
- 文档/注释中文，变量/函数/类型英文驼峰
- 校园站数据层 8 分类 → 展示层 3 领域（映射见 `frontlife-constants.ts` DOMAIN_MAP）

## Production Deployment

- **后端**：Railway（Railpack builder），监听 8080 端口，启动命令 `npx tsx src/index.ts`。数据库用 Supabase Session pooler（IPv4 兼容），SSL 自动开启（URL 含 `supabase` 时）。
- **前端三包**：Vercel 分别部署为三个项目 — `northstar-frontai`（全球站）、`northstar-frontlife`（校园站）、`northstar-admin`（管理后台）。`VITE_API_BASE_URL` 指向后端 Railway 域名，在 Vercel 项目 Settings → Environment Variables 中配置为 Sensitive 变量，改后需 redeploy 才生效（Vite 构建时注入）。
  - 自定义域名：`www.xyzidea.com`（全球站）、`www.xyzidea.cn` + `walk.中国`（校园站）、`admin.xyzidea.com`（管理后台）。
- **Docker**：`NorthStar/Dockerfile`（server 独立镜像，Node 22 Alpine）、`Dockerfile.web`（多阶段构建：Node 20 Alpine 构建三个前端 → Nginx 1.27 Alpine 反代，三个 server block 分别监听 80/3001/3002，API 代理到 app:4000 并注入 `x-pangen-site` header）、`docker-compose.yml`（db: PostgreSQL 16 Alpine + app: server + web: Nginx，app 默认 `LOCK_SITE=1`）。
- Railway 变量更新**不会**自动 redeploy——需手动在 UI 或 CLI 触发。
