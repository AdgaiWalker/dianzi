# Production QA Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以真实用户视角完整测试 `xyzidea.com`、`xyzidea.cn`、`admin.xyzidea.com` 三个线上站点，修复阻断用户使用的后端/API/页面体验问题，并形成可验收的上线状态。

**Architecture:** 先打通统一后端 API，再验证 Supabase 数据读写，再把三个 Vercel 前端统一指向健康后端。前端体验修复遵循“用户任务流优先”：匿名浏览、搜索、登录注册、收藏/互动、后台登录与内容管理依次验收。

**Tech Stack:** Vercel、Hono、Drizzle ORM、Supabase PostgreSQL、React、Vite、Tailwind CSS、pnpm workspace、Chrome DevTools MCP、必要时使用 GPT image/imagegen 生成视觉素材。

---

## 1. 当前现场结论

### 已用 Chrome DevTools 验证

- 全球站 `https://www.xyzidea.com/`：页面可打开，静态资源 200；首页显示“网络连接失败，请确认后端服务已启动或稍后重试。”
- 校园站 `https://www.xyzidea.cn/`：页面可打开，静态资源 200；空间、生活流显示加载失败。
- 管理后台 `https://admin.xyzidea.com/`：登录页可打开；登录请求当前打到自身 `/api/identity/login` 或不可用 API 时返回 404。
- Railway 后端 `https://northstar-production-1881.up.railway.app/api/health`：返回 Railway fallback 404，说明请求没有进入 Hono 服务。
- Vercel API 项目 `northstar-api`：项目 Ready，但 Resources 显示源文件被作为 Static Assets 发布，Function Invocations 为 0，说明当前没有生成可执行 API Function。

### 根因判断

P0 根因不是数据库，也不是单个接口逻辑，而是“线上后端未以可执行 API 服务形式暴露”。所有前端数据失败都是这个后端不可达问题的后果。

---

## 2. 优先级拆解

### P0：恢复线上 API 服务

**目标：** `GET /api/health` 返回 200 JSON，三站能发起真实 API 请求。

**必须先做的原因：** 后端不可用时，前端用户体验测试只能停在加载失败，无法验证登录、搜索、收藏、后台管理等业务流。

**验收标准：**

- `https://<api-domain>/api/health` 返回：

```json
{
  "status": "ok",
  "service": "frontlife-api"
}
```

- Chrome DevTools Network 中 `/api/health` 状态码为 200，不是 404、500、ERR_FAILED。
- `OPTIONS /api/compass/tools`、`OPTIONS /api/campus/spaces` 返回 204 或 200，并带 `access-control-allow-origin`。
- Vercel 项目资源页能看到 Serverless/Node Function，而不是只有 Static Assets。

### P1：统一三站 API 指向

**目标：** 全球站、校园站、管理后台都指向同一个可用后端域名。

**验收标准：**

- 全球站 Network 中 `/api/compass/tools`、`/api/compass/topics`、`/api/compass/articles` 为 200。
- 校园站 Network 中 `/api/campus/spaces`、`/api/campus/feed`、`/api/platform/capabilities?site=campus` 为 200。
- 管理后台登录请求 `POST /api/identity/login` 不再返回 Vercel 404。
- 三个 Vercel 项目 Production 环境变量 `VITE_API_BASE_URL` 一致，或 rewrite 一致。

### P1：验证 Supabase 数据与种子数据

**目标：** 前端不是只“连上 API”，而是真的能读到内容、能登录测试账号。

**验收标准：**

- `GET /api/compass/tools` 返回非空 `items`。
- `GET /api/campus/spaces` 返回非空 `spaces`。
- 测试账号可登录：
  - 全球站后台账号：`compass`
  - 校园站测试账号：`zhang`
  - 管理员账号：`admin`
- 如果数据为空，执行 `pnpm db:push` 与 `pnpm db:seed` 后重新验收。

### P2：真实用户流程测试与修复

**目标：** 以普通用户身份走完整核心流程，而不是只测接口。

**验收标准：**

- 全球站：
  - 首页内容正常加载。
  - 搜索有结果或明确空状态。
  - 登录/注册可用。
  - 工具详情、文章详情、收藏、方案页不出现白屏。
- 校园站：
  - 首页空间、生活流正常加载。
  - 搜索可用。
  - 文章详情可打开。
  - 登录后收藏、发帖、反馈入口可用或明确提示权限限制。
- 管理后台：
  - 管理员可登录。
  - 用户列表、审核任务、内容管理、统计页可加载。
  - 无权限时显示业务提示，不显示原始报错。

### P2：视觉与完成度补齐

**目标：** 修掉部署后明显影响信任感的视觉问题和未完成状态。

