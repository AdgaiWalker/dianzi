# Production Acceptance Report

Date: 2026-05-20

## API

- Health: pass
  - URL: `https://northstar-api-dun.vercel.app/api/health`
  - Status: 200
- DB data: pass
  - `GET /api/compass/tools`: 200，返回工具数据。
  - `GET /api/compass/topics`: 200。
  - `GET /api/compass/articles`: 200。
  - `GET /api/campus/spaces`: 200，返回校园空间数据。
  - `GET /api/campus/feed?page=1&pageSize=6`: 200。
- CORS: pass
  - `OPTIONS /api/compass/tools`: 204。
  - `OPTIONS /api/campus/spaces`: 204。
  - `OPTIONS /api/admin/users`: 204。

## Deployment Fixes

- `northstar-api`
  - 已改用 Vercel 后端。
  - Production `DATABASE_URL` 已设置为 Supabase transaction pooler。
  - Production `JWT_SECRET` 已设置。
  - 已删除会锁死统一后端站点上下文的 `LOCK_SITE`、`SITE`。
  - 已删除空值 AI 环境变量，避免把 `""` 当成真实 key。
  - 已加入后端 JSON 出口净化：`picsum.photos` / `fastly.picsum.photos` 会统一替换为 `/media-placeholder.svg`。
  - API 项目部署根目录为 `NorthStar/packages/server`；已将 `@ns/shared` 改为 npm 可解析的本地依赖 `file:../shared`，避免 Vercel 子目录部署时 npm 不识别 `workspace:*`。
- `northstar-frontai`
  - 已移除 Production `VITE_API_BASE_URL`，前端浏览器改为请求同域 `/api`。
  - `vercel.json` 已加入 `/api/:path*` rewrite 到后端。
  - 已加入 SPA fallback，`/tools` 直接访问 200。
  - 已加入本地 SVG favicon。
  - 已移除 Google Fonts 外部依赖，改用系统字体。
  - 已将接口返回中的 `picsum.photos` / `fastly.picsum.photos` 占位图替换为本地 `/media-placeholder.svg`。
  - 已加入公开内容离线兜底：工具、专题、文章 API 不可达时，首屏仍展示本地精选内容。
- `northstar-frontlife`
  - 已移除 Production `VITE_API_BASE_URL`，前端浏览器改为请求同域 `/api`。
  - `vercel.json` 已加入 `/api/:path*` rewrite 到后端。
  - 已加入 SPA fallback，`/explore` 直接访问 200。
  - 已移除被浏览器拦截的 `fonts.loli.net` 字体依赖。
  - 已加入本地 SVG favicon。
  - 已将接口返回中的 `picsum.photos` / `fastly.picsum.photos` 占位图替换为本地 `/media-placeholder.svg`。
  - 已加入公开内容离线兜底：空间、生活流、空间详情、文章详情、搜索 API 不可达时，仍展示本地校园内容。
- `northstar-admin`
  - 已移除 Production `VITE_API_BASE_URL`，前端浏览器改为请求同域 `/api`。
  - `vercel.json` API rewrite 已指向 `northstar-api-dun.vercel.app`。
  - 已加入 SPA fallback，`/users` 直接访问 200。
  - 已加入本地 SVG favicon。

## China Access Path

