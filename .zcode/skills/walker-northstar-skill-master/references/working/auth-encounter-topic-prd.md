# PRD: 认证状态 + 遭遇画像 + 选题闭环

Generated: 2026-06-14

Stage: AdgaiWalker 个人系统 / 发布接口桥接

上游: `references/working/prd.md`（未完成蓝图总账，本轮细化 U1 邀请认证画像 / U2 需求闭环 / U4 内容创作闭环）

## 1. 背景与动机

Phase 1-4 已完成 Need Case 主链路（受邀 session + 画像 + Agent 推荐 + 反馈 + admin review），后端 API 齐全，端到端冒烟验证通过（邀请码 → 画像 → 提问 → 带 profileSnapshot 的 NeedCase → 反馈 → admin accept）。

但 reality 有三个缺口：

1. **用户侧前端入口缺失**：邀请验证、画像填写只有 API，没有页面；ToolMatchChat 匿名开放，邀请制身份没接进 `/tools` 主流程。
2. **画像模型方向错位**：Phase 2 的前置画像表单（role/goal/stuckPoint/helpPreference 五问）是问卷式采集，逆人性，且把人钉成静态标签。
3. **选题闭环未接**：NeedCase 能存能复盘，但"需求 → 选题 → 创作 → 命中率反馈"的创作者闭环没接上；TopicCandidate 在 to-do list 里被 defer。

站主视角的重新定位：ToolMatchChat 对用户是"找工具"入口，对 Walker 是"画像 + 需求调查"采集器。这两个目的必须在一套设计里同时成立。

## 2. 一句话结论

把 Phase 1-4 建好的后端能力接上用户侧前端 + 选题闭环，形成「邀请认证 gate → 遭遇画像 → 需求聚类 → 选题工作台 → 创作简报 → 命中率反馈」的完整创作者操作系统切片。系统做雷达和辅助，人做判断。

## 3. 核心设计决策（沉淀）

### 3.1 邀请码 = 认证门票（gate），不是升级层

```text
全量交互功能（ToolMatchChat 等）需受邀才能用
访客只能看公开内容（文章、工具列表等只读）
认证零 PII：不收手机号、邮箱、身份证
```

理由：邀请制在个人节点的真实价值是"被记住 / 被服务"，不是防滥用（Rate limit 已挡）、不是收钱。gate 是总账 PRD §4.1"public 不是用户"的直接落地。后端 `AuthState(public/invited/admin)` 已就绪，本轮只差前端 gate 机制。

### 3.2 画像两层模型：自报锚点 + 遭遇切片

```text
自报锚点（邀请时一次，≤10 字）
  -> 用户自填"主要是什么人"，常驻底色 / Agent 推断默认
  -> 例："大三计算机学生" / "带两个娃的妈妈" / "体制内想搞副业"

遭遇切片（每次提问 Agent 推断）
  -> 从本次对话内容推断此刻角色 / 目标 / 卡点 / 社会关系
  -> 写入 NeedCase.profileSnapshot（per-case，天然支持）
```

理由：同一个人在不同地方遇到不同的人、处于不同的社会关系、扮演不同的角色、面对不同的困扰。静态单条画像会丢失这种多面性；遭遇切片 per-NeedCase，多条累积成"社会角色图谱"。锚点解决冷启动（前几次推断不盲猜），切片解决动态性（每次角色独立）。两层配合比单层都强。

### 3.3 前置画像表单砍掉

```text
旧：邀请后填 role/goal/stuckPoint/helpPreference/currentQuestion 五个框
新：邀请页只问 邀请码 + ≤10 字锚点（可选强引导）+ consent
goal/stuckPoint/helpPreference 改由 Agent 从遭遇推断，活在 NeedCase.profileSnapshot
```

UserProfile 降级为只承载锚点。理由：用户来这里是找工具，不是填问卷；勉强填也是应付，调查质量差。真正好的调查样本是真实需求里的自然流露，不是问卷。

### 3.4 ≤10 字自报锚点 > 下拉框标签

```text
人怎么自我定义，比人口统计标签值钱十倍
"大三计算机学生" vs 下拉框选"学生" —— 前者藏着选题钩子
强制 ≤10 字 = 逼用户抓住自我认同核心，有"人味"
```

UI 给 3-4 个常见身份做示例 chip（点一下填入、可改），但主战场是自由输入框，绝不做下拉框锁死标签。

### 3.5 选题系统 = 雷达 + 判断辅助器，不是选题生成器

```text
系统做：扫描需求 → 降噪聚类 → 给证据（密度/角色分布/已有内容/时机）
人做：做不做、什么标题、什么角度 —— 最后一公里不自动化
```

