# 未完成蓝图总 PRD

Generated: 2026-06-14

Stage: AdgaiWalker 个人系统 / 发布接口桥接

## 1. 一句话结论

本 PRD 把当前 blueprint 中仍未完成、部分完成但未闭环、以及已经有骨架但未达到验收标准的模块收拢为一个总入口；但它的产品主线不是“补齐一堆模块”，而是继续建设一个从用户端到管理端的创作者需求管理系统。

当前目标模型是：

```text
用户端
  -> 用户认证状态
  -> 邀请码准入
  -> 用户授权功能
  -> 需求调查 / 需求匹配 / AI 聊天
  -> 用户获得工具、内容、行动建议

管理端
  -> 管理员认证状态
  -> 文章编辑与实时管理
  -> 查看用户需求、对话、反馈、选题候选
  -> 原始信息积累、分析、定标准
  -> 从选题推进到作品交付

Agent 系统
  -> 分析用户输入
  -> 匹配工具和内容
  -> 沉淀需求事件
  -> 辅助站主复盘、选题、创作和方法沉淀
```

本 PRD 不替代专项 PRD 的细节；它负责做“不遗漏模块”的总账、优先级、边界和验收入口，并把所有模块挂到“用户端 -> 管理端 -> Agent -> 内容交付”的主线下。

## 2. 当前 Reality 快照

### 2.1 已有基础

- Astro 6 + Vercel SSR adapter。
- Tailwind CSS v4 + 全局 CSS 变量。
- Astro Content Collections，集合名为 `log`。
- Pagefind 搜索。
- Upstash Redis 点赞与需求数据存储。
- Giscus 评论。
- `/llms.txt`、`/walker-style.md`、`/index.json` AI 基础接口。
- `/content` 内容宇宙基础页。
- `/about` 轻量数据台。
- `/admin`、`/admin/insights`、`/admin/topics`、`/admin/ai-gateway`、`/admin/content`。
- ToolMatchChat + `/api/match` 需求匹配入口。
- `/api/match-process` 批处理入口。
- `/api/match-feedback` 反馈入口。
- `/api/match-history` 历史查看入口。
- `/api/stats` 公开聚合统计。
- `/api/insights` 后台洞察 API。
- `/api/admin/conversations` 管理员对话查看。
- `/api/admin/content/[slug]` 内容 CRUD。
- `/api/admin/invite-verify` 临时邀请码验证入口。
- MCP 基础工具：`walker_query`、`walker_search`、`walker_get`、`walker_stats`、`walker_insights`。
- 四层架构骨架：`services / stores / ports / API`。
- 数据边界基础服务：`visibility.service.ts`。
- 邀请码服务骨架：`invite.service.ts`、`invite-code.store.ts`。
- 需求事件、会话、反馈、TopicCandidate 数据结构。
- 用户画像 Port 类型：`UserProfileRepositoryPort`。

### 2.2 已经不是“未开始”的部分

这些项目在旧文档中可能仍写着“未开始”，但 reality 已经有基础骨架；本 PRD 按“部分完成，未闭环”处理：

- 邀请制身份入口：已有邀请码 P0 和基础边界，但用户入口、轻量会话、画像上下文还未完成。
- 内容迁移：`form / domain / intent / valueMode / aiUsePolicy / related / summary` 已补齐；仅 `updated` 仍有少量缺口。
- 反馈数据台：需求事件、反馈、洞察、TopicCandidate、后台页已有基础；缺少内容创作闭环和反向关联。
- Agent / MCP：基础工具已完成；权限验收、六模块边界迁移、真实样本质量验证未完成。

## 3. 当前未完成模块总表

| 编号 | 模块群 | 当前状态 | 未完成范围 | 优先级 |
| --- | --- | --- | --- | --- |
| U1 | 邀请制用户认证授权与身份画像上下文 | ✅ 已完成（PR #9） | 邀请 gate / InviteGate / personaAnchor 锚点 / 遭遇切片 / user-context / profile service / 删除脱敏 全量落地 | P0 |
| U2 | 用户需求闭环整合 | ✅ 已完成（PR #9） | 需求→反馈→选题簇→命中率闭环贯通 | P0 |
| U3 | 数据边界与权限验收 | 部分完成（PR #12） | MCP AI-0 过滤 + walker_insights 字段白名单已做；/api/stats 聚合 + admin 鉴权 + MCP 默认 public 已确认；剩 Gateway logs/前端 key 逐行确认 + 系统性边界测试 | P0 |
| U4 | 内容创作闭环 | ✅ 已完成（PR #9） | 选题簇→简报→编辑器→sourceTopicId 回连→producedContentSlug 全通 | P1 |
| U5 | 内容治理与字段迁移 | 部分完成（PR #13） | 编辑器保存前字段校验已做；新字段（form/domain/intent/valueMode/aiUsePolicy/related）经 YAML textarea 已支持；剩补少量内容 `updated` | P1 |
| U6 | 内容宇宙 UI/UX | 部分完成 | 时间线、网格、图集、点子流、多视图、生活切片、作品展示、点子状态卡、移动端体验未完成 | P1 |
| U7 | 反馈数据台 v1 完整闭环 | 部分完成 | 搜索无结果记录、热门内容、内容表现矩阵未完成（#9 已做命中率仪表盘） | P1 |
| U8 | Agent 应用分层与安全层迁移 | 部分完成（PR #10 推进） | 六模块：Perception / Memory / Orchestration ✅ 已拆（#10）；剩 Safety（失败矩阵系统化）/ Tools（补齐声明）/ Observability（字段白名单） | P1 |
| U9 | 规则候选池与评测集 | 未开始 | 规则状态、人工标注、回放评测、分层准确率和推荐有效率评估未实现 | P1 |
| U10 | 经验验证系统 | 未开始 | 原始事件采集、原话保真、反馈结果、复盘修正、模式分析、反例管理、方法成熟度评估未实现 | P1 |
| U11 | Skill 准入与 Agent 路由系统 | 未开始 | 内容分层、准入判断、定义域检查、方法卡、Skill 注册、调用反馈未实现 | P2 |
| U12 | 内容意图与需求关系工程化 | 文档有效，工程未完全落地 | 需求来源关联、公开边界、AI 使用边界、内容版本、创作决策未进入完整工作流 | P2 |
| U13 | AI 可读接口 v2 | 基础版完成 | 自动生成 `llms.txt`、`graph.json`、增强 `index.json`、JSON-LD、related graph、半自动维护 `walker-style.md` 未实现 | P2 |
| U14 | MCP 私有洞察验收 | 部分完成 | `walker_insights` 私有开关已有；字段白名单、真实样本验证、权限回归测试未完成 | P2 |
| U15 | 生产环境内容写回 | 部分完成 | GitHub token 配置、权限确认、保存失败提示、生产写回验收未完成 | P2 |
| U16 | Publish Interface 发布接口 | 文档存在，工程未开始 | PublishCandidate、VisibilityPolicy、PublishTransformer、CommunityAdapter、FeedbackIngestion 未实现 | P3 |
| U17 | Spec Kit / OpenSpec 桥接 | 文档存在，工程未开始 | `PRD -> architecture -> plan -> todo -> log -> archive/skill` 可回放链路未跑通 | P3 |
| U18 | NorthStar 社区网络 | 长期并行，不进入本轮 reality | 个人系统网络、点子协作、角色、贡献、协作空间、审核与权限属于独立社区本体 | Later |

### 3.1 PRD 边界决策

本项目当前不拆分新的执行 PRD。`references/working/prd.md` 同时作为：

```text
未完成蓝图总账
-> 当前执行 PRD
-> 架构边界入口
-> 分阶段验收入口
```

不拆分的理由：

- 当前系统仍是 Walker 个人系统的同一条主旅程，不是多个独立产品。
- 邀请准入、需求匹配、后台复盘、内容创作、经验沉淀和 Agent 安全层彼此依赖，过早拆分会打断上下文。
- 当前最重要的是保持一份完整决策入口，避免 PRD 再次分散。
- 执行粒度由 Phase 控制，文档粒度保持单一。

执行原则：

```text
一个总 PRD
多个 Phase
每个 Phase 有独立验收
不另开平级 PRD
必要时只补 architecture / plan / todo / execution log
不写兼容代码
```

当前执行区文档身份规则：

```text
prd.md = 需求分析 + 功能设计 + 架构设计
plan.md = 基于 prd.md 的开发规划、阶段顺序、依赖关系
to-do list.md = 基于 prd.md 和 plan.md 的可执行、可验收任务清单
goal 不作为当前执行区独立文档类型；原 goal 内容沉入 to-do list
```

### 3.2 Need Case 模型决策

当前已确认：

```text
Need Case 直接取代 DemandEvent 的主业务地位。
不做长期双轨。
不做兼容 shim。
不做双写。
不保留“新旧都可以”的模糊状态。
```

