# AdgaiWalker 个人 Agent 系统总架构

## Mode

Architecture Overview：本文只保留个人 Agent 系统的总判断、模块地图和文档入口，不再承载具体 PRD 细节。

## Boundary

AdgaiWalker 个人 Agent 系统要解决四条主线：

```text
内容与经验如何进入系统
-> 实践事件如何被记录、复盘和分析
-> 内容如何按创作意图区分自用与他用
-> 反复有效的经验如何进入 Skill 准入和 Agent 路由
```

具体设计已经拆出：

- `references/skill-admission-system-prd.md`：Skill 准入、定义域检查、Skill 注册和 Agent 路由。
- `references/experience-validation-system-prd.md`：原始事件采集、实践复盘、矛盾分析和规律验证。
- `references/content-intent-demand-policy-prd.md`：个人表达、需求创作、公开边界和内容意图。

后续实现时，不要一次性实现整份总架构；应从上述子文档中拆出独立 hai-goal。

## Extracted Legacy Value

### 1. 顶层架构表达

后续讲 AdgaiWalker / NorthStar 时，优先使用这套层级表达：

```text
时代潮流层
-> 演化协议层
-> 价值宪法层
-> 点子驱动层
-> 内容与经验内核层
-> 人类 I/O 层 / AI I/O 层
-> 反馈校准层
-> 方法论进化层
```

它解决的是“为什么这个系统不只是网站”的表达问题：上层说明时代矛盾和价值边界，中层说明内容、点子、方法如何组织，下层说明人和 AI 如何分别读取、行动、反馈。

### 2. 三系统关系

```text
FerrySpec = 演化协议层
AdgaiWalker / iwalk.pro = 个人实践场 / 样板节点
NorthStar = 社会实践场 / 多人点子共创网络
```

原则：

```text
FerrySpec 提供当前方法论；
AdgaiWalker 验证一个人如何组织经验、点子、工具、内容和 Agent；
NorthStar 只继承被 AdgaiWalker 验证过的流程、方法和边界。
```

### 3. 价值宪法

- 人是目的，AI 是工具。
- AI 可以整理、检索、生成、拆解、辅助执行；人负责方向、判断、审美、公开、责任和不可逆决定。
- 数据提供现象，不提供目的。
- 公开方向，不公开脆弱。
- 系统帮助人成为自己，不把人系统化。
- 重复劳动交给 AI，不可替代的体验留给人。
- 界面服务人的理解，结构服务 AI 的执行。

### 4. 网站定位

```text
Obsidian / AI 对话 / 桌面文档 = 原始发生地
AdgaiWalker = 整理后的沉淀层、答案层、样板节点
Agent / Skill = 对沉淀经验的调用层
```

这意味着：私有思考可以混乱，公开内容需要经过整理；不是所有记录都要发布，也不是所有经验都能成为 Skill。

### 5. Walker 方法流程

```text
探索环境
-> 需求分析
-> 验证需求
-> 设计方案
-> 拆分任务
-> 锚定目标
-> 达成结果
-> 整理沉淀
```

对应状态语言：

```text
准备出发：观察、收集、判断、定目标。
正在出发：行动、验证、拆解、交付结果。
歇会再出发：复盘、整理、沉淀、再次出发。
```

## Core Architecture

| 模块 | 一句话职责 | 详细文档 |
|---|---|---|
| 内容采集 | 接收文章、直播复盘、AI 对话、想法、案例等原始经验材料。 | `experience-validation-system-prd.md` |
| 内容分层 | 判断内容属于原始材料、知识卡、方法卡、Skill 候选、正式 Skill 还是 Agent 流程。 | `skill-admission-system-prd.md` |
| 实践验证 | 从真实事件、反馈和复盘中识别反复有效的经验。 | `experience-validation-system-prd.md` |
| Skill 准入 | 判断一个经验是否具备定义域、输入条件、输出形态、判断流程和验证标准。 | `skill-admission-system-prd.md` |
| Agent 路由 | 根据用户问题决定调用哪个 Skill，或选择追问、拒绝、转交、降级。 | `skill-admission-system-prd.md` |
| 工具执行 | 执行检索、生成、写入、版本读取、内容更新等具体动作。 | `agent-six-modules-boundary.md` |
| 权限与可见性 | 控制 public、draft、private、admin-only 内容谁能看、谁能调用。 | `agent-six-modules-boundary.md` |
| 内容意图 | 区分个人表达、需求创作、教程、方法沉淀和公开答案资产。 | `content-intent-and-demand-policy.md` |
| 反馈与验证 | 记录 Skill 是否达成结果，用反馈反向修正定义域和验证标准。 | `experience-validation-system-prd.md` |

## Recommended First Loop

第一版只做这个闭环：

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

这个闭环成立后，再进入：

```text
需求模式分析
-> 成功标准提炼
-> 方法卡沉淀
-> Skill 候选生成
-> Skill 准入判断
-> Agent 路由
```

## Dependency Inversion Rule

高层模块不要依赖具体文件、具体框架、具体 API。

正确方向：

```text
Agent 路由模块
  -> 依赖 SkillRegistryPort
  -> 依赖 MethodRepositoryPort
  -> 依赖 KnowledgeRepositoryPort
  -> 依赖 ToolPort
  -> 依赖 VisibilityPolicyPort
```

具体实现放到下层：

```text
MarkdownSkillRegistry 实现 SkillRegistryPort
MarkdownMethodRepository 实现 MethodRepositoryPort
MarkdownKnowledgeRepository 实现 KnowledgeRepositoryPort
LocalFileContentStore 实现 ContentStorePort
GitHubContentStore 实现 ContentStorePort
SearchTool 实现 ToolPort
VersionTool 实现 ToolPort
```

这样网站现在可以继续用 Astro + Markdown + Obsidian + GitHub，不需要一开始换数据库；以后要加向量库、数据库、Vercel KV、GitHub API，也不会推翻 Agent 和 Skill 的核心逻辑。