理由：用户说出的需求永远不是选题（"我不会编程"≠"零基础不写代码用 AI 做数据分析"），提炼是创作者的活。系统试图替代这步，做出来的都是正确的废话。数据是参谋，站主是主帅。

### 3.6 反馈是最贵的资产

```text
match-feedback 的 8 种类型（resolved/stuck/want-tutorial/...）
不是给系统看，是给站主看的命中率仪表盘
点赞是情绪，resolved 是"我真的会了"
```

每篇已发布内容关联它服务的需求簇，显示 resolved/stuck 比例。这是自媒体人最缺的反馈环，本系统天生就有。

### 3.7 选题池双源

```text
源 1：用户需求（NeedCase 聚类）
源 2：站主自己的灵感（轻量输入）
两个源平起平坐汇入选题池
"用户在问 + 我正好有想法"同时命中 = 最好的选题
```

个人节点的独特优势是真实——选题来自真实遇到的需求，不是数据编出来的。系统要放大这个真实，别把它机构化。

## 4. 完成定义

一个受邀用户能在浏览器走通：邀请码 → 填 ≤10 字锚点 → 提问 → 得到带锚点 + 遭遇切片理解的推荐 → 反馈。站主能在选题工作台俯瞰需求簇、判断选题、看命中率、一键生成创作简报跳编辑器。未受邀访客被 gate 在交互功能外，只能看公开内容。

## 5. 边界

### 5.1 In scope（本轮做）

- 认证 gate 前端（ToolMatchChat 未受邀引导邀请）
- 邀请页组件（邀请码 + ≤10 字锚点 + consent + 示例 chip）
- 遭遇画像（AgentOrchestrator 遭遇切片推断 + UserProfile 锚点重构）
- 选题工作台（admin review 升级：按需求簇俯瞰）
- 需求聚类（TopicCandidate 复活，语义改"需求簇"）
- 命中率仪表盘（反馈回流，每篇内容 resolved/stuck）
- 创作简报（选题 → 简报 → 跳内容编辑器）
- 站主灵感入口

### 5.2 Non-goals（本轮不做，也不近期做）

- 完整账号系统 / GitHub OAuth 注册（未来轮）
- 内容草稿 AI 代写（给创作简报，绝不代写正文）
- graph.json / Publish Interface
- Skill 准入 / 经验验证系统（U10/U11）
- 多 Agent 角色产品化
- NorthStar 社区本体（U18）

### 5.3 Deferred（后续轮）

- TopicCandidate 语义聚类增强（本轮做轻量关键词 + 角色聚类）
- 经验验证 / 方法成熟度评估
- AI 接口 v2（graph.json 等）

## 6. 数据模型变更

### 6.1 UserProfile（重构）

```text
旧字段：role / goal / stuckPoint / helpPreference / currentQuestion / nickname / contact + 系统字段
新字段：personaAnchor(≤10字) + nickname(可选) + consentForProfile + confidence(基于锚点) + 系统字段
```

- 删除 role / goal / stuckPoint / helpPreference / currentQuestion（迁移到遭遇切片，不再前置收）
- contact 继续不收（零 PII 红线）
- confidence 重新定义：基于 personaAnchor 是否填写（0 或 1，或锚点长度分档）
- 不写兼容代码：一次性改完所有引用（ports / store / service / api / orchestrator / test）

### 6.2 ProfileSnapshot（语义升级）

```text
旧：从 UserProfile 拷贝一份静态画像
新：每次遭遇 Agent 推断的角色切片
  {
    roleInContext: 本次推断角色（参考锚点）
    goal: 本次目标
    stuckPoint: 本次卡点
    socialContext: 社会关系线索（可选）
    capturedAt
  }
```

存在 `NeedCase.profileSnapshot`（per-case，结构天然支持）。推断参考 `UserProfile.personaAnchor` 作为默认底色。

### 6.3 NeedCase（结构不变，profileSnapshot 语义升级）

profileSnapshot 从"画像拷贝"升级为"本次遭遇切片"。其余字段（needSummary / needCategories / frictionLayer / agentRecommendation / safetyFlags / adminReviewStatus / feedbackStatus / topicProcessedAt）不变。

### 6.4 TopicCandidate（复活，语义改"需求簇"）

```text
不是自动选题，是聚类后的选题候选
字段：
  clusterKey（聚类键）
  density（需求密度 = 多少 NeedCase）
  roleDistribution（角色分布，来自各 case 的 profileSnapshot.roleInContext）
  representativeNeed（代表性需求摘要）
  relatedContentIds（站内已有相关内容）
  status（observed / accepted / deferred / ignored / produced）
  producedContentSlug（已创作内容回填）
```