迁移原则：

```text
先定义 Need Case 为唯一主模型
新接口和新服务直接围绕 Need Case 实现
旧的 DemandEvent 只作为待迁移旧结构看待，不再继续扩字段和职责
如果旧代码必须调整，就直接改调用方，不加兼容层
```

## 4. 产品主线

### 4.1 用户端主线

用户端先解决“谁可以用、能用什么、怎么被帮助”的问题。

核心链路：

```text
访问 iwalk.pro
-> 判断认证状态
-> 区分访客 / 邀请用户 / 管理员
-> 访客只能使用公开功能
-> 获得邀请码并通过验证后，才成为“用户”
-> 邀请用户获得被授权功能
-> 用户进入需求调查或需求匹配工具
-> 用户与 AI 聊天并抛出问题、目标、材料、卡点
-> AI 分析需求
-> AI 匹配工具、内容、方法或下一步行动
-> 用户获得更好的做事路径
-> 用户反馈结果是否有帮助
```

用户端第一阶段不是完整账号系统，而是邀请制轻量认证状态：

```text
public: 访客，还不是用户
invited: 已通过邀请码的用户
admin: 管理员
```

关键定义：

```text
用户 = 被 Walker 邀请，并使用邀请码通过准入的人。
访客 = 未通过邀请码的人，只能访问公开内容和公开能力。
管理员 = Walker 或被明确授权的后台管理者。
```

### 4.2 管理端主线

管理端解决“站主如何实时管理内容、复盘需求、推进创作”的问题。

核心链路：

```text
管理员登录
-> 编辑文章 / 草稿 / 可见性 / AI 使用边界
-> 查看用户需求事件、对话摘要、反馈和选题候选
-> 对原始信息做前期积累
-> 积累到一定数量后分析模式
-> 定义判断标准
-> 把高价值需求转成选题
-> 把选题推进为文章、教程、视频、直播、工具页、方法卡或作品
-> 作品发布后回流到内容库和匹配系统
```

管理端不是普通 CMS，而是创作者的需求雷达和作品交付工作台。

### 4.3 Agent 主线

Agent 系统不是装饰功能，它是连接用户端和管理端的分析与编排层。

核心职责：

```text
理解用户输入
-> 判断需求类别、卡点层级、能力方向
-> 匹配站内工具、内容、方法和行动方案
-> 必要时追问
-> 对敏感信息脱敏
-> 生成需求事件
-> 聚类高频问题
-> 识别内容缺口
-> 生成选题候选
-> 辅助站主复盘标准和方法
```

Agent 的目标不是替用户长篇回答一切，而是帮助用户更好地干活，同时帮助 Walker 积累真实需求材料。

### 4.4 创作者闭环

最终产品闭环是：

```text
用户需求
-> AI 分析和匹配
-> 用户反馈
-> 站主积累原始信息
-> 阶段性分析
-> 定义标准
-> 选题
-> 创作
-> 作品交付
-> 作品进入内容库
-> 反哺后续用户匹配
```

这条闭环成立，AdgaiWalker 才不是“内容站 + 后台”，而是 Walker 的个人创作者操作系统。

### 4.5 Agent 应用分层

作为 Agent 应用，本系统不能只按“页面 / API / 数据库”理解，而要按 Agent 运行链路分层。

```text
业务层
-> 工具层
-> 记忆层
-> Agent 编排层
-> 安全层
-> 观测层
```

#### 业务层

业务层定义系统到底在帮谁完成什么事。

```text
邀请用户准入
用户需求调查
AI 需求匹配
用户反馈
后台复盘
选题生成
内容创作
作品交付
经验沉淀
```

业务层不关心具体用 Redis、GitHub 还是模型；它只关心用户、站主和 Agent 之间的流程是否成立。

#### 工具层

工具层定义 Agent 可以调用哪些能力。

```text
读取内容库
搜索文章
匹配工具
保存需求事件
读取用户画像
生成选题候选
创建草稿
更新文章
查询后台统计
调用模型
```

每个工具都必须有：

```text
输入
输出
权限
失败返回
是否可重试
是否会写入数据
是否需要管理员权限
```

#### 记忆层

记忆层保存系统上下文，不只保存聊天记录。

```text
短期记忆：当前会话、当前问题、最近几轮聊天
用户记忆：邀请码状态、画像、偏好、历史需求
需求记忆：Need Case、匹配结果、反馈、处理状态
内容记忆：文章、工具、项目、相关关系
经验记忆：复盘、方法卡、规则候选、skill 候选
```

记忆层的核心问题是：“这件事后来怎么样了？”而不是“聊天文本是什么？”

#### Agent 编排层

Agent 编排层决定一次请求的下一步动作。

```text
判断身份
-> 读取画像
-> 分析需求
-> 匹配工具 / 内容 / 方法
-> 判断是否追问
-> 保存需求事件
-> 返回用户
-> 等待反馈
-> 进入后台复盘
```

编排层是调度员，不应把所有业务逻辑继续堆进 `/api/match`。

#### 安全层

安全层不是只做内容安全，而是 Agent 应用的失败处理层：当某个环节出错时，系统如何降级、回滚、记录、提醒和交给人。

```text
邀请码错误 -> 拒绝准入，不创建用户会话
画像保存失败 -> 允许继续使用，但标记低置信度
AI 调用失败 -> 使用本地规则匹配降级
工具匹配失败 -> 追问用户或返回人工处理提示
需求事件保存失败 -> 不影响用户响应，但写入错误日志
内容写回失败 -> 不覆盖原文，提示管理员重试
权限不确定 -> 默认拒绝，不默认放行
敏感信息出现 -> 脱敏后再保存，必要时不保存
Agent 判断低置信度 -> 不强行推荐，先追问
连续失败 -> 进入管理员待处理队列
```

安全层原则：

```text
用户体验可以降级
数据不能乱写
权限不能放宽
隐私不能泄露
Agent 不确定时要停下来或交给人
```

失败状态不是垃圾数据，而是业务资产：

```text
错误
-> 降级处理
-> 记录原因
-> 进入待复盘队列
-> 管理员判断
-> 修规则 / 补内容 / 改工具 / 做选题
```

#### 观测层

观测层让站主知道系统哪里在工作、哪里坏了。

```text
有多少用户通过邀请码
有多少需求被提交
AI 匹配成功率
用户反馈是否有帮助
哪些需求反复出现
哪些工具推荐经常失败
哪些内容缺口最大
哪些 Agent 步骤经常报错
```

### 4.6 核心模块与依赖倒置架构

本系统不按页面拆，也不按数据库表拆，而按 Agent 业务闭环拆。

核心闭环：

```text
邀请用户
-> Need Case
-> Agent Recommendation
-> User Feedback
-> Admin Review
-> Topic Candidate / Content Work
-> Experience / Skill Candidate
```

#### 核心模块

| 模块 | 一句话职责 |
| --- | --- |
| Invite Access | 用邀请码把访客变成邀请用户，建立轻量用户身份。 |
| Authz Policy | 判断 public / invited / admin 能访问什么功能和数据。 |
| User Profile | 保存邀请用户的轻量画像、目标、卡点和帮助偏好。 |
| User Context | 汇总身份、画像、会话、当前问题，给 Agent 使用。 |
| Need Case | 把一次真实需求变成可追踪对象，而不是散落聊天记录。 |
| Conversation Intake | 接收用户输入，校验长度、轮数、来源和基础格式。 |
| Agent Orchestrator | 编排一次请求：读上下文、分析需求、调用工具、保存结果、返回用户。 |
| Need Matching | 根据需求匹配工具、内容、方法和下一步行动。 |
| Tool Execution | 封装可被 Agent 调用的工具，如搜索、写入、统计、模型调用。 |
| Memory | 保存会话、Need Case、推荐结果、反馈、选题、错误事件。 |
| Safety Layer | 某环节失败时负责降级、拒绝、回滚、记录、交给人。 |
| Feedback | 记录用户是否知道下一步、是否做出结果、方向是否错误。 |
| Admin Review | 后台复盘需求、画像、反馈、失败、内容缺口和选题候选。 |
| Topic Candidate | 把高价值需求聚合成可采纳、暂缓、忽略的选题。 |
| Content Work | 从选题生成草稿、编辑、发布、回填需求来源。 |
| Experience Validation | 从多条真实事件里提炼模式、标准、反例和方法。 |
| Skill Admission | 判断经验是否能成为 skill 候选或正式 skill。 |
| Observability | 统计系统运行、推荐质量、失败率、内容缺口和转化情况。 |
| Publish Interface | 未来把个人系统对象选择性发布到社区，不参与第一轮主链路。 |

#### 模块关系