**验收标准：**

- 三站 favicon 不再 404。
- 字体加载失败不影响首屏可读性；国内访问优先使用本地字体或稳定源。
- 首页、空状态、错误状态没有明显占位文案或粗糙视觉。
- 需要视觉素材的页面先用 imagegen/GPT image 生成素材，再落代码。

---

## 3. 衔接逻辑

### 主链路

1. 后端 API 健康检查通过。
2. 数据库连接通过。
3. 前端 API 域名切到健康后端。
4. 匿名用户流程测试。
5. 登录用户流程测试。
6. 管理后台流程测试。
7. 视觉与边角问题补齐。
8. 最终跨站回归验收。

### 为什么不能先做前端体验修复

当前三站的主要失败都是 API 不通导致的数据加载失败。若先改 UI，会把根因掩盖成“漂亮的错误页”，但用户仍然无法使用。必须先恢复 API，再做真实用户测试。

### Railway 与 Vercel 后端选择

- Railway 当前无法登录控制台，且公开健康检查是 fallback 404。
- Vercel 已登录，能看到 `northstar-api` 项目，但该项目当前没有生成 Function。
- 因此当前执行优先级是：先把 Vercel 后端修成可用 API；Railway 只作为后续备选或回滚路径。

---

## 4. 影响范围

### 平台配置影响

- Vercel `northstar-api`：需要确认 Root Directory、Build/Install、API function 输出、环境变量。
- Vercel `northstar-frontai`：需要更新 `VITE_API_BASE_URL` 或 rewrite。
- Vercel `northstar-frontlife`：需要更新 `VITE_API_BASE_URL` 或 rewrite。
- Vercel `northstar-admin`：需要更新 `VITE_API_BASE_URL` 或 rewrite。
- Supabase：需要确认数据库未暂停、连接串使用 pooler、schema/seed 已完成。

### 代码影响

- `NorthStar/packages/server/api/index.ts`：Vercel Hono handler 入口。
- `NorthStar/packages/server/api/[...path].ts` 或根级 `api/[...path].ts`：Vercel catch-all API 路由。
- `NorthStar/packages/server/vercel.json` 或 `NorthStar/vercel.json`：Function runtime、cron、路由配置。
- `NorthStar/packages/admin-console/src/services/api.ts`：后台 API base URL。
- 三个前端项目的 Vercel 环境变量：生产构建时注入 API 域名。

### 数据影响

- `accounts` 表和账号级等级是两站共享。
- 校园 profile、全球 profile、知识库、行为数据按站点隔离。
- 执行 seed 前必须确认目标数据库是线上 Supabase，不是本地库。

### 用户体验影响

- API 域名切换会影响三站所有数据加载。
- CORS 设置错误会让浏览器层面直接阻断请求。
- 数据为空会被用户误认为功能没做完。
- 后台登录不可用会阻断内容维护与审核。

---

## 5. 实施任务

### Task 1：冻结当前现场并记录基线

**Files:**
- Create: `docs/qa/production-user-test-baseline.md`

- [ ] **Step 1: 用 Chrome DevTools 记录三个站首屏状态**

记录以下内容：

```markdown
# Production User Test Baseline

Date: 2026-05-20

## Global Site
- URL: https://www.xyzidea.com/
- First paint: pass/fail
- Main user-visible error:
- API failures:
- Screenshot path:

## Campus Site
- URL: https://www.xyzidea.cn/
- First paint: pass/fail
- Main user-visible error:
- API failures:
- Screenshot path:

## Admin Console
- URL: https://admin.xyzidea.com/
- First paint: pass/fail
- Login result:
- API failures:
- Screenshot path:
```

- [ ] **Step 2: 保存 Network 关键证据**

必须记录这些请求的状态：

```text
GET /api/health
OPTIONS /api/compass/tools
GET /api/compass/tools
OPTIONS /api/campus/spaces
GET /api/campus/spaces
POST /api/identity/login
```

- [ ] **Step 3: 截图**

使用 Chrome DevTools 截图，保存到：

```text
docs/qa/screenshots/global-home-before.png
docs/qa/screenshots/campus-home-before.png
docs/qa/screenshots/admin-login-before.png
```

### Task 2：修复 Vercel 后端 API 项目

**Files:**
- Modify: `NorthStar/packages/server/api/index.ts`
- Create or Modify: `NorthStar/packages/server/api/[...path].ts`
- Modify: `NorthStar/packages/server/vercel.json`
- Optional Modify: `NorthStar/vercel.json`

- [ ] **Step 1: 确认当前 Vercel 产物**

在 Vercel `northstar-api` Deployment Resources 中确认：

