# 部署后 QA 测试报告

日期：2026-05-20
环境：线上（Vercel + Supabase，前端通过同源 `/api` 访问后端）

## 最新结论

三站已从“浏览器直连后端/外部资源”改为“中国网络优先”的访问链路：

- 全球站 `https://www.xyzidea.com`：页面内容、API、占位图片均走同域。
- 校园站 `https://www.xyzidea.cn`：页面内容、API、占位图片均走同域。
- 管理后台 `https://admin.xyzidea.com`：登录与后台接口均走同域。
- 三站 HTML 入口均有静态首屏兜底，JavaScript 暂时未执行时也不是空白页。
- 全球站和校园站的公开内容 API 有本地离线兜底，API 失败时仍能展示核心公开内容。
- 后端 JSON 出口会把 `picsum.photos` / `fastly.picsum.photos` 图片地址替换为 `/media-placeholder.svg`。

## 验收标准

| 标准 | 当前证据 |
|------|----------|
| 中国用户打开用户站能看到内容 | 全球站首页可见 Cursor、Midjourney、Gamma；校园站首页可见生活流、新生报到、校园内容 |
| 浏览器不再跨域直连后端 | Chrome Network 中用户站和后台 API 均为各自域名下的 `/api/*` |
| 不再依赖国内常见失败外链 | 首页 HTML 与 Chrome Network 未出现 Google Fonts、Loli Fonts、picsum、`northstar-api` 浏览器直连 |
| API 失败时用户站仍有公开内容 | `frontai-web`、`frontlife-web` 的离线兜底测试覆盖 API 失败返回本地内容 |
| JavaScript 失败时不是白屏 | 三个前端的 `static-shell.test.ts` 覆盖入口 HTML 静态兜底 |
| admin 能登录进入后台 | `admin/password` 登录 `https://admin.xyzidea.com` 后进入“总览”，`/api/admin/summary` 返回 200 |
| 大陆节点可访问首页与公开 API | Check-Host 浙江节点 `cn1.node.check-host.net` 返回三站首页 200；`/api/compass/tools` 与 `/api/campus/feed` 返回 200 |

## 最新验证命令

```bash
cd NorthStar/packages/frontai-web && npx vitest run src/static-shell.test.ts src/services/api.offline.test.ts
cd NorthStar/packages/frontlife-web && npx vitest run src/static-shell.test.ts src/services/api.offline.test.ts
cd NorthStar/packages/admin-console && npx vitest run src/static-shell.test.ts src/services/api.test.ts
cd NorthStar/packages/frontai-web && pnpm build
cd NorthStar/packages/frontlife-web && pnpm build
cd NorthStar/packages/admin-console && pnpm build
cd NorthStar/packages/frontai-web && npx tsc --noEmit
cd NorthStar/packages/frontlife-web && npx tsc --noEmit
cd NorthStar/packages/admin-console && pnpm typecheck
cd NorthStar/packages/server && npx tsc --noEmit
cd NorthStar/packages/server && npx vitest run tests/china-access.test.ts
```

Vite 构建仍会提示部分 chunk 超过 500 kB，这是体积优化提醒，不影响本轮中国访问链路。

## 大陆节点探测

通过 Check-Host 浙江节点 `cn1.node.check-host.net` 探测：

| URL | 结果 |
|-----|------|
| `https://www.xyzidea.com/` | HTTP 200 |
| `https://www.xyzidea.cn/` | HTTP 200 |
| `https://admin.xyzidea.com/` | HTTP 200 |
| `https://www.xyzidea.com/api/compass/tools` | HTTP 200 |
| `https://www.xyzidea.cn/api/campus/feed?page=1&pageSize=6` | HTTP 200 |

## 历史问题与处理结果

| 历史问题 | 处理结果 |
|----------|----------|
| Railway 后端不可用导致前端 API CORS/404 | 已切到 Vercel 后端，并由各前端同源 `/api` rewrite 转发 |
| Admin Console 生产环境没有 API 代理 | 已添加同源 `/api` rewrite，线上登录和总览接口 200 |
| Google/Loli 字体国内失败 | 已移除外部字体，改系统字体 |
| `picsum.photos` 图片国内失败 | 前端 API 客户端、后端 JSON 出口、离线内容均替换为本地 `/media-placeholder.svg` |
| favicon 404 | 三个前端均使用本地 `/favicon.svg` |

## 剩余风险

- 当前环境无法直接操作真实用户手机或宽带，但已补充第三方浙江节点 HTTP 200 探测；如果后续用户侧仍报错，应优先检查当地 DNS、运营商缓存或 Vercel 边缘节点波动。
- 如果后续后端域名或 Vercel rewrite 目标变更，需要重新跑本报告里的 Chrome Network 检查。