| 关系 | 方向 | 理由 |
| --- | --- | --- |
| 触发 | 访客提交邀请码 -> Invite Access | 邀请码是成为用户的唯一入口。 |
| 调用 | Invite Access -> Authz Policy | 验证通过后需要生成 invited 权限状态。 |
| 依赖 | Invite Access -> InviteCodeRepositoryPort | 邀请逻辑不绑定 Redis、env 或文件。 |
| 实现 | RedisInviteCodeStore / EnvInviteCodeStore -> InviteCodeRepositoryPort | 本地和线上可替换。 |
| 触发 | invited 首次进入 -> User Profile | 用户成为邀请用户后才收集画像。 |
| 依赖 | User Profile -> UserProfileRepositoryPort | 画像存储要可替换，不写死实现。 |
| 调用 | Conversation Intake -> Agent Orchestrator | API 入口只解析请求，不做业务编排。 |
| 调用 | Agent Orchestrator -> User Context | 推荐前必须知道用户是谁、目标和卡点。 |
| 依赖 | Agent Orchestrator -> UserContextPort | 编排层不直接读 profile store。 |
| 触发 | 用户提问 -> Need Case | 每个真实需求都应形成可复盘对象。 |
| 依赖 | Need Case -> NeedCaseRepositoryPort | Need Case 是核心业务对象，不能绑死 Redis。 |
| 调用 | Agent Orchestrator -> Need Matching | 编排层请求匹配工具、内容、方法。 |
| 依赖 | Need Matching -> ContentRepositoryPort / ToolCatalogPort | 匹配逻辑只依赖内容和工具接口。 |
| 调用 | Need Matching -> Authz Policy | 返回结果前过滤 private / admin-only 内容。 |
| 调用 | Agent Orchestrator -> Tool Execution | 需要模型、搜索、写入、统计时走工具层。 |
| 依赖 | Tool Execution -> ToolPort | 每个工具声明输入、输出、权限、失败返回。 |
| 调用 | Agent Orchestrator -> Safety Layer | 每次关键调用前后都要有失败策略。 |
| 触发 | 工具失败 -> Safety Layer | 失败时决定降级、重试、拒绝或交给人。 |
| 调用 | Safety Layer -> IncidentRepositoryPort | 失败状态要保存，不能只丢日志。 |
| 触发 | 用户反馈 -> Feedback | 用户结果是验证推荐质量的核心证据。 |
| 调用 | Feedback -> Need Case | 反馈必须回写原需求，形成闭环。 |
| 触发 | Need Case 累积 / 失败 / 高频 -> Admin Review | 后台需要处理真实信号，而不是看散数据。 |
| 调用 | Admin Review -> Profile / NeedCase / Feedback / Topic repositories | 管理端是组合查询，不应拥有业务规则。 |
| 触发 | 管理员采纳需求 -> Topic Candidate | 需求进入创作队列。 |
| 触发 | Topic Candidate accepted -> Content Work | 选题被采纳后生成草稿或内容更新。 |
| 调用 | Content Work -> ContentRepositoryPort | 内容写入应通过接口，可用 GitHub 或本地实现。 |
| 触发 | 内容发布 -> Need Matching | 新内容回到资源池，反哺后续匹配。 |
| 触发 | 多次有效 Need Case -> Experience Validation | 反复有效才进入方法沉淀。 |
| 调用 | Experience Validation -> Skill Admission | 方法成熟后再判断是否成为 skill。 |
| 触发 | Skill 通过准入 -> Tool Execution / Agent Orchestrator | Agent 未来可调用正式 skill。 |
| 调用 | Observability -> 所有事件仓库 | 观测层只读聚合，不写业务。 |

#### 依赖倒置

业务服务层只依赖 Port，不依赖具体存储、模型、框架或文件格式。

```text
InviteCodeRepositoryPort
UserProfileRepositoryPort
UserContextPort
NeedCaseRepositoryPort
ConversationRepositoryPort
MatchingPort
ContentRepositoryPort
ToolCatalogPort
ToolPort
FeedbackRepositoryPort
TopicRepositoryPort
ContentWorkRepositoryPort
ExperienceRepositoryPort
SkillRegistryPort
SafetyPolicyPort
IncidentRepositoryPort
MetricsPort
```

具体实现放到外层：

```text
RedisNeedCaseRepository
RedisUserProfileRepository
GitHubContentRepository
AstroContentRepository
LocalToolCatalog
GatewayModelTool
McpContentTool
DefaultSafetyPolicy
AdminReviewQueueRepository
```

第一轮边界：

```text
API routes = 入口层
services = 业务层
ports = 契约层
stores/tools = 实现层
```

`/api/match` 不再继续增长业务逻辑，只调用：

```text
AgentOrchestrator.handleNeed()
```

#### 第一轮最小架构切片

```text
/api/invite/verify
-> InviteAccessService
-> InviteCodeRepositoryPort

/api/profile
-> UserProfileService
-> UserProfileRepositoryPort

/api/match
-> AgentOrchestrator
-> UserContextPort
-> MatchingPort
-> NeedCaseRepositoryPort
-> SafetyPolicyPort

/admin/review
-> AdminReviewService
-> NeedCaseRepositoryPort
-> FeedbackRepositoryPort
-> TopicRepositoryPort
```

第一轮只需要把这五个核心对象立住：

```text
Invited User
Need Case
Agent Recommendation
User Feedback
Admin Review
```

它们立住后，Topic Candidate、Content Work、Experience Validation、Skill Admission 和 Publish Interface 才有稳定挂载点。

## 5. 产品目标

### 5.1 第一目标

让一个被邀请并通过邀请码的用户能以最少步骤进入 iwalk.pro，说明自己是谁、为什么来、卡在哪里；系统用这些上下文匹配内容、工具和下一步行动；站主能复盘这个需求是否被帮到、是否值得变成内容、经验或 skill 候选。

### 5.2 第二目标

让管理员能在后台实时编辑文章、管理可见性、查看需求和反馈、处理选题候选，并把用户需求推进为真实作品交付。

### 5.3 第三目标

让 Walker 能从真实用户问题中沉淀内容、方法、经验和 skill，而不是只靠灵感或手工整理。

### 5.4 第四目标

让个人系统具备选择性发布能力：哪些内容能公开、哪些能进入 Agent、哪些能发布到社区、哪些只能留在个人系统内部，都有明确边界。

### 5.5 非目标

当前阶段不做：

- 完整社区账号系统。
- 邮箱/手机号绑定。
- 找回密码。
- 用户个人主页。
- 关注、粉丝、积分、等级。
- 社交信息流。
- 公开想法市场。
- 多人协作工作台。
- 推荐算法。
- 审核工作流。
- 平台商业化。
- 重型 CRM。
- 自动把个人内容同步到社区。
- 自动生成正式 skill 并直接上线。
- 默认收集联系方式或敏感个人信息。
- 把 NorthStar 社区复杂度塞回 AdgaiWalker 个人系统。

## 6. U1 邀请制用户认证授权与身份画像上下文

### 6.1 当前状态

已完成：

- `InviteCodeRepositoryPort`。
- `invite.service.ts`。
- `invite-code.store.ts`。
- `/api/admin/invite-verify` 临时入口。
- `UserProfileRepositoryPort` 类型定义。
- `visibility.service.ts` 基础边界服务。

未完成：

- 统一认证状态判断：public / invited / admin。
- 用户和管理员身份区分。
- 用户功能授权策略。
- 用户端功能访问守卫。
- 管理员后台访问守卫复核。
- 公开用户入口 `/api/invite/verify`。
- 管理员语义从用户入口中移走。
- 轻量会话。
- 签名 Cookie 或 Redis 会话。
- 会话保存 `sessionId`、`inviteCodeHash`、`createdAt`。
- 用户画像仓库实现。
- `profile.service.ts`。
- `/api/profile` GET。
- `/api/profile` POST。
- `/api/profile/delete-request`。
- `user-context.service.ts`。
- `/api/match` 读取画像上下文。
- 需求事件保存画像快照。
- `/api/admin/profiles`。
- 管理端查看画像、问题、匹配结果和反馈关联。
- 用户画像修改。
- 用户画像删除请求。
- 需求事件脱敏删除或删除标记。

### 6.2 邀请制认证与授权模型

第一阶段只做邀请制轻量认证状态，不做完整账号系统。

```text
public
  -> 访客，不是用户
  -> 可看公开内容
  -> 可使用明确开放的基础能力
  -> 不可读取画像、后台、需求事件详情

invited
  -> 已通过邀请码
  -> 是 Walker 当前定义下的“用户”
  -> 可保存轻量会话
  -> 可填写 / 修改自己的画像
  -> 可使用被授权功能
  -> 可查看自己的摘要结果

admin
  -> 可进入后台
  -> 可编辑文章、草稿、可见性和 AI 使用边界
  -> 可查看脱敏需求、用户画像、反馈、选题候选
  -> 可执行内容管理和复盘操作
```

