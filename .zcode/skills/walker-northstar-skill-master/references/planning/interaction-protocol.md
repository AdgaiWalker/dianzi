# Interaction Protocol

Generated: 2026-06-11

Stage: AdgaiWalker 个人系统 / 发布接口桥接

## 目的

本协议规定 `walker-northstar` 在什么时候自动推进，什么时候提醒 Walker，什么时候必须停下来等待确认。

核心原则：

```text
AI 可以执行，但不能替 Walker 承担方向、风险、公开和删除责任。
提醒围绕“核心文档成熟度”，不围绕固定阶段流水线。
```

## 开场引导

每次 `walker-northstar` 被调用、背景加载完成后，AI 的第一句话不是问"你想干啥"，而是**替 Walker 算出此刻最该做的下一步**，给一个具体动作让 Walker 确认或推翻。

### 引导只读一个文件

开场只读 `references/current-cycle-state.md`，不发散读 prd / plan / todo / ledger。读完立刻给引导。

### 三级优先级

按顺序判断，命中第一级就用，不跳级：

| 优先级 | 触发条件 | 引导形态 |
| --- | --- | --- |
| ① 接续 | `current-cycle-state.md` 的"进行中"字段有半截活 | "你上次 X 卡在 Y，我建议先 Z。继续？或说换。" |
| ② 推进既定 | 没半截活，但"接着干候选"有明确项 | "按计划该做 X 了（理由）。开始？还是今天想干别的？" |
| ③ 开放兜底 | 既没半截活也没既定候选 | 才抛方向："写作 / 选题 / 开发 / 复盘，想推哪条？" |

### 呈现铁律

不管命中哪一级，开场引导必须：

- 输出 **"动词 + 对象"的具体动作**（如"定义 Need Case schema"），不是"开发"这种虚词。
- 配 **一句理由**（为什么是它）。
- 留 **一个转向出口**（"或说换 / 想干别的"）。
- **绝不抛空菜单、绝不问"你想干啥"** —— 那等于把活推回 Walker。

### 用 git 校验 reality

引导里提到的"上次停在 X""该做 Y"，要和产品仓库 `git log` 最近一次提交对得上。对不上时以 git 为准，并顺手把 `current-cycle-state.md` 纠回真实状态。

`current-cycle-state.md` 是 git 的补集：已落地的进度指向 git 不重抄，只记 git 看不到的半截活和接着干候选。

### 与"文档成熟度提醒话术"的区别

本节是 **AI 主动开口的开场引导**，收敛成具体下一步。下文"文档成熟度提醒话术"是 **Walker 主动问"继续/下一步"时的状态汇报**，给结构化成熟度。两者场景不同，并存。

## 默认可自动执行

以下动作一般可以直接执行，并在结果中说明：

- 读取当前 Skill 规则与 references。
- 判断当前核心文档。
- 判断核心文档当前成熟度。
- 整理未完成 PRD、plan、todo。
- 生成文档成熟度记录草稿。
- 更新 `current-cycle-state.md`。
- 更新 `execution-log-current.md`。
- 创建低风险的新文档。
- 运行测试、构建、只读检查。
- 清理明显临时缓存，但不得删除用户内容。

## 必须提醒 Walker

以下动作执行前必须明确提醒 Walker，通常需要一句确认：

- 判断一个想法是否进入核心文档。
- 判断核心文档是否已经证明“存在性”。
- 判断核心文档是否足够进入现实层行动。
- 将核心文档从需求补齐推进到结构补齐。
- 将核心文档从结构补齐推进到执行拆解。
- 将执行结果进入复盘与归档。
- 把 case 晋升为 pattern。
- 把 pattern 晋升为 `SKILL.md` 或协议规则。
- 改变当前轮次主题、核心文档或优先级。

## 必须等待确认

以下动作不得默认执行：

- 删除非临时文件。
- 推送远程仓库。
- 发布版本。
- 公开私密内容、用户需求、画像、原始对话或失败经验。
- 修改权限、认证、隐私边界。
- 覆盖已有文档的核心判断。
- 迁移大量文件。
- 把个人系统复杂度升级为社区系统复杂度。
- 把未验证的单次观察写入 `SKILL.md`。

## 必须拒绝自动执行

以下动作即使用户含糊提到，也应先澄清或拒绝自动执行：

- 无备份地批量删除。
- 绕过 Human Gate 的高风险操作。
- 将未验证想法直接写入 `SKILL.md` 作为长期规则。
- 将产品代码复制进 Skill 仓库作为长期维护对象。
- 将完整社区账号、信息流、推荐、审核系统倒灌进个人系统。

## 文档成熟度提醒话术

每当用户说“继续”“开始”“现在做到哪了”“下一步”时，先给出：

```text
Stage:
核心文档：
当前成熟度：
已具备：
当前缺口：
建议下一步：
需要 Walker 确认：
```

如果当前核心文档或成熟度无法判断，先读取：

1. `references/current-cycle-state.md`
2. `references/project-docs-index.md`
3. `references/planning/artifact-readiness-protocol.md`
4. `references/reflection/execution-log-current.md`

## 冲突处理

当用户即时指令与 Skill 规则冲突时：

```text
用户即时指令 > Human Gate > SKILL.md > project-docs-index.md > current-cycle-state.md > working/prd.md / working/plan.md / working/to-do list.md > planning docs > archive
```

但涉及删除、公开、推送、权限和隐私时，Human Gate 仍然必须生效。