## 7. Agent 应用分层设计

本轮系统按 Agent 应用四层拆解审理：业务层 / 工具层 / 记忆层 / 安全层（编排层归入业务+安全讨论，观测层即选题工作台与命中率仪表盘）。每层职责、本轮落点、失败处理如下。

### 7.1 业务层

职责：定义"帮谁完成什么事"——流程和核心对象。

本轮业务流程：

```text
访客到达
-> 后端 gate 检查认证状态
-> 未受邀：/api/match 返回 401，前端引导邀请码
-> 邀请码验证 + ≤10字锚点 -> 成为 invited 用户
-> 提问（/api/match 放行）
-> Agent 遭遇切片推断（读锚点 + 推断本次角色）
-> 匹配推荐
-> NeedCase 落库（锚点引用 + 遭遇切片）
-> 用户反馈
-> 需求聚类 -> 选题簇
-> 站主选题工作台判断
-> 创作简报 -> 编辑器 -> 发布
-> 命中率回流（反馈 -> 内容）
```

核心对象：InvitedSession / UserProfile(personaAnchor) / NeedCase(+遭遇切片) / TopicCandidate(需求簇) / Feedback / ContentBrief

业务边界（钉死）：

```text
1. gate 功能清单
   gate（需受邀）：ToolMatchChat 提问、画像读写、反馈提交
   不 gate（访客可用）：文章阅读、工具列表浏览、Pagefind 搜索、点赞、公开统计 /api/stats
2. 一问一切片：一次提问取主角色信号一个切片，不搞一问多角色
3. 锚点不自动改写：锚点只用户主动改才变；历史遭遇切片不可变，不回溯修改
```

### 7.2 工具层

职责：Agent 可调用的能力，每个工具声明输入/输出/权限/失败返回/是否写数据。

本轮工具清单：

| 工具 | 输入 | 输出 | 权限 | 失败返回 | 写数据 |
| --- | --- | --- | --- | --- | --- |
| 邀请码验证 | code | admitted+sessionId | public | 无效/已用完→拒绝 | 是（建session+增usedCount） |
| 锚点保存 | sessionId+personaAnchor(≤10字) | profile | invited | 存储失败→不阻断准入，confidence=0 | 是 |
| 遭遇切片推断 | messages+personaAnchor | roleInContext/goal/stuckPoint/socialContext | invited(内部) | 推断不出→静默降级到锚点+摘要，标 sliceInferred=false | 否（结果写 NeedCase） |
| 需求聚类 | 未处理 NeedCase 集 | 需求簇 | Cron/admin | 失败→保留未处理，下次重试 | 是 |
| 创作简报 | 选题簇 | 简报(角色/卡点/可引用/建议结构) | admin | 生成失败→降级返回原始簇数据 | 否（一次性生成） |

### 7.3 记忆层

职责：保存系统上下文，核心问题是"这件事后来怎么样了"。

记忆对象生命周期：

```text
锚点(personaAnchor)：常驻，用户主动改才变，不自动覆盖
遭遇切片(profileSnapshot)：per-NeedCase 定格，不可变，多条累积成角色图谱
需求簇(TopicCandidate)：派生记忆，可从 NeedCase 重建，不怕丢
命中率关联：内容 <-> 簇 <-> 反馈，三角稳定，反馈能回溯到 NeedCase 和簇
```

删除请求关联处理（本轮补）：

```text
用户请求删画像 -> UserProfile.deleteRequestedAt 软删除标记
相关 NeedCase：rawNeedRedacted 清空、profileSnapshot 清空（脱敏），保留聚合统计匿名性
不立即物理删，管理员定期清理
Feedback 保留（已脱敏聚合），不回溯删
```

### 7.4 安全层（出错怎么办）

铁律：

```text
用户体验可降级
数据不能乱写
权限不能放宽
隐私不能泄露
Agent 不确定时停下或交给人，不强行推荐
```

后端 gate 决策（关键，已确认）：

```text
/api/match 鉴权从 public 可调改为 invited/admin 才可调
public 调 /api/match 返回 401（前端引导邀请）
前端 gate 只是配合体验，真正的门在后端
符合"权限不确定默认拒绝"
```

本轮十个失败场景的处理矩阵：