```text
Expected broken state: only Static Assets, no Functions.
Expected fixed state: Node.js Function exists for api route.
```

- [ ] **Step 2: 确保 Vercel handler 覆盖所有 /api 子路径**

目标文件内容：

```ts
// NorthStar/packages/server/api/index.ts
import { handle } from "hono/vercel";
import { app } from "../src/app";

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
```

```ts
// NorthStar/packages/server/api/[...path].ts
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT,
} from "./index";
```

- [ ] **Step 3: 配置 Vercel Function**

目标配置：

```json
{
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs22.x",
      "maxDuration": 30
    },
    "api/[...path].ts": {
      "runtime": "nodejs22.x",
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 4 * * *"
    }
  ]
}
```

- [ ] **Step 4: 重新部署 northstar-api**

在 Vercel 中触发 Redeploy，部署完成后打开：

```text
https://northstar-api-dun.vercel.app/api/health
```

Expected:

```json
{
  "status": "ok",
  "service": "frontlife-api"
}
```

### Task 3：配置后端环境变量与数据库

**Files:**
- No code file required.
- Platform: Vercel project `northstar-api`
- Platform: Supabase project `northstar`

- [ ] **Step 1: 检查 Vercel 环境变量**

Production 至少需要：

```dotenv
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres
JWT_SECRET=<strong-random-secret>
AI_API_KEY=<zhipu-key>
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

- [ ] **Step 2: 验证 DB 连接**

打开：

```text
https://northstar-api-dun.vercel.app/api/health
```

然后打开：

```text
https://northstar-api-dun.vercel.app/api/compass/tools
https://northstar-api-dun.vercel.app/api/campus/spaces
```

Expected:

```text
HTTP 200
JSON body has non-empty data or clear empty array.
No DATABASE_URL missing error in runtime logs.
```

- [ ] **Step 3: 如果数据为空，执行 schema 与 seed**

在本地或一次性 Vercel-compatible shell 中执行：

```powershell
cd E:\桌面\项目\NS项目\NS开发\NorthStar\packages\server
$env:DATABASE_URL="<production-supabase-pooler-url>"
pnpm db:push
pnpm db:seed
```

Expected:

```text
db:push exits 0
db:seed exits 0
GET /api/compass/tools returns items.length > 0
GET /api/campus/spaces returns spaces.length > 0
```

### Task 4：把三个前端切到 Vercel 后端

**Files:**
- Modify if needed: `NorthStar/packages/admin-console/src/services/api.ts`
- Modify if needed: `NorthStar/packages/admin-console/vercel.json`
- Platform: Vercel env vars for `northstar-frontai`
- Platform: Vercel env vars for `northstar-frontlife`
- Platform: Vercel env vars for `northstar-admin`

- [ ] **Step 1: 设置统一 API 域名**

三个前端项目 Production 环境变量统一设置：

```dotenv
VITE_API_BASE_URL=https://northstar-api-dun.vercel.app
```

- [ ] **Step 2: 管理后台保留 rewrite 作为兜底**

目标：

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://northstar-api-dun.vercel.app/api/:path*" }
  ]
}
```

- [ ] **Step 3: 重新部署三个前端**

依次 Redeploy：

```text
northstar-frontai
northstar-frontlife
northstar-admin
```

- [ ] **Step 4: 验证请求目标**

Chrome DevTools Network 中应看到：

```text
https://northstar-api-dun.vercel.app/api/compass/tools
https://northstar-api-dun.vercel.app/api/campus/spaces
https://northstar-api-dun.vercel.app/api/identity/login
```

不能再看到：

```text
https://northstar-production-1881.up.railway.app/api/*
```

### Task 5：全球站用户流程测试

**Files:**
- Create: `docs/qa/global-site-user-flow.md`
- Modify after findings: `NorthStar/packages/frontai-web/src/**`

- [ ] **Step 1: 匿名首页验收**

检查：

```text
首页无“网络连接失败”
工具推荐区有内容
文章/主题可见
搜索框可输入
```

- [ ] **Step 2: 搜索流程**

输入：

```text
AI 写代码哪个工具最好
```

Expected:

```text
搜索结果出现工具、主题或文章
无白屏
无 console runtime error
```

- [ ] **Step 3: 登录流程**

使用测试账号登录。Expected:

```text
登录成功后头像/我的页面显示用户状态
token 写入 localStorage
刷新后仍保持登录
```

- [ ] **Step 4: 收藏与方案流程**

检查：

```text
工具详情可打开
收藏按钮可点击
方案页可进入
保存方案后列表可见
```

### Task 6：校园站用户流程测试