- 根因：浏览器生产环境曾直接请求 `northstar-api-dun.vercel.app`，国内网络下容易无法访问后端 API；部分首屏资源还依赖 Google/Loli 字体和 `picsum` 外部图片。
- 处理：三个前端生产环境均移除 `VITE_API_BASE_URL`，浏览器统一请求同域 `/api`；由 Vercel rewrite 在服务端转发到后端。
- 处理：后端也增加 JSON 出口净化，避免未来 admin 或新页面漏掉前端净化时再次把被拦图片域名发给浏览器。
- 全球站 `https://www.xyzidea.com/` Chrome 硬刷新后只看到同域页面、同域静态资源、同域 `/api/compass/*`、`/favicon.svg`、`/media-placeholder.svg` 请求；未看到 `northstar-api-dun.vercel.app`、Google Fonts、Loli Fonts、`picsum` 网络请求。
- 校园站 `https://www.xyzidea.cn/` Chrome 硬刷新后只看到同域页面、同域静态资源、同域 `/api/campus/*`、`/api/platform/capabilities`、`/favicon.svg` 请求；未看到 `northstar-api-dun.vercel.app`、Google/Loli 字体、`picsum` 网络请求。
- 管理后台 `https://admin.xyzidea.com/` Chrome 硬刷新后只看到同域页面、同域静态资源、同域 `/api/admin/summary`、`/favicon.svg` 请求；未看到浏览器直连后端域名。
- HTTP 探活：
  - `GET https://www.xyzidea.com/`: 200。
  - `GET https://www.xyzidea.com/api/compass/tools`: 200。
  - `GET https://www.xyzidea.com/api/compass/tools`: `picsum=False`，`/media-placeholder.svg` 出现 8 次。
  - `GET https://www.xyzidea.com/api/compass/topics`: `picsum=False`，`/media-placeholder.svg` 出现 2 次。
  - `GET https://www.xyzidea.com/api/compass/articles`: `picsum=False`，`/media-placeholder.svg` 出现 2 次。
  - `GET https://www.xyzidea.com/media-placeholder.svg`: 200。
  - `GET https://www.xyzidea.cn/`: 200。
  - `GET https://www.xyzidea.cn/api/campus/spaces`: 200。
  - `GET https://www.xyzidea.cn/media-placeholder.svg`: 200。
  - `GET https://admin.xyzidea.com/`: 200。
  - `POST https://admin.xyzidea.com/api/identity/login` 使用 `admin / password / cn`: 200。
  - 带登录 token 请求 `GET https://admin.xyzidea.com/api/admin/summary`: 200。
- 部署记录：
  - `northstar-api` 最新生产部署成功，并已 alias 到 `https://northstar-api-dun.vercel.app`。
  - `northstar-frontai` 最新生产部署成功，并已 alias 到 `https://www.xyzidea.com`。
  - `northstar-frontlife` 最新生产部署成功，并已 alias 到 `https://www.xyzidea.cn`。
  - 直接访问 Vercel 后端域名在本机 `Invoke-WebRequest` 中仍出现超时；前端同源 rewrite 访问正常，Vercel 日志显示后端 `/api/health` 返回 200。用户浏览器路径不依赖该后端域名直连。
- API 失败兜底验收：
  - Chrome 在页面加载前注入脚本，强制所有 `/api/*` fetch 抛出 `simulated api blocked`。
  - `https://www.xyzidea.com/` 仍显示 Cursor、Midjourney、Gamma、Notion AI，本地图片为 `/media-placeholder.svg`；Network 只有页面、JS、CSS、`/media-placeholder.svg`，无成功 API 请求。
  - `https://www.xyzidea.cn/` 仍显示校园空间和生活流，包括“校园美食”“新生报到”“二食堂三楼麻辣烫实测”等；Network 只有页面、JS、CSS，无成功 API 请求。

## Global Site

- URL: `https://www.xyzidea.com/`
- Anonymous flow: pass
  - 首页 200。
  - Chrome Network 中 `https://www.xyzidea.com/api/compass/tools`、`https://www.xyzidea.com/api/compass/topics`、`https://www.xyzidea.com/api/compass/articles` 均为 200。
  - Chrome Network 不再直连 `northstar-api-dun.vercel.app`。
  - 页面显示热门工具，包括 Cursor、Midjourney、Gamma。
- Login API: pass
  - `compass / password / com` 登录 API 返回 200。
- Browser login: pass
  - Chrome 隔离会话中打开 `https://www.xyzidea.com/login`。
  - 使用 `compass / password` 登录后跳回首页。
  - 登录后页面显示通知按钮和用户头像，刷新后仍保持登录状态。