授权不是社交账号权限，而是测试阶段的功能开关：

```text
canUseProfile
canUseDemandMatch
canSeeOwnHistory
canSubmitFeedback
canAccessAdmin
canEditContent
canReviewDemandEvents
canManageTopics
```

准入规则：

```text
没有邀请码的人，只是访客。
邀请码验证通过后，系统才建立用户身份和轻量会话。
用户身份不等于社区账号，不提供关注、主页、积分、社交关系。
邀请码是测试阶段的规模控制和关系入口，不是平台化注册系统。
```

### 6.3 核心字段

核心画像问题不超过 5 个：

```text
role: 学生 / 创作者 / 打工人 / 个体经营 / AI 学习者 / 其他
goal: 学 AI / 做网站 / 做内容 / 做副业 / 提效 / 找方向 / 其他
stuckPoint: 不知道方向 / 不会工具 / 不会落地 / 没有反馈 / 没有时间 / 其他
helpPreference: 找教程 / 推荐工具 / 分析问题 / 制定方案 / 看案例 / 其他
currentQuestion: 当前最想问的问题
```

可选字段：

```text
nickname
contact
```

系统字段：

```text
profileId
sessionId
inviteCodeHash
createdAt
updatedAt
consentForProfile
deleteRequestedAt
confidence
```

### 6.4 API

| API | 方法 | 权限 | 职责 | 状态 |
| --- | --- | --- | --- | --- |
| `/api/invite/verify` | POST | public | 验证邀请码，成功后建立轻量会话 | 未实现 |
| `/api/profile` | GET | invited/admin | 获取当前会话画像 | 未实现 |
| `/api/profile` | POST | invited/admin | 创建或更新当前会话画像 | 未实现 |
| `/api/profile/delete-request` | POST | invited/admin | 用户请求删除画像和相关需求事件 | 未实现 |
| `/api/match` | POST | public/invited | 提问匹配；如果有画像，读取画像上下文 | 部分完成 |
| `/api/admin/profiles` | GET | admin | 管理员查看画像列表与关联需求事件 | 未实现 |

### 6.5 验收标准

- [ ] 系统能稳定判断 public / invited / admin。
- [ ] public 明确表示访客，不等于用户。
- [ ] invited 必须由邀请码验证产生。
- [ ] 用户和管理员使用不同授权边界。
- [ ] 未通过邀请码的人不能访问用户授权功能。
- [ ] 非管理员不能访问后台管理功能。
- [ ] 有效邀请码可以通过 `/api/invite/verify` 建立轻量会话。
- [ ] 无效邀请码返回拒绝，不建立会话。
- [ ] 用户可填写不超过 5 个核心画像问题。
- [ ] 昵称和联系方式都是可选字段。
- [ ] 用户不填写画像也能继续体验，但匹配置信度标记较低。
- [ ] 用户画像能保存并被当前会话读取。
- [ ] `/api/match` 能读取画像上下文。
- [ ] 需求事件能保存画像快照。
- [ ] 管理员能看到画像、问题、匹配结果和反馈关联。
- [ ] 普通公开接口不能看到画像、联系方式、原始需求事件。
- [ ] 用户可以请求删除画像和相关需求事件。
- [ ] `vitest` 覆盖 invite/profile/visibility/user-context 核心行为。
- [ ] `npm run build` 通过。

## 7. U2 用户需求闭环整合

### 7.1 当前目标闭环

```text
邀请进入
-> 轻量画像
-> 用户提问
-> 匹配已有答案
-> 记录需求事件
-> 用户反馈
-> 管理员复盘
-> 生成选题 / 内容更新 / 方法沉淀
-> 验证后进入 Skill 候选
```

### 7.2 核心模块完整清单

| 模块 | 一句话职责 | 当前状态 |
| --- | --- | --- |
| 用户准入模块 | 用邀请码和轻量会话控制测试阶段的访问规模。 | 部分完成 |
| 用户画像模块 | 收集最少上下文，帮助系统理解用户身份、目标、卡点和期待帮助方式。 | 未完成 |
| 用户提问模块 | 接收用户真实问题，并把问题与当前画像、会话和来源关联。 | 部分完成 |
| 需求事件模块 | 把用户问题、上下文、匹配结果和反馈沉淀成可复盘的需求事件。 | 部分完成 |
| 需求匹配模块 | 根据用户问题和画像匹配已有文章、教程、工具、方法卡或 skill 候选。 | 部分完成 |
| 答案资产模块 | 提供可被匹配的公开内容、工具说明、教程、方法卡和案例。 | 部分完成 |
| 内容意图模块 | 判断内容属于个人表达、公开回答、工具笔记、方法沉淀还是 skill 候选。 | 部分完成 |
| 可见性策略模块 | 控制 public / draft / private / admin-only 内容谁能看、谁能被 Agent 调用。 | 部分完成 |
| 创作决策模块 | 判断某个需求是否值得成为文章、教程、直播选题、工具页或方法卡。 | 部分完成 |
| 内容版本模块 | 记录内容更新、历史版本、需求来源和反向关联。 | 未完成 |
| 反馈验证模块 | 记录用户是否觉得答案有帮助，并为复盘和方法验证提供依据。 | 部分完成 |
| 经验验证模块 | 从多条需求事件和反馈中识别重复有效的经验、失败边界和成功标准。 | 未完成 |
| Skill 准入模块 | 判断经验是否具备定义域、输入条件、输出形式、流程和验证标准。 | 未完成 |
| Agent 路由模块 | 决定继续追问、返回已有答案、生成方案、记录选题还是调用 skill。 | 部分完成 |
| 管理员复盘模块 | 让站主查看需求、反馈、内容缺口、选题和 skill 候选。 | 部分完成 |
| 存储接口模块 | 为画像、需求事件、反馈、内容关联和 skill 候选提供统一读写接口。 | 部分完成 |

### 7.3 验收标准

- [ ] 邀请码入口、画像、提问、匹配、反馈能跑通一条完整测试链。
- [ ] 每个用户问题都能生成或关联一条需求事件。
- [ ] 管理员能查看需求事件、匹配结果、反馈和选题状态。
- [ ] 访客不能查看任何用户画像、需求事件或私密内容。
- [ ] Agent 和 MCP 默认只读取 public 内容，私有洞察需要管理员权限或明确开关。
- [ ] 选题被采纳后能进入草稿或内容更新流程。
- [ ] 内容发布后能反向关联需求来源。
- [ ] 至少一种反复有效经验能被标记为 skill 候选，但不会自动注册为正式 skill。

## 8. U3 数据边界与权限验收

### 8.1 权限角色

```text
public: 普通访客
invited: 已通过邀请码的轻量会话用户
admin: 站主 / 管理员
agent: 站内 Agent
mcp-public: MCP 默认公开工具
mcp-private: 明确开启私有洞察的 MCP
```

### 8.2 数据边界

| 数据 | public | invited | admin | agent | MCP 默认 |
| --- | --- | --- | --- | --- | --- |
| 公开统计 | 聚合 | 聚合 | 完整 | 聚合 | 聚合 |
| 自己的画像 | 不可见 | 可见 / 可修改 | 可见 | 当前会话可用 | 不可见 |
| 他人画像 | 不可见 | 不可见 | 可见 | 不可见 | 不可见 |
| 原始需求事件 | 不可见 | 仅自己摘要 | 完整脱敏版 | 脱敏摘要 | 不可见 |
| 联系方式 | 不可见 | 自己可见 | 脱敏可见 | 不可见或脱敏 | 不可见 |
| TopicCandidate | 不可见 | 不可见 | 可见 | 可读摘要 | 不可见 |
| draft 内容 | 不可见 | 视邀请策略 | 可见 | 默认不可见 | 不可见 |
| private 内容 | 不可见 | 不可见 | 可见 | 默认不可见 | 不可见 |
| admin-only 数据 | 不可见 | 不可见 | 可见 | 仅 server-side | 不可见 |

### 8.3 未完成验收

- [ ] `/api/stats` 只返回聚合字段。
- [ ] `/admin/insights` 不出现在公开接口。
- [ ] `/api/admin/conversations` 必须管理员鉴权。
- [ ] MCP 默认只读 public 内容。
- [ ] `walker_insights` 私有数据有明确环境变量开关。
- [ ] `walker_insights` 返回字段白名单明确。
- [ ] Gateway logs 不包含密钥、完整 prompt、未脱敏输入。
- [ ] 前端永远不返回 provider key、GitHub token 或 Redis token。

## 9. U4 内容创作闭环

### 9.1 当前缺口

当前已有 TopicCandidate，但这条链路还未稳定：

