# 点子（DIANZI）

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06b6d4.svg)](https://tailwindcss.com/)

> 让生活里的想法，遇见需要它的人。
> 点子，是一个围绕“想法捕捉、AI整理、同频回应、价值共创”的个人价值网络平台。

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 (校园站) | React 19 + Tailwind CSS v3 | 逐步升级中，使用 Zustand 5 进行状态管理 |
| 后端 | Hono + Drizzle ORM + PostgreSQL | 多模块 API，已接入点子核心数据模型 |
| AI 引擎 | 智谱 GLM-4-Flash | 后端代理，前端不持有 API key |
| 动效引擎 | GSAP + ScrollTrigger | 星空大厅物理解析与 Slogan 滚动缩放重组 |
| 包管理 | pnpm workspace | 扁平化 monorepo 工作空间 |

---

## 项目结构

```text
dianzi/
├── packages/
│   ├── web-campus/      # @dianzi/web-campus       前端校园端 (点子共创与实践板)
│   ├── admin-console/   # @dianzi/admin-console    后台管理端
│   ├── server/          # @dianzi/server           Hono 服务端 API
│   └── shared/          # @dianzi/shared           共享模块与 Drizzle 数据库 schema
├── specs/               # 产品 PRD 与设计文档
├── docs/                # 系统开发与测试文档
├── rules/               # 静态扫描规则定义
└── pnpm-workspace.yaml  # Monorepo 配置文件
```

---

## 快速开始

### 1. 安装依赖

在仓库根目录下运行：

```bash
$env:CI="true"; pnpm install
```

### 2. 启动开发服务器

*   **启动服务端 (Port 4000)**：

    ```bash
    pnpm --filter @dianzi/server dev
    ```

*   **启动校园共创板 (Port 3001)**：

    ```bash
    pnpm --filter @dianzi/web-campus dev
    ```

*   **启动管理后台 (Port 3002)**：

    ```bash
    pnpm --filter @dianzi/admin-console dev
    ```

---

## 数据库与 AI 配置

### 1. 本地数据库初始化

在 `packages/server/` 目录下，你需要创建 `.env` 文件配置 PostgreSQL：

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dianzi
JWT_SECRET=your-jwt-secret
AI_API_KEY=your-zhipu-api-key
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

配置就绪后，执行以下命令同步库表与种子数据：

```bash
# 推送 Schema 到 PostgreSQL (Drizzle)
pnpm --filter @dianzi/server db:push

# 注入本地测试种子数据
pnpm --filter @dianzi/server db:seed
```

---

## 编译与测试

*   **后端类型检查**：

    ```bash
    pnpm --filter @dianzi/server exec tsc --noEmit
    ```

*   **运行单元测试**：

    ```bash
    pnpm --filter @dianzi/server test
    ```
