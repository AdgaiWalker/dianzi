# Working Zone

当前工作区保存当前这一轮产出的工作包。核心固定三件套是：

```text
prd.md
plan.md
to-do list.md
```

三件套职责：

```text
prd.md = 需求分析 + 功能设计 + 架构设计
plan.md = 基于 prd.md 的开发规划、阶段顺序、依赖关系
to-do list.md = 基于 prd.md 和 plan.md 的可执行、可验收任务清单
```

规则：

- 只保留当前一轮。
- `prd.md`、`plan.md`、`to-do list.md` 是每轮必备核心文件。
- 可以保留本轮产生、且仍服务当前执行或验收的补充文档。
- 补充文档必须属于当前轮，不能把长期架构、历史材料、旧 PRD、旧计划混进来。
- 不新建 `goal` 文件。
- 一轮结束后，将工作区里的本轮工作包按时间归档到 `docs/archive/cycles/`。
- 历史材料、长期架构、协议、复盘和规则候选不放在这里。