```text
TopicCandidate
-> 采纳
-> 草稿
-> Obsidian 完善
-> 发布
-> 回填内容链接
-> 反向查看内容解决了哪些需求
-> 需求匹配资源池更新
```

### 9.2 未完成模块

- TopicCandidate 采纳后的内容草稿生成规则。
- 已采纳 candidate 标绿或进入创作状态。
- 草稿 frontmatter 生成。
- Obsidian 完善流程。
- 发布后内容链接回填。
- 某篇内容解决了哪些需求的反向查看。
- 新内容发布后匹配系统能推荐到。
- TopicCandidate 到文章、教程、直播选题、工具页、方法卡的分流规则。

### 9.3 验收标准

- [ ] 管理员可把 `pending` TopicCandidate 标记为 `accepted`。
- [ ] `accepted` TopicCandidate 可生成内容草稿。
- [ ] 草稿包含标题、摘要、分类、需求来源、可见性和 AI 使用边界。
- [ ] 内容发布后可回填到 TopicCandidate。
- [ ] 内容详情或后台能反向查看来源需求。
- [ ] 已发布内容进入站内资源索引。

## 10. U5 内容治理与字段迁移

### 10.1 当前状态

内容模型字段多数已补齐：

```text
form: 已补齐
domain: 已补齐
intent: 已补齐
valueMode: 已补齐
aiUsePolicy: 已补齐
related: 已补齐
summary: 已补齐
updated: 仍有缺口
```

### 10.2 未完成范围

- 补齐所有内容的 `updated`。
- 管理端编辑页支持内容意图字段。
- 管理端编辑页支持需求来源字段。
- 管理端编辑页支持 AI 使用边界字段。
- 发布前检查 visibility / aiUsePolicy / demandSourceIds。
- 内容版本关系可维护。
- `previousVersion` 和 `version` 在编辑工作流中可用。

### 10.3 验收标准

- [ ] 每篇内容能标明主要创作意图。
- [ ] 需求型内容能追溯来源需求。
- [ ] 个人表达内容不会被误当成用户答案资产。
- [ ] Agent 推荐内容前能读取 AI 使用边界。
- [ ] 内容更新能保留版本关系。
- [ ] 管理端保存前能提示缺失字段。

## 11. U6 内容宇宙 UI/UX

### 11.1 已有基础

- `/content` 页面。
- 内容宇宙 hero。
- 内容空间过滤。
- 内容卡片。
- 空状态。
- 桌面和移动基础布局。

### 11.2 未完成模块

- 时间线视图。
- 网格视图。
- 图集视图。
- 点子流视图。
- 多视图切换。
- 内容卡片视觉体系升级。
- 生活切片展示。
- 作品展示。
- 点子状态卡。
- 移动端体验细化。
- 内容空间与 `related` 关系的视觉表达。

### 11.3 验收标准

- [ ] 用户能在 `/content` 切换至少两种视图。
- [ ] 点子、生活、作品、教程在卡片上有明显差异。
- [ ] 点子状态 `thinking / validating / building / verified / archived` 可见。
- [ ] 移动端不重叠、不裁切、不依赖 hover。
- [ ] 空空间有清楚但不啰嗦的空状态。

## 12. U7 反馈数据台 v1 完整闭环

### 12.1 已完成基础

- `/about` 轻量公开数据台。
- `/admin/insights` 私有洞察。
- `/admin/topics` 选题候选页。
- `/api/match-feedback` 用户反馈。
- `getDemandStats()` 聚合。

### 12.2 未完成范围

- 搜索无结果记录。
- 热门内容。
- 内容表现矩阵。
- 推荐资料点击排行。
- 最近 30 天工具误区。
- 不同人群的主要卡点。
- 不同 AI 阶段的主要需求。
- TopicCandidate 到内容创作工作流。
- 发布后内容反向关联需求来源。
- 处理失败时保留错误状态。

### 12.3 验收标准

- [ ] 能查看最近 7 天和 30 天高频需求。
- [ ] 能查看内容缺口。
- [ ] 能查看工具误区。
- [ ] 能查看不同人群和 AI 阶段的卡点。
- [ ] 能查看推荐资料点击排行。
- [ ] 能从候选选题进入人工确认。
- [ ] 已发布内容能反向关联需求来源。

## 13. U8 Agent 应用分层与安全层迁移

### 13.1 目标边界

| 模块 | 职责 | 当前承载 | 未完成迁移 |
| --- | --- | --- | --- |
| Business Layer | 邀请准入、需求调查、需求匹配、反馈、后台复盘、选题、内容创作、作品交付、经验沉淀 | 当前散落在 PRD、API、后台页面和 Agent 逻辑中 | 需要明确业务流程和核心对象 |
| Perception | 输入、校验、压缩、脱敏、未成年人、合规风险 | `/api/match.ts`、`privacy.ts`、`sensitive.ts` | 需要抽为独立边界 |
| Memory | session、消息、需求事件、反馈、选题、公开计数 | `conversation/store.ts` | 需要收敛到 Memory API |
| Planning | 响应模式、需求类别、卡点、能力方向、资源、行动计划 | `agent/match.ts`、`pretext.ts`、`gateway.ts`、profiles | 需要稳定接口 |
| Tools & Execution | GitHub 写回、MCP、AI Gateway、统计洞察 | MCP、admin content、gateway | 需要权限统一表和测试 |
| Orchestration | 生命周期、降级、返回、持久化、session 结束 | `/api/match.ts`、`match-end`、`match-feedback`、`match-process` | 需要从 route 中抽出 |
| Safety Layer | 环节失败后的降级、回滚、记录、提醒、交给人 | 当前散落在 try/catch、fallback 和人工判断里 | 需要统一失败处理策略和待复盘队列 |
| Observability | 公开统计、后台洞察、Gateway 日志、反馈、内容缺口 | stats、insights、gateway | 需要字段白名单和日志验收 |

### 13.2 迁移顺序

1. 先确认业务层核心对象：Invited User、Need Case、Agent Recommendation、User Feedback、Admin Review、Topic Candidate、Content Work、Experience / Skill Candidate。
2. 将 `/api/match.ts` 中的输入校验和脱敏抽为 Perception。
3. 将 session/event/feedback 写入调用收敛到 Memory API。
4. 保持 `matchSiteResources()` 作为 Planning 核心。
5. 为每个工具补输入、输出、权限、失败返回、是否可重试、是否写入数据。
6. 抽出 Safety Layer：定义每个失败场景的降级、记录和交给人规则。
7. 最后抽 Orchestration，避免一次性大重构。

### 13.3 安全层失败处理矩阵

| 失败场景 | 系统处理 | 是否阻断用户 | 是否记录 | 后台动作 |
| --- | --- | --- | --- | --- |
| 邀请码错误 | 拒绝准入，不创建用户会话 | 是 | 记录尝试次数，不记录敏感信息 | 可选查看失败统计 |
| 画像保存失败 | 允许继续使用，标记低置信度 | 否 | 记录保存失败原因 | 进入待复盘队列 |
| AI 调用失败 | 使用本地规则匹配降级 | 否 | 记录模型失败原因和 route | 进入 Gateway 健康检查 |
| 工具匹配失败 | 追问用户或返回人工处理提示 | 否 | 记录低置信度或无匹配 | 进入内容缺口队列 |
| 需求事件保存失败 | 不影响用户响应 | 否 | 写入错误日志 | 后台提示数据缺失 |
| 内容写回失败 | 不覆盖原文，提示管理员重试 | 是，仅阻断写操作 | 记录 GitHub/API 错误摘要 | 管理员重试 |
| 权限不确定 | 默认拒绝，不默认放行 | 是 | 记录权限判断失败 | 管理员检查配置 |
| 敏感信息出现 | 脱敏后再保存，必要时不保存 | 视情况 | 记录 PII detected / removed | 不展示原文 |
| Agent 判断低置信度 | 不强行推荐，先追问 | 否 | 记录低置信度 | 可进入规则优化 |
| 连续失败 | 降级为人工处理提示 | 视场景 | 记录连续失败链路 | 进入管理员待处理队列 |

### 13.4 验收标准

- [ ] 超长请求在进入推荐逻辑前被拒绝。
- [ ] PII 在保存和规划前已替换。
- [ ] 未成年人场景有 `isMinorContext` 标记。
- [ ] `/api/stats` 只读聚合计数。
- [ ] `/admin/insights` 和 `/api/admin/conversations` 需要管理员或系统 secret。
- [ ] `matchSiteResources()` 可独立返回结构化结果。
- [ ] 合规入口只做合规转向。
- [ ] 资源推荐来自站内索引。
- [ ] 未登录写内容返回 401。
- [ ] MCP 默认只返回 public 内容。
- [ ] Gateway 失败时有 fallback。
- [ ] 每个可调用工具都有失败返回定义。
- [ ] 权限不确定时默认拒绝。
- [ ] 内容写回失败不会覆盖原文。
- [ ] 需求事件保存失败不影响用户响应，但会被记录。
- [ ] Agent 低置信度时会追问或交给人工处理，不强行推荐。
- [ ] 连续失败能进入管理员待处理队列。

