# 盘根（PanGen）

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

> 一半生活，一半理想。校园站帮你站稳脚下，全球站帮你看见远方。

双前端 + 管理后台 + 单后端：**校园站**（xyzidea.cn）+ **全球站**（xyzidea.com）+ **管理后台**，共享 `@ns/shared`，各自独立构建。

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + Tailwind CSS 3 | 双站使用 Zustand 5，管理后台使用 React state + `useApiResource` |
| 后端 | Hono + Drizzle ORM + PostgreSQL | 多模块 API 已接入，覆盖校园站、全球站与管理后台 |
| AI | 智谱 GLM-4-Flash | 后端代理，前端不持有 key |
| 开发 | Claude Code（AI 辅助） | |
| 测试 | Vitest | |
| 包管理 | pnpm workspace | monorepo |

---

## 快速开始

```bash
cd NorthStar && pnpm install

# 校园站
cd NorthStar/packages/frontlife-web && pnpm dev    # http://localhost:3001

# 全球站
cd NorthStar/packages/frontai-web && pnpm dev      # http://localhost:3000

# 管理后台
cd NorthStar/packages/admin-console && pnpm dev     # http://localhost:3002

# 后端
cd NorthStar/packages/server && pnpm start          # http://localhost:4000
```

### 类型检查

```bash
cd NorthStar/packages/frontlife-web && npx tsc --noEmit
cd NorthStar/packages/frontai-web && npx tsc --noEmit
cd NorthStar/packages/admin-console && pnpm typecheck
cd NorthStar/packages/server && npx tsc --noEmit
```

### 测试

```bash
cd NorthStar/packages/server && npx vitest run
cd NorthStar/packages/frontai-web && npx vitest run
cd NorthStar/packages/frontlife-web && npx vitest run
cd NorthStar/packages/admin-console && npx vitest run
```

### 本地联调与数据库命令

三个前端当前都通过 `/api/*` 由 Vite proxy 转发到 `http://localhost:4000`。本地联调需要先启动后端。

```bash
cd NorthStar/packages/server
pnpm db:push
pnpm db:seed
pnpm search:refresh
pnpm clean:analytics
pnpm start   # http://localhost:4000

cd ../frontlife-web
pnpm dev   # http://localhost:3001
```

如需连接非默认后端，可设置 `VITE_API_BASE_URL`。

### API 规则

- 校园站、全球站、管理后台通过 `/api/*` 由 Vite proxy 转发到 `http://localhost:4000`
- AI 入口统一走 `/api/ai-gateway/chat`
- `frontai-web` 和 `frontlife-web` 可通过 `VITE_API_BASE_URL` 覆盖默认后端地址

### AI 本地配置

后端 `packages/server/.env` 使用环境变量配置 AI 网关：

```dotenv
AI_API_KEY=your-key
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

---

## 项目结构

```
NS开发/
├── CLAUDE.md                        # AI 开发指南（权威）
├── AGENTS.md                        # Codex 开发指南
├── specs/                           # 规格文档
│   ├── MISSION.md                   # 使命
│   ├── PRD-盘根校园-v9.md            # 校园站 PRD（v9）
│   ├── PRD-盘根AI指南针-标准版.md     # 全球站 PRD
│   ├── 架构设计.md                   # 目标架构主文档
│   ├── 全球specs.md                  # 全球站实现规格
│   ├── architecture-gaps.md          # 当前架构核对
│   └── 计划方案.md                    # 收尾计划
│
└── NorthStar/                       # 所有代码
    ├── pnpm-workspace.yaml
    └── packages/
        ├── shared/                  # @ns/shared — 纯 TS 共享包
        ├── frontlife-web/           # 校园站 → localhost:3001
        ├── frontai-web/             # 全球站 → localhost:3000
        ├── admin-console/           # 管理后台 → localhost:3002
        └── server/                  # 服务端（health service: frontlife-api）→ localhost:4000
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [宪法](.specify/memory/constitution.md) | 最高约束（五条公理） |
| [使命](specs/MISSION.md) | 使命和方向 |
| [校园站 PRD v9](specs/PRD-盘根校园-v9.md) | 校园站完整产品需求 |
| [全球站 PRD](specs/PRD-盘根AI指南针-标准版.md) | 全球站产品需求 |
| [目标架构](specs/架构设计.md) | 统一账号、账号级 LV 两站共享、产品 profile 与知识库分离 |
| [全球站实现规格](specs/全球specs.md) | 数据模型、API 契约、认证流程 |
| [当前架构核对](specs/architecture-gaps.md) | 已清零缺口、待验证项和风险边界 |
| [收尾计划](specs/计划方案.md) | 剩余验证、Smoke、发布前收口 |
| [文档一致性状态](NorthStar/docs/doc-consistency.md) | 文档清理后的通过状态与后续维护规则 |

文档层级：**宪法 → 使命 → PRD → 实现规格**。冲突时以上层为准。

---

## 安全

- 生产部署必须由后端网关持有并转发 API Key
- `.env`、`.env.*.local`、`*.local.json` 已在 `.gitignore`，勿提交密钥
- cn 用户数据不流向海外；com 站禁止收集中国敏感个人信息
- 两站共享统一账号（`accounts` 表）和账号级等级，产品 profile 和行为数据按站点隔离

---

## 许可证

[Apache License 2.0](LICENSE)