| # | 失败场景 | 系统处理 | 阻断用户 | 记录 | 交给人 |
| --- | --- | --- | --- | --- | --- |
| A1 | 邀请码无效/已用完 | 拒绝准入，不建 session，不增 usedCount | 是 | 尝试计数（不记敏感） | 暴力枚举告警 |
| A2 | 锚点保存失败 | 不阻断准入，session 已建，confidence=0 | 否 | Incident(low) | 管理员后续补 |
| A3 | 遭遇切片推断失败 | 静默降级：切片={role:锚点,goal:摘要}，标 sliceInferred=false | 否 | 低置信度标记 | 工作台标灰人工判 |
| A4 | NeedCase 保存失败 | 用户照常拿推荐，needCaseId=undefined | 否 | Incident(medium) | 连续失败→待复盘队列 |
| A5 | 需求聚类失败 | 保留未处理，下次 Cron 重试 | 否(后台) | Incident | 管理员手动触发 |
| A6 | 创作简报生成失败 | 降级返回原始簇数据（不调 AI） | 否 | 日志 | 站主手动写 |
| A7 | PII 泄露(红线) | 锚点≤10字+PII检测；提问脱敏；切片基于脱敏文本 | 视情况 | safetyFlags.piiDetected | — |
| A8 | 权限越界/绕gate | 后端鉴权拒(401/403) | 是 | 权限失败计数 | 异常频率告警 |
| A9 | 锚点滥用(刷/注入/超长) | ≤10字+服务端校验+修改频率限制 | 视情况 | 修改日志 | — |
| A10 | 删除请求 | 软删除标记+关联脱敏 | 否 | deleteRequestedAt | 管理员定期清理 |

两个本轮特有重点风险：

风险一：遭遇切片推断失败（A3）—— 静默降级，绝不报错

```text
推断可能失败的情况：对话太短、无角色信号、纯工具问题（如"GLM 怎么注册"）
处理铁律：推断失败时用户绝对看不到错误
降级路径：切片={roleInContext:锚点, goal:needSummary, stuckPoint:undefined}
NeedCase 标记 sliceInferred=false（低置信度）
推荐照常返回，低置信度切片在工作台标灰，不进自动聚类高质量池
理由：用户来找工具，不在乎 Agent 没听懂他是谁；报错=把内部失败甩给用户=体验崩
```

风险二：后端 gate（A8）—— 真门在后端

```text
前端 gate 懂技术的人一 curl 就绕过
后端 /api/match 对 public 返回 401，invited/admin 才放行
ToolMatchChat 前端 gate 只是配合体验（未受邀显示邀请入口）
真正的权限门在后端鉴权层
```

零 PII 检测点（红线）：

```text
锚点写入前：≤10字 + redactSensitiveText 检测，命中 PII 拒绝/提示重填
提问脱敏：已有(Phase 1-4 redactSensitiveText)，切片基于脱敏文本推断
切片写入前：确保推断不把脱敏前内容带进切片
```

## 8. Phases（本轮拆三阶段）

### Phase A: 认证 gate + 邀请页 + 遭遇画像（地基闭环）

目的：让受邀用户浏览器走通"邀请 → 锚点 → 提问 → 带锚点+切片的 NeedCase"。

- UserProfile 重构为 personaAnchor（ports / store / service / api / orchestrator 一次性改完）
- `/api/invite/verify` POST 增 personaAnchor 可选字段，准入时存 UserProfile
- `/api/profile` POST 字段缩减为 personaAnchor（+ nickname 可选）；GET 返回锚点
- AgentOrchestrator 改造：遭遇切片从对话推断（参考锚点），不再从 UserProfile 拷贝
- 邀请页组件（邀请码 + ≤10 字锚点 + consent + 示例 chip，Lucide 图标，无 Emoji）
- ToolMatchChat gate：未受邀显示邀请入口；受邀显示锚点记忆条；身份探测
- 砍前置画像表单相关代码

Exit proof：浏览器走通受邀全链路，NeedCase 同时带 personaAnchor 引用 + 本次遭遇切片；未受邀被 gate。

### Phase B: 选题工作台 + 需求聚类

目的：让站主从"逐条复盘 NeedCase"升级到"按需求簇俯瞰选题"。

- TopicCandidate 复活（需求簇模型 + 轻量聚类：关键词 + 角色）
- 聚类批处理（复用 `/api/match-process` Cron 路径或新增）
- admin review 升级为选题工作台：簇视图（密度 / 角色分布 / 代表性需求 / 已有内容）+ 逐条视图切换
- 站主灵感入口（admin 轻量输入框 + API，进选题池）

Exit proof：后台能看需求簇俯瞰，密度/角色分布可见，灵感能进同一池。

### Phase C: 命中率仪表盘 + 创作简报

目的：闭环创作端，让反馈回流成命中率，让选题能快速进创作。