## 14. U9 规则候选池与评测集

### 14.1 未完成模块

- 规则候选池页面。
- 规则状态流转。
- 人工标注。
- 回放评测。
- 历史样本集。
- 直播样本导入。
- 真实反馈样本导入。
- 卡点分层准确率。
- 能力方向准确率。
- 合规转向正确率。
- 推荐后“解决了”比例。
- “不适合 / 还卡着”回流原因。

### 14.2 规则状态

```text
observed
candidate
validated
stable
retired
```

### 14.3 验收标准

- [ ] 每条规则候选能绑定来源样本。
- [ ] 每条规则候选能标记状态。
- [ ] 每条规则候选能记录正例和反例。
- [ ] 每次 prompt 或规则变化能跑一组回放样本。
- [ ] 后台能看到推荐有效率和失败原因。

## 15. U10 经验验证系统

### 15.1 核心路径

```text
记录真实事件
-> 保存原话
-> 标注场景
-> 记录初步判断
-> 记录帮助动作
-> 收集反馈结果
-> 复盘修正
-> 识别需求模式
-> 提炼成功标准
-> 生成 Skill 候选
```

### 15.2 模块完整清单

| 模块 | 一句话职责 | 状态 |
| --- | --- | --- |
| 原始事件采集模块 | 记录直播、某鱼、网站、AI 对话、教程反馈等真实发生的用户事件。 | 未实现 |
| 原话保真模块 | 保存用户原始表达，避免过早总结导致需求失真。 | 未实现 |
| 场景标注模块 | 标注事件来源、用户身份、发生场景、表层需求和上下文条件。 | 未实现 |
| 弱假设记录模块 | 记录当时对用户真实需求的初步判断，并明确这是可推翻假设。 | 未实现 |
| 帮助动作记录模块 | 记录当时给出的文章、方法、工具、Skill、教程或人工建议。 | 未实现 |
| 反馈结果模块 | 记录用户反应和后续结果，包括成功、失败、无反馈、待观察。 | 未实现 |
| 复盘修正模块 | 对比初始判断和最终结果，修正需求理解、方法有效性和失败原因。 | 未实现 |
| 需求模式分析模块 | 从多条真实事件中发现反复出现的问题、需求、失败模式和成功条件。 | 未实现 |
| 成功标准提炼模块 | 从已验证事件中提炼“什么算帮到了用户”的可观察标准。 | 未实现 |
| 实践样本池模块 | 汇总已记录、已反馈、已复盘的真实事件，作为认识和提炼规律的事实基础。 | 未实现 |
| 矛盾识别模块 | 从用户原话、场景、行动和结果中识别表层矛盾、真实矛盾和潜在矛盾。 | 未实现 |
| 主要矛盾判断模块 | 判断当前事件中最决定行动结果的关键矛盾，避免被表层需求带偏。 | 未实现 |
| 条件边界模块 | 记录方法成立所需的身份、场景、资源、时机、技术条件和外部约束。 | 未实现 |
| 失败边界模块 | 记录方法在哪些输入、场景或条件下失效，用于定义 Skill 的不可求解范围。 | 未实现 |
| 规律候选模块 | 将已抽象经验提升为“可能的规律”，但保留待验证状态。 | 未实现 |
| 再实践验证模块 | 将规律候选重新用于新事件，检验它是否能继续帮助用户。 | 未实现 |
| 反例管理模块 | 保存推翻原判断的事件，用反例修正定义域、方法边界和成功标准。 | 未实现 |
| 方法成熟度评估模块 | 判断经验处于素材、方法雏形、稳定方法、Skill 候选还是正式 Skill。 | 未实现 |

### 15.3 First MVP Loop

```text
记录一条真实事件
-> 保存用户原话
-> 标注身份 / 场景 / 表层需求
-> 记录初步判断
-> 记录给出的帮助
-> 记录用户反馈和结果
-> 复盘判断是否修正
-> 人工标记是否出现需求模式
```

### 15.4 验收标准

- [ ] 每条事件能保留用户原话。
- [ ] 每条事件能标注来源、场景、身份和表层需求。
- [ ] 每条事件能记录当时判断和帮助动作。
- [ ] 每条事件能记录反馈结果。
- [ ] 复盘时能对比“初始判断”和“最终结果”。
- [ ] 多条事件能被聚合为需求模式。
- [ ] 失败案例能作为反例修正边界。

## 16. U11 Skill 准入与 Agent 路由系统

### 16.1 核心路径

```text
输入一段经验材料
-> 内容分层
-> Skill 准入判断
-> 生成定义域 / 输入条件 / 输出形态 / 验证标准
-> 管理员确认
-> 注册为 Skill 或降级为方法卡
```

### 16.2 模块完整清单

| 模块 | 一句话职责 | 状态 |
| --- | --- | --- |
| 内容分层模块 | 判断内容属于原始材料、知识卡、方法卡、Skill 候选、正式 Skill 还是 Agent 流程。 | 未实现 |
| Skill 准入判断模块 | 判断一个经验是否具备定义域、输入条件、输出形态、判断流程和验证标准。 | 未实现 |
| 定义域检查模块 | 判断用户输入是否在某个 Skill 可处理范围内。 | 未实现 |
| 方法卡模块 | 承载经验背后的判断规律，是 Skill 的方法来源。 | 未实现 |
| 知识库模块 | 存放文章、案例、对话摘要、工具说明、历史版本等可引用资源。 | 部分完成 |
| Skill 注册模块 | 管理已通过准入的 Skill，包括名称、触发条件、边界、关联资源和版本。 | 未实现 |
| Agent 路由模块 | 根据用户问题决定调用哪个 Skill，或选择追问、拒绝、转交、降级。 | 部分完成 |
| 工具执行模块 | 执行检索、生成、写入、版本读取、内容更新等具体动作。 | 部分完成 |
| 权限与可见性模块 | 控制 public、draft、private、admin-only 内容谁能看、谁能调用。 | 部分完成 |
| 管理员工作台模块 | 给站主维护内容、审核 Skill、编辑方法卡、查看关联资源和测试 Agent。 | 部分完成 |
| 反馈与验证模块 | 记录 Skill 是否达成结果，用反馈反向修正定义域和验证标准。 | 未实现 |

### 16.3 验收标准

- [ ] 每个 Skill 候选都有定义域。
- [ ] 每个 Skill 候选都有输入条件、输出形态和验证标准。
- [ ] 定义域外的问题不会强行调用 Skill。
- [ ] 管理员可以把候选批准为 Skill，也可以降级为方法卡。
- [ ] Agent 调用 Skill 前经过权限与可见性过滤。
- [ ] Skill 使用后能记录是否有效。

## 17. U12 内容意图与需求关系工程化

### 17.1 内容类型规则

| 内容类型 | 是否看用户需求 | 是否可公开 | 是否可进入 Agent | 工程状态 |
| --- | --- | --- | --- | --- |
| 个人思考 | 不看用户需求 | 由站主决定 | 默认只作背景，除非明确开放 | 部分实现 |
| 生活记录 | 不看用户需求 | 由站主决定 | 默认不进入任务执行 | 部分实现 |
| 工具笔记 | 可参考用户需求 | 可公开 | 可进入推荐和解释 | 部分实现 |
| 教程文章 | 主要看用户需求 | 可公开 | 可进入答案匹配 | 部分实现 |
| 方法卡 | 来自反复有效经验 | 可公开或私密 | 可进入 Agent 判断 | 未实现 |
| Skill 候选 | 必须经过验证 | 由站主决定 | 仅候选，不直接调用 | 未实现 |
| 正式 Skill | 必须稳定复现 | 可公开或私有 | 可被 Agent 调用 | 未实现 |

### 17.2 模块完整清单

| 模块 | 一句话职责 | 状态 |
| --- | --- | --- |
| 内容意图标注模块 | 标明一篇内容是自我表达、教程、工具说明、方法沉淀还是 Skill 候选。 | 部分实现 |
| 需求来源关联模块 | 记录某篇需求型内容来自哪些真实问题、直播反馈或对话样本。 | 未实现 |
| 公开边界模块 | 决定内容是否 public、draft、private 或 admin-only。 | 部分实现 |
| AI 使用边界模块 | 决定内容只能作背景、可以引用、可以推荐，还是可以执行任务。 | 部分实现 |
| 内容更新版本模块 | 记录一篇内容的连续修订和版本关系。 | 部分实现 |
| 创作决策模块 | 判断某个需求是否值得写成文章、教程、直播话题、工具页或 Skill 候选。 | 部分实现 |