**Files:**
- Create: `docs/qa/campus-site-user-flow.md`
- Modify after findings: `NorthStar/packages/frontlife-web/src/**`

- [ ] **Step 1: 首页验收**

Expected:

```text
空间列表正常加载
生活流正常加载
搜索入口可点击
底部导航移动端可用
```

- [ ] **Step 2: 搜索流程**

输入：

```text
食堂几点关门
```

Expected:

```text
有本地搜索结果或明确空状态
AI 兜底不阻塞页面
```

- [ ] **Step 3: 内容详情流程**

检查：

```text
空间详情可打开
文章详情可打开
上一页/下一篇不报错
```

- [ ] **Step 4: 登录后互动流程**

Expected:

```text
登录成功
收藏可用
发帖入口可用或明确权限提示
文章“有帮助/信息变更”反馈可用
```

### Task 7：管理后台用户流程测试

**Files:**
- Create: `docs/qa/admin-console-user-flow.md`
- Modify after findings: `NorthStar/packages/admin-console/src/**`

- [ ] **Step 1: 登录后台**

Expected:

```text
POST /api/identity/login returns 200
登录后进入 dashboard
```

- [ ] **Step 2: 核心菜单验收**

逐项打开：

```text
用户管理
审核任务
内容管理
统计分析
AI 调用日志
法务/合规
```

Expected:

```text
页面不白屏
列表接口 200
空列表有明确空状态
无原始异常文本暴露给用户
```

### Task 8：视觉素材与未完成 UI 补齐

**Files:**
- Create if needed: `NorthStar/packages/frontai-web/public/images/**`
- Create if needed: `NorthStar/packages/frontlife-web/public/images/**`
- Create if needed: `NorthStar/packages/admin-console/public/favicon.ico`
- Modify after findings: frontend component files

- [ ] **Step 1: 收集缺失视觉点**

记录：

```text
favicon 404
空状态粗糙
首屏缺少品牌视觉
错误页只有技术错误
字体源被阻止
```

- [ ] **Step 2: 需要图片时先生成素材**

使用 imagegen/GPT image 生成：

```text
全球站：AI 工具/创作工作台相关视觉
校园站：校园生活知识库/问答场景视觉
后台：简洁 favicon 或品牌标识
```

- [ ] **Step 3: 落代码**

验收：

```text
图片文件可加载
无 layout shift
移动端不遮挡文字
首屏仍能看到下一段内容提示
```

### Task 9：最终验收报告

**Files:**
- Create: `docs/qa/production-acceptance-report.md`

- [ ] **Step 1: 汇总三站结果**

模板：

```markdown
# Production Acceptance Report

Date: 2026-05-20

## API
- Health: pass/fail
- DB data: pass/fail
- CORS: pass/fail

## Global Site
- Anonymous flow: pass/fail
- Login flow: pass/fail
- Search flow: pass/fail
- Remaining issues:

## Campus Site
- Anonymous flow: pass/fail
- Login flow: pass/fail
- Search flow: pass/fail
- Remaining issues:

## Admin Console
- Login: pass/fail
- Core pages: pass/fail
- Remaining issues:
```

- [ ] **Step 2: 只允许带证据结论**

每个 pass 必须有：

```text
URL
status code
observed UI result
screenshot path
```

---

## 6. To Do List

- [ ] 创建线上 QA 基线文档和三站截图。
- [ ] 修复 `northstar-api` 让 Vercel 生成 API Function。
- [ ] 配置 `northstar-api` Production 环境变量。
- [ ] 验证 `/api/health`、`/api/compass/tools`、`/api/campus/spaces`。
- [ ] 如线上数据为空，执行 `db:push` 和 `db:seed`。
- [ ] 设置三个前端的 `VITE_API_BASE_URL` 到 Vercel API 域名。
- [ ] 重新部署全球站、校园站、管理后台。
- [ ] 用 Chrome DevTools 完成全球站用户流程测试。
- [ ] 用 Chrome DevTools 完成校园站用户流程测试。
- [ ] 用 Chrome DevTools 完成管理后台用户流程测试。
- [ ] 记录所有未完成功能与体验问题。
- [ ] 对 P0/P1 问题直接修复并验证。
- [ ] 对需要视觉素材的页面先生成图，再落代码。
- [ ] 产出最终验收报告。

---

## 7. 执行入口

当前最优执行顺序：

1. 先处理 Task 1 到 Task 4，恢复后端与数据。
2. 再处理 Task 5 到 Task 7，做真实用户流程测试。
3. 最后处理 Task 8 到 Task 9，补视觉与验收报告。

在后端恢复之前，前端用户测试只记录“被 API 阻断”的事实，不进入视觉优化。