- 命中率仪表盘：每篇已发布内容关联需求簇，显示 resolved/stuck 比例
- 创作简报：选题簇 → 一键生成简报（目标角色 / 核心卡点 / 站内可引用 / 建议角度 / 建议结构）→ 跳 `/admin/content/edit`
- 简报只给框架和弹药，不代写正文

Exit proof：选题能生成简报并跳编辑器；命中率仪表盘可见每篇内容的 resolved/stuck。

## 9. 关键 API 变更

| API                                                   | 变更                                           | Phase |
| ----------------------------------------------------- | -------------------------------------------- | ----- |
| `POST /api/invite/verify` | 增 personaAnchor 可选字段，准入时存 UserProfile        | A     |
| `GET/POST /api/profile`                               | POST 字段缩减为 personaAnchor（+nickname）；GET 返回锚点 | A     |
| `POST /api/match`                                     | 鉴权 public→invited（后端 gate，见 §7.4）；cookie 解析身份；Agent 推断遭遇切片                   | A     |
| AgentOrchestrator.handleNeed                          | 遭遇切片推断逻辑（核心改动）                               | A     |
| `GET /api/admin/review`                               | 增按簇聚合视角（?view=clusters）                      | B     |
| `POST /api/admin/topic-clusters` 或复用 match-process    | 需求聚类批处理                                      | B     |
| `POST /api/admin/inspiration`                         | 站主灵感入口                                       | B     |
| `GET /api/admin/hit-rate` 或并入 review                  | 命中率仪表盘数据                                     | C     |
| `POST /api/admin/brief`                               | 选题 → 创作简报                                    | C     |

## 10. 验收标准（Pass criteria）

### Phase A

- [ ] 浏览器走通：邀请码 → ≤10 字锚点 → 提问 → NeedCase 带 personaAnchor 引用 + 遭遇切片
- [ ] 未受邀访客在 ToolMatchChat 看到 gate（邀请入口），不能直接提问
- [ ] 受邀后 ToolMatchChat 记忆条显示锚点
- [ ] Agent 遭遇切片参考锚点，每次提问独立推断（同用户多次提问角色可不同）
- [ ] UserProfile 不再收 goal/stuckPoint/helpPreference（表单已砍）
- [ ] 零 PII：不收手机 / 邮箱 / 身份证
- [ ] vitest 覆盖 invite / profile / orchestrator 遭遇切片核心行为
- [ ] astro check 0 errors；npm run build 通过

### Phase B

- [ ] 后台选题工作台能按需求簇俯瞰
- [ ] 每簇显示密度 / 角色分布 / 代表性需求 / 已有相关内容
- [ ] 站主灵感能进选题池，与需求簇并置
- [ ] 簇视图与逐条视图可切换

### Phase C

- [ ] 命中率仪表盘显示每篇已发布内容的 resolved/stuck 比例
- [ ] 选题簇能一键生成创作简报
- [ ] 简报能跳 `/admin/content/edit`
- [ ] 简报只给框架不给代写正文

## 11. 风险与边界守护（速览，详见 §7.4 安全层失败矩阵）

```text
不写兼容代码：UserProfile 重构一次性改完所有引用，不留双轨
遭遇切片推断失败 -> 降级到锚点（不阻断用户响应）
选题判断最后一公里不自动化（系统给证据，人决定）
零 PII 红线：任何环节不收手机/邮箱/身份证
Agent 不确定时停下来或交给人，不强行推荐
个人节点不机构化：放大真实，不做推荐算法/审核流/社交
```

## 12. 需要 Walker 确认

1. ≤10 字锚点必填还是可选强引导？（本 PRD 建议：可选强引导，零注册摩擦）
2. 选题聚类本轮做多深？（本 PRD 建议：轻量关键词 + 角色聚类，不做语义向量聚类）
3. 创作简报是否含 AI 生成的结构建议？（本 PRD 建议：含建议结构，但不代写正文）
4. 站主灵感入口形态？（本 PRD 建议：admin 一个轻量输入框 + API，进选题池）
5. Phase A 完成后是否暂停 review，还是 A/B/C 连续推？（本 PRD 建议：A 完成后 review 一次，再推 B/C）

## 13. 与总账 PRD 的关系

本 PRD 是总账 `prd.md` 中 U1（邀请认证画像）/ U2（需求闭环）/ U4（内容创作闭环）的本轮执行细化，不替代总账。总账的 U3（数据边界）/ U5-U18 不在本轮范围。本轮完成后，执行结论回写 `execution-log-current.md`，总账相关章节状态更新。