### 17.3 验收标准

- [ ] 每篇内容能标明主要创作意图。
- [ ] 需求型内容能追溯来源需求。
- [ ] 个人表达内容不会被误当成用户答案资产。
- [ ] Agent 推荐内容前能读取 AI 使用边界。
- [ ] 内容更新能保留版本关系。
- [ ] 站主能在管理端判断需求来源是否适合公开回答。

## 18. U13 AI 可读接口 v2

### 18.1 已完成基础

- `/llms.txt`。
- `/walker-style.md`。
- `/index.json`。
- MCP 基础工具。

### 18.2 未完成范围

- 自动生成 `llms.txt`。
- `graph.json`。
- `index.json` 增强。
- JSON-LD 增强。
- related graph。
- `walker-style.md` 半自动维护。
- 内容节点之间的 `related` 可查询图谱。
- AI 读取时区分 `AI-0 / AI-1 / AI-2 / AI-3 / AI-4`。
- MCP 与 AI 接口使用同一套公开边界。

### 18.3 验收标准

- [ ] `graph.json` 能返回公开内容节点和关系。
- [ ] `index.json` 包含 form/domain/intent/valueMode/status/aiUsePolicy/related。
- [ ] JSON-LD 不泄露 draft/private/admin-only 内容。
- [ ] `llms.txt` 可由内容索引自动生成或半自动生成。
- [ ] `walker-style.md` 的更新有来源依据。
- [ ] AI 接口能过滤 `AI-0` 内容。

## 19. U14 MCP 私有洞察验收

### 19.1 当前状态

- `walker_query`、`walker_search`、`walker_get`、`walker_stats` 已有。
- `walker_insights` 已有 `MCP_ENABLE_PRIVATE_INSIGHTS` 环境变量开关。

### 19.2 未完成范围

- `walker_insights` 字段白名单。
- 私有洞察错误信息标准。
- 真实需求样本验证。
- `npm run build:mcp` 持续验收。
- MCP 默认只返回 public 内容的自动测试。
- `walker_get` 对 draft/private 内容的过滤验证。
- `walker_query` 对 visibility 的过滤验证。

### 19.3 验收标准

- [ ] 未开启私有开关时，`walker_insights` 不返回数据。
- [ ] 开启私有开关时，也只返回白名单聚合字段。
- [ ] MCP 默认工具无法读取 draft/private/admin-only 内容。
- [ ] MCP 构建持续通过。
- [ ] 用真实样本确认洞察统计不泄露原始需求。

## 20. U15 生产环境内容写回

### 20.1 当前状态

已有内容 CRUD 和 GitHub 写回能力设计，但生产环境仍需确认。

### 20.2 未完成范围

- `GITHUB_TOKEN` 是否已配置。
- token 权限是否足够写入内容文件。
- 保存失败时后台提示是否清楚。
- 删除失败时后台提示是否清楚。
- draft/private/public 切换在生产环境可用。
- 生产写回不会覆盖用户未保存内容。
- GitHub API 错误不会泄露 token 或内部细节。

### 20.3 验收标准

- [ ] 生产环境可创建草稿。
- [ ] 生产环境可更新内容。
- [ ] 生产环境可删除内容。
- [ ] 生产环境可切换 visibility。
- [ ] GitHub token 不进入前端。
- [ ] 写回失败有站主可理解的错误提示。

## 21. U16 Publish Interface 发布接口

### 21.1 核心关系

```text
Personal System
-> Publish Interface
-> Community Network
```

### 21.2 发布对象

第一批只考虑 7 类对象：

| 对象 | 含义 | 典型去向 | 工程状态 |
| --- | --- | --- | --- |
| `idea` | 一个点子、假设、方向或“不必如此”的回应。 | 点子广场 / 方向池 | 未实现发布接口 |
| `question` | 一个真实问题、需求或求助场景。 | 问题池 / 需求池 | 未实现发布接口 |
| `answer` | 一篇公开回答、教程、解释或方案。 | 答案库 / 内容流 | 未实现发布接口 |
| `skill` | 一个可复用、可验证、有边界的经验包。 | Skill 库 | 未实现发布接口 |
| `project` | 一个正在做或已经完成的项目。 | 项目区 | 未实现发布接口 |
| `tool` | 一个工具、工作流或资源。 | 工具区 | 未实现发布接口 |
| `case` | 一个实践案例、复盘或验证记录。 | 案例库 | 未实现发布接口 |

暂不默认发布：

- 原始私人日记。
- 未处理的 AI 对话全文。
- 管理员后台数据。
- 用户画像原文。
- 私密失败复盘。
- 没有边界的情绪记录。

### 21.3 发布字段

```text
sourceId
sourceType
owner
title
summary
visibility
intent
status
targetSpace
aiUsePolicy
feedbackMode
backlink
```

### 21.4 未完成模块

| 模块 | 职责 | 状态 |
| --- | --- | --- |
| Publish Candidate | 标记个人系统里可考虑发布的对象。 | 未实现 |
| Visibility Policy | 判断对象能否发布、以什么范围发布。 | 部分实现 |
| Publish Transformer | 把内部材料变成社区发布对象。 | 未实现 |
| Community Adapter | 把发布对象送到 NorthStar 对应空间。 | 未实现 |
| Feedback Ingestion | 把社区反馈写回个人系统需求池、复盘、选题或 skill 候选。 | 未实现 |

### 21.5 最小实验

```text
1. Walker 个人系统中哪些内容会被标记为发布候选？
2. 发布出去后，别人是否能理解、反馈或协作？
3. 反馈是否能回流为新的需求、选题、复盘或 skill 候选？
```

### 21.6 验收标准

- [ ] 至少一种内容能被标记为发布候选。
- [ ] 发布候选必须有 visibility、intent、status、targetSpace、aiUsePolicy。
- [ ] private/admin-only 内容不能成为公开发布对象。
- [ ] 发布对象能保留 sourceId 和 backlink。
- [ ] 社区反馈能回流到个人系统。

## 22. U17 Spec Kit / OpenSpec 桥接

### 22.1 目标

把“需求 -> 设计 -> 计划 -> 任务 -> 执行 -> 归档”固定成一条可审计、可复用、可回放的路线。

### 22.2 映射关系

| Spec Kit / OpenSpec | Walker 对应物 | 职责 | 状态 |
| --- | --- | --- | --- |
| constitution | `charter.md` + `ferry-development-protocol.md` + `human-gate-policy.md` | 定边界、定权限、定不可越界事项 | 已有 |
| spec + design | `references/working/prd.md` | 定需求分析、功能设计、架构设计 | 部分执行 |
| plan | `references/working/plan.md` | 定开发规划、阶段顺序、依赖关系 | 部分执行 |
| tasks | `references/working/to-do list.md` | 定可执行、可验收任务清单 | 部分执行 |
| implement | 代码改动 + `execution-log-current.md` | 定实际发生了什么 | 部分执行 |
| review | audit / razor | 定是否偏离、是否遗漏 | 未稳定 |
| archive | `docs/archive/` | 定历史和沉淀 | 部分执行 |
| skill candidate | `skill-admission-system-prd.md` | 定哪些经验可以升级成 skill | 未实现 |

### 22.3 推荐文件流

```text
raw demand / idea
-> content-intent 判断
-> 选 PRD / method seed / public answer / skill candidate
-> architecture
-> plan
-> todo
-> implement
-> execution log
-> feedback / audit
-> archive or skill promotion
```

### 22.4 未完成范围

- 产品仓库 `docs/cycles/current/` 阶段记录模板。
- 用一条真实需求跑通 `PRD -> architecture -> plan -> todo -> log`。
- 执行后更新 `execution-log-current.md`。
- 执行后归档或生成 skill candidate。
- 文档成熟度提醒与实际产品开发流程的联动验证。
- 每轮 blueprint/reality 对账自动或半自动记录。

### 22.5 验收标准

- [ ] 一条真实需求能完整走完文件流。
- [ ] 每个阶段都有输出物。
- [ ] 每次实现能回到对应 PRD/plan/todo。
- [ ] 每轮结束能更新 execution log 和 cycle ledger。
- [ ] 可重复经验能进入 skill 候选，而不是无限留在临时文档。

## 23. U18 NorthStar 社区网络边界

### 23.1 当前判断

NorthStar 社区网络是长期并行方向，但不进入本 PRD 的 reality 实施范围。

### 23.2 长期范围

- 个人系统模型。
- 个人系统发布接口。
- 点子发布。
- 点子协作。
- 角色与能力。
- 贡献记录。
- 协作空间。
- 平台数据台。
- 审核与权限。

### 23.3 当前绝对不要做

