# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

扁平化 pnpm workspace monorepo，全栈 TypeScript。所有的命令均在仓库根目录直接执行。

```text
packages/
├── server/          @dianzi/server          Hono + Drizzle ORM + PostgreSQL  → :4000
├── shared/          @dianzi/shared          纯 TS 类型、契约与 Drizzle schema
├── frontlife-web/   @dianzi/web-campus      校园实践现场 (React + Tailwind CSS v3 + Vite) → :3001
└── admin-console/   @dianzi/admin-console   管理后台 (React + Tailwind CSS v3 + Vite) → :3002
```

## Commands

```bash
# 安装依赖
$env:CI="true"; pnpm install

# 启动开发服务
pnpm --filter @dianzi/server dev          # 服务端 :4000
pnpm --filter @dianzi/web-campus dev      # 校园端 :3001
pnpm --filter @dianzi/admin-console dev   # 后台 :3002

# 类型检查 (NoEmit)
pnpm --filter @dianzi/server exec tsc --noEmit
# 构建打包
pnpm --filter @dianzi/web-campus build
pnpm --filter @dianzi/admin-console build

# 运行测试
pnpm --filter @dianzi/server test

# 数据库指令 (Drizzle)
pnpm --filter @dianzi/server db:push      # 推送 Schema
pnpm --filter @dianzi/server db:seed      # 填充种子数据
```

## Document Hierarchy

```text
宪法（五条公理）→ 使命（specs/MISSION.md）→ PRD（specs/PRD-dianzi-v1.md）→ 计划与方案
```

*   **核心产品 PRD**：[PRD-dianzi-v1.md](file:///C:/Users/26296/Desktop/dianzi/specs/PRD-dianzi-v1.md)
*   **开发任务清单**：`task.md` （在 `@gemini` 内部 artifacts 目录中跟踪）

## Key Patterns

### 1. 服务端三层架构 (`@dianzi/server`)
每个模块遵循 `routes → service → repository` 三层分工：
*   **routes.ts**：参数接收、输入安全校验、核心 Schema 参数的初步清洗。
*   **service.ts**：业务契约流、GLM-4 AI 整理、引力模型计算逻辑。
*   **repository.ts**：Drizzle ORM 的数据存取层。

### 2. 共享依赖包 (`@dianzi/shared`)
*   纯 TypeScript 代码，无单独构建步骤。
*   **严禁引入任何 React 或 DOM 相关的 UI 依赖**。
*   包含了数据交互 envelope、API 契约定义与敏感词管控词包 (`sensitive.ts`)。
