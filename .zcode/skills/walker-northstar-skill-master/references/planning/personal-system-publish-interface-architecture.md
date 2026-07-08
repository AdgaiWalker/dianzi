# 个人系统到社区的发布接口架构

本文档定义 AdgaiWalker 个人系统与 NorthStar 社区之间的连接方式。它不是社区 PRD，也不是
当前开发 todo；它只回答一个问题：

```text
个人系统里的什么东西，可以用什么形态，发布到社区的什么位置？
```

## 核心关系

```text
Personal System -> Publish Interface -> Community Network
```

- **Personal System**：个人系统节点，保存一个人的内容、想法、工具、项目、经验、skill、
  生活记录和 Agent 上下文。
- **Publish Interface**：发布接口，判断什么可以从个人系统进入社区，以及进入时的形态、
  权限、目标位置和反馈回流方式。
- **Community Network**：社区网络，承载多个人的公开想法、问题、项目、skill、协作和反馈。

AdgaiWalker 是 Walker 的个人系统样板节点。NorthStar 是多个个人系统之间的连接网络。
二者可以同时存在；当前重点是把 Walker 这个节点和它的发布接口跑清楚。

## 为什么需要发布接口

个人系统内部材料不等于社区内容。

```text
个人系统里可以有草稿、私密记录、失败复盘、半成品想法、原始对话。
社区里只能出现经过选择、变形、标注边界后的发布对象。
```

发布接口的价值是：

- 防止把私人内容默认公开。
- 防止把个人系统做成社区后台。
- 让每个个人系统都能用同一套规则向社区贡献内容。
- 让社区反馈能回流为个人系统里的需求、复盘、选题或 skill 候选。

## 发布对象

第一批只考虑 7 类对象：

| 对象 | 含义 | 典型去向 |
| --- | --- | --- |
| `idea` | 一个点子、假设、方向或“不必如此”的回应。 | 点子广场 / 方向池 |
| `question` | 一个真实问题、需求或求助场景。 | 问题池 / 需求池 |
| `answer` | 一篇公开回答、教程、解释或方案。 | 答案库 / 内容流 |
| `skill` | 一个可复用、可验证、有边界的经验包。 | Skill 库 |
| `project` | 一个正在做或已经完成的项目。 | 项目区 |
| `tool` | 一个工具、工作流或资源。 | 工具区 |
| `case` | 一个实践案例、复盘或验证记录。 | 案例库 |

暂不默认发布：

- 原始私人日记
- 未处理的 AI 对话全文
- 管理员后台数据
- 用户画像原文
- 私密失败复盘
- 没有边界的情绪记录

这些材料可以在个人系统内部用于思考和 Agent 判断，但不能默认进入社区。

## 发布字段

一个发布对象至少需要这些字段：

```text
sourceId      原始内容在个人系统中的 id 或路径
sourceType    idea / question / answer / skill / project / tool / case
owner         发布者
title         对外标题
summary       对外摘要
visibility    public / limited / private
intent        寻找反馈 / 寻找协作 / 展示成果 / 找答案 / 招募同行
status        thinking / validating / building / verified / archived
targetSpace   发布到社区哪个区域
aiUsePolicy   AI 可读、可引用、可推荐或可执行的边界
feedbackMode  允许点赞、评论、申请协作、提问、复用或只读
backlink      社区反馈回流到个人系统的位置
```

这些字段不要求一次性做成数据库模型。当前阶段可以先作为 PRD 和内容模型的约束。

## 发布流程

```text
个人系统产生内容
-> 标记为发布候选
-> 管理员判断可见性、意图、状态和目标区域
-> 转换成社区发布对象
-> 发布到 NorthStar 对应空间
-> 接收反馈、协作请求或需求信号
-> 回流到个人系统的需求池、复盘、选题或 skill 候选
```

核心不是“同步”，而是“选择性发布”。

## 模块关系

```text
Content / Experience / Skill / Tool
  -> 触发
Publish Candidate
  -> 调用
Visibility Policy
  -> 调用
Publish Transformer
  -> 调用
Community Adapter
  -> 触发
Feedback Ingestion
  -> 写回
Personal Memory / Demand Pool / Skill Candidate
```

- **依赖**：发布接口依赖可见性策略，否则无法判断什么能公开。
- **调用**：发布接口调用转换器，把内部材料变成社区对象。
- **触发**：社区反馈触发个人系统里的需求、复盘或 skill 候选更新。
- **实现**：早期可以由 Markdown frontmatter、管理端按钮和手工发布实现；未来再替换为 API。

## 当前阶段不做

在 AdgaiWalker 个人系统阶段，不做这些：

- 自动把所有内容同步到社区。
- 把 NorthStar 账号体系塞进 iwalk.pro。
- 让社区权限反向决定个人系统权限。
- 让普通用户直接读取管理员后台数据。
- 为尚未验证的发布对象建立复杂推荐算法。
- 为所有内容类型建立完整协作流。

## 最小实验

当前最小实验不是建设完整社区，而是验证三件事：

```text
1. Walker 个人系统中哪些内容会被标记为发布候选？
2. 发布出去后，别人是否能理解、反馈或协作？
3. 反馈是否能回流为新的需求、选题、复盘或 skill 候选？
```

如果这三件事跑不通，社区扩张没有意义。如果跑通，NorthStar 才有清楚的接口边界。