- Direct routes: pass
  - `https://www.xyzidea.com/tools` 返回 200。
- Favicon: pass
  - `https://www.xyzidea.com/favicon.svg` 返回 200。

## Campus Site

- URL: `https://www.xyzidea.cn/`
- Anonymous flow: pass
  - 首页 200。
  - Chrome Network 中 `https://www.xyzidea.cn/api/campus/spaces`、`https://www.xyzidea.cn/api/campus/feed?page=1&pageSize=6`、`https://www.xyzidea.cn/api/platform/capabilities?site=campus` 均为 200。
  - Chrome Network 不再直连 `northstar-api-dun.vercel.app`。
  - 页面显示生活流和空间入口。
- Login API: pass
  - `zhang / password / cn` 登录 API 返回 200。
- Browser login: pass
  - Chrome 隔离会话中打开 `https://www.xyzidea.cn/login`。
  - 使用 `zhang / password` 登录后进入 `/me`。
  - 页面显示 `张同学`，刷新后仍保持登录状态。
- Direct routes: pass
  - `https://www.xyzidea.cn/explore` 返回 200。
- Favicon/font: pass
  - `https://www.xyzidea.cn/favicon.svg` 返回 200。
  - Chrome Network 不再请求 `fonts.loli.net`。

## Admin Console

- URL: `https://admin.xyzidea.com/`
- Login: pass
  - Chrome 隔离会话中打开 `https://admin.xyzidea.com/`。
  - 默认站点使用 `admin / password` 可登录后台。
  - 登录后显示账号 `盘根管理员 · admin`。
  - `compass / password / com` 也可作为全球站管理员登录后台；若未切换到 com 站点，会按预期提示无后台权限。
- Core pages/API: pass
  - Chrome Network 中 `https://admin.xyzidea.com/api/identity/login`: 200。
  - Chrome Network 中 `https://admin.xyzidea.com/api/admin/summary`: 200。
  - Chrome Network 不再直连 `northstar-api-dun.vercel.app`。
  - `GET /api/admin/summary`: 200。
  - `GET /api/admin/users`: 200。
  - `GET /api/moderation/tasks`: 200。
  - `GET /api/admin/content`: 200。
  - `GET /api/analytics/metrics`: 200。
  - `GET /api/admin/audit-logs`: 200。
  - `GET /api/notification/email-deliveries`: 200。
  - `GET /api/compliance/account-deletions`: 200。
- Direct routes: pass
  - `https://admin.xyzidea.com/users` 返回 200。
- Favicon: pass
  - `https://admin.xyzidea.com/favicon.svg` 返回 200。

## Seed Account Login Matrix

- `zhang / password / cn`: pass，role=`user`。
- `editor / password / cn`: pass，role=`editor`。
- `admin / password / cn`: pass，role=`admin`。
- `compass / password / com`: pass，role=`admin`。

## Remaining Notes

- Vercel 构建仍提示部分前端 chunk 超过 500 kB，这是性能优化项，不阻断登录和核心使用。
- Railway 当前仍不可用，本次已不再作为生产后端路径使用。
- 服务端全量 Vitest 当前有 2 个既有鉴权断言失败：测试期望 403，实际返回 401；本次新增的 `tests/china-access.test.ts` 和 `npx tsc --noEmit` 均通过。
- 前端新增离线兜底测试：
  - `frontai-web/src/services/api.offline.test.ts`: pass。
  - `frontlife-web/src/services/api.offline.test.ts`: pass。
  - `frontai-web` / `frontlife-web` 的 `npx tsc --noEmit` 和 `pnpm build` 均通过。
- 当前环境无法替代真实大陆运营商网络终测；代码和线上浏览器请求链路已移除本次发现的主要被拦外部依赖，建议最终由用户关闭 VPN 后访问三站做一次实网确认。
