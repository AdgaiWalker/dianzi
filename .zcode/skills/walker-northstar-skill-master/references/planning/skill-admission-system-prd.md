# Skill 准入与 Agent 路由系统 PRD

## Mode

Design PRD：本文定义经验如何进入 Skill 准入、如何被注册、如何被 Agent 安全调用。

## Target Outcome

Skill 不是把经验写进去，而是把已经能稳定复现的经验封装成有边界、可调用、可验证的判断函数。

第一版目标：

```text
输入一段经验材料
-> 内容分层
-> Skill 准入判断
-> 生成定义域 / 输入条件 / 输出形态 / 验证标准
-> 管理员确认
-> 注册为 Skill 或降级为方法卡
```

这个闭环成立后，再做 Agent 路由。否则 Agent 会调用一堆边界不清的伪 Skill。

## Core Modules

| 模块 | 一句话职责 |
|---|---|
| 内容分层模块 | 判断内容属于原始材料、知识卡、方法卡、Skill 候选、正式 Skill 还是 Agent 流程。 |
| Skill 准入判断模块 | 判断一个经验是否具备定义域、输入条件、输出形态、判断流程和验证标准。 |
| 定义域检查模块 | 判断用户输入是否在某个 Skill 可处理范围内。 |
| 方法卡模块 | 承载经验背后的判断规律，是 Skill 的方法来源。 |
| 知识库模块 | 存放文章、案例、对话摘要、工具说明、历史版本等可引用资源。 |
| Skill 注册模块 | 管理已通过准入的 Skill，包括名称、触发条件、边界、关联资源和版本。 |
| Agent 路由模块 | 根据用户问题决定调用哪个 Skill，或选择追问、拒绝、转交、降级。 |
| 工具执行模块 | 执行检索、生成、写入、版本读取、内容更新等具体动作。 |
| 权限与可见性模块 | 控制 public、draft、private、admin-only 内容谁能看、谁能调用。 |
| 管理员工作台模块 | 给站主维护内容、审核 Skill、编辑方法卡、查看关联资源和测试 Agent。 |
| 反馈与验证模块 | 记录 Skill 是否达成结果，用反馈反向修正定义域和验证标准。 |

## Module Relationships

| 关系 | 方向 | 理由 |
|---|---|---|
| 调用 | 内容分层模块 -> Skill 准入判断模块 | 只有疑似可执行经验，才进入 Skill 准入判断。 |
| 依赖 | Skill 准入判断模块 -> MethodRepositoryPort | 准入判断依赖方法卡接口，不直接依赖 Markdown 文件。 |
| 依赖 | Skill 准入判断模块 -> KnowledgeRepositoryPort | 判断时需要查案例、文章、历史材料，但不绑定具体存储。 |
| 实现 | MarkdownMethodRepository -> MethodRepositoryPort | 当前方法卡可先由 Obsidian/Markdown 实现。 |
| 实现 | MarkdownKnowledgeRepository -> KnowledgeRepositoryPort | 当前知识库可先由网站内容和 Markdown 文件实现。 |
| 调用 | Skill 准入判断模块 -> 定义域检查模块 | 判断 Skill 是否成立时，必须明确它能处理什么、不能处理什么。 |
| 调用 | Skill 准入判断模块 -> Skill 注册模块 | 通过准入后，才注册为正式 Skill。 |
| 触发 | 用户提问 -> Agent 路由模块 | 普通用户或站主提出问题时，触发 Agent 判断流程。 |
| 调用 | Agent 路由模块 -> 定义域检查模块 | 调用 Skill 前先检查输入是否在定义域内。 |
| 调用 | Agent 路由模块 -> Skill 注册模块 | 路由模块需要查询有哪些可用 Skill 及其触发条件。 |
| 依赖 | Agent 路由模块 -> SkillRegistryPort | Agent 只依赖 Skill 注册接口，不直接读具体 Skill 文件。 |
| 实现 | FileSkillRegistry -> SkillRegistryPort | 第一阶段可用文件系统或 Markdown 注册表实现。 |
| 调用 | Agent 路由模块 -> 工具执行模块 | 当 Skill 需要检索、生成、写入、读取版本时，交给工具执行。 |
| 依赖 | 工具执行模块 -> ToolPort | 工具执行依赖抽象工具接口，不绑定某个具体脚本或 API。 |
| 调用 | Agent 路由模块 -> 权限与可见性模块 | 调用 Skill 和知识前，必须过滤私密内容。 |
| 调用 | 知识库模块 -> 权限与可见性模块 | 知识检索结果必须先经过 public/private/admin-only 判断。 |
| 触发 | Skill 输出结果 -> 反馈与验证模块 | 每次 Skill 使用后，记录是否有效、是否达标。 |
| 调用 | 反馈与验证模块 -> Skill 准入判断模块 | 如果长期无效，反向修正 Skill 定义域或降级为方法卡。 |

## Dependency Inversion

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
SearchTool 实现 ToolPort
VersionTool 实现 ToolPort
DefaultVisibilityPolicy 实现 VisibilityPolicyPort
```

## Acceptance Criteria

- [ ] 每个 Skill 候选都有定义域。
- [ ] 每个 Skill 候选都有输入条件、输出形态和验证标准。
- [ ] 定义域外的问题不会强行调用 Skill。
- [ ] 管理员可以把候选批准为 Skill，也可以降级为方法卡。
- [ ] Agent 调用 Skill 前经过权限与可见性过滤。
- [ ] Skill 使用后能记录是否有效。