- 不把 NorthStar 账号体系塞进 iwalk.pro。
- 不让社区权限反向决定个人系统权限。
- 不为尚未验证的发布对象建立复杂推荐算法。
- 不为所有内容类型建立完整协作流。
- 不把 AdgaiWalker 做成社区后台。

## 24. 数据结构缺口总表

| 数据结构 | 当前状态 | 缺口 |
| --- | --- | --- |
| `MatchSession` | 已有 | 需要与 invited session 统一或明确边界 |
| `DemandEvent` | 已有 | 需要画像快照、需求来源回填、删除请求关联 |
| `MatchFeedbackEvent` | 已有 | 需要更稳定地关联事件和内容结果 |
| `TopicCandidate` | 已有 | 需要发布内容链接、创作状态、反向关联 |
| `InviteCode` | 已有 | 需要公开入口和 inviteCodeHash |
| `UserProfile` | 只有 Port 类型 | 需要 store、service、API、管理端 |
| `PublishCandidate` | 未实现 | 需要 sourceId/sourceType/targetSpace/backlink |
| `ContentVersion` | 未实现 | 需要 version/previousVersion/demandSourceIds |
| `ExperienceEvent` | 未实现 | 需要原话、场景、假设、帮助动作、反馈、复盘 |
| `MethodCard` | 未实现 | 需要定义域、输入条件、输出形态、验证标准 |
| `SkillCandidate` | 未实现 | 需要准入状态、关联经验、管理员确认 |
| `RuleCandidate` | 未实现 | 需要 observed/candidate/validated/stable/retired |
| `ContentGraph` | 未实现 | 需要节点、边、related、AI 可读边界 |

## 25. API 缺口总表

| API | 状态 | 用途 |
| --- | --- | --- |
| `/api/invite/verify` | 未实现 | 公开邀请码验证和轻量会话建立 |
| `/api/profile` GET | 未实现 | 读取当前会话画像 |
| `/api/profile` POST | 未实现 | 创建或更新当前会话画像 |
| `/api/profile/delete-request` | 未实现 | 用户请求删除画像和相关需求事件 |
| `/api/admin/profiles` | 未实现 | 管理员复盘画像、需求和反馈 |
| `/api/search-events` 或等价接口 | 未实现 | 记录搜索无结果和搜索意图 |
| `/api/admin/content-drafts` 或等价接口 | 未实现 | 从 TopicCandidate 生成草稿 |
| `/api/admin/content-links` 或等价接口 | 未实现 | 内容与需求来源反向关联 |
| `/graph.json` | 未实现 | AI 可读公开内容图谱 |
| `/api/admin/rules` 或等价接口 | 未实现 | 规则候选池管理 |
| `/api/admin/experience-events` 或等价接口 | 未实现 | 原始经验采集与复盘 |
| `/api/admin/skill-candidates` 或等价接口 | 未实现 | Skill 候选管理 |
| `/api/admin/publish-candidates` 或等价接口 | 未实现 | 发布候选管理 |

## 26. 推荐实施顺序

### Phase 0: 文档和验收对齐

- [ ] 以本 PRD 为未完成蓝图区总入口。
- [ ] 更新 `project-docs-index.md`，把本 PRD 加入当前设计文档。
- [ ] 把每个未完成模块确认归属到个人系统、发布接口或社区网络。
- [ ] 确认第一轮核心模块、模块关系和 Port 契约。
- [ ] 不拆分新的平级执行 PRD；后续只在本 PRD 下补 architecture / plan / todo / execution log。

### Phase 1: 邀请制认证授权与身份画像上下文

To-do list：`references/working/to-do list.md`

执行计划：`references/working/plan.md`

- [ ] 建立 public / invited / admin 认证状态判断。
- [ ] 建立用户授权策略和功能守卫。
- [ ] 复核管理员后台访问守卫。
- [ ] 新增 `/api/invite/verify`。
- [ ] 建立轻量会话。
- [ ] 实现 `UserProfileRepositoryPort`。
- [ ] 新增 `profile.service.ts`。
- [ ] 新增 `/api/profile` GET/POST。
- [ ] 新增 `user-context.service.ts`。
- [ ] 修改 `/api/match` 读取画像上下文。
- [ ] 需求事件保存画像快照。
- [ ] 新增 `/api/admin/profiles`。
- [ ] 新增删除请求。

### Phase 2: 用户需求匹配与后台复盘闭环

- [ ] 用户通过需求调查或需求匹配入口提交问题。
- [ ] AI 分析用户输入并匹配工具、内容、方法和下一步行动。
- [ ] 需求事件保存用户问题、画像快照、匹配结果和反馈。
- [ ] 管理员在后台查看需求、对话摘要、画像、反馈和选题候选。
- [ ] 管理员可把需求推进为选题或内容更新。

### Phase 3: 数据边界验收

- [ ] public / invited / admin / Agent / MCP 字段白名单。
- [ ] MCP public-only 回归测试。
- [ ] `walker_insights` 私有开关和字段白名单测试。
- [ ] `/api/stats` 聚合字段测试。
- [ ] `/admin/insights`、`/api/admin/conversations` 鉴权测试。

### Phase 4: 内容创作闭环

- [ ] TopicCandidate 生成草稿。
- [ ] 内容发布后回填链接。
- [ ] 内容反向关联需求来源。
- [ ] `demandSourceIds` 或等价字段进入内容工作流。
- [ ] 需求型内容进入资源索引。

### Phase 5: Agent 应用分层与安全层迁移

- [ ] 业务层核心对象确认。
- [ ] 核心模块按 Invite Access / Need Case / Agent Orchestrator / Admin Review 等边界拆分。
- [ ] 业务服务只依赖 Port，不直接依赖 Redis、GitHub、Astro Content 或具体模型。
- [ ] Perception 抽取。
- [ ] Memory API 收敛。
- [ ] Planning 接口稳定。
- [ ] 工具层补齐输入、输出、权限、失败返回和重试策略。
- [ ] 安全层补齐失败处理矩阵。
- [ ] 连续失败进入管理员待处理队列。
- [ ] Orchestration 抽取。
- [ ] Observability 字段白名单。

### Phase 6: 原始信息积累、分析标准与 Skill 准入

- [ ] 原始信息积累池。
- [ ] 原始事件采集。
- [ ] 复盘修正。
- [ ] 阶段性分析规则。
- [ ] 判断标准沉淀。
- [ ] 需求模式分析。
- [ ] 方法成熟度评估。
- [ ] Skill 候选池。
- [ ] 管理员确认或降级为方法卡。

### Phase 7: AI 接口 v2 与发布接口

- [ ] `graph.json`。
- [ ] `index.json` 增强。
- [ ] related graph。
- [ ] PublishCandidate。
- [ ] PublishTransformer。
- [ ] FeedbackIngestion。

### Phase 8: Spec Kit / OpenSpec 可回放链路

- [ ] 创建产品仓库 `docs/cycles/current/` 模板。
- [ ] 用真实需求跑通 `PRD -> architecture -> plan -> todo -> log`。
- [ ] 更新 execution log。
- [ ] 归档或生成 skill candidate。

## 27. 总验收标准

- [ ] 所有 U1-U18 模块都有当前状态、缺口和验收标准。
- [ ] P0-P1 模块能形成用户可体验闭环。
- [ ] 不引入完整社区账号、关注、粉丝、推荐、审核等 NorthStar 社区复杂度。
- [ ] 访客、邀请用户、管理员、Agent、MCP 的数据边界清楚。
- [ ] 需求事件能从提问走到反馈、选题、内容、经验和 skill 候选。
- [ ] 内容公开、AI 使用、需求来源和版本关系可追溯。
- [ ] Agent 应用具备业务层、工具层、记忆层、编排层、安全层和观测层边界。
- [ ] 每个关键失败场景都有降级、记录和交给人的处理方式。
- [ ] 发布接口只做选择性发布，不做自动同步。
- [ ] 每轮开发能更新 execution log 和 cycle ledger。

## 28. 需要 Walker 确认

### 28.1 已确认决策

1. 不拆分新的平级执行 PRD，就按本 PRD 作为总入口推进。
2. 执行粒度用 Phase 控制，不用多份 PRD 控制。
3. 后续需要更细时，只补 architecture / plan / todo / execution log，不另开当前同级 PRD。

### 28.2 仍需确认

1. 下一轮是否锁定 Phase 1：邀请制认证授权与身份画像上下文。
2. `UserProfile` 是否允许保存可选 `contact`，还是第一版完全不收联系方式。
3. 删除请求第一版是用户自助删除，还是管理员处理标记。
4. TopicCandidate 生成草稿时，是否直接写入内容目录，还是先只生成 Markdown 文本供站主确认。
5. `graph.json` 是否放在 AI 接口 v2 的下一轮，还是等内容闭环稳定后再做。
6. Publish Interface 是否继续停留在 PRD/architecture，还是做一个最小手工发布候选实验。


