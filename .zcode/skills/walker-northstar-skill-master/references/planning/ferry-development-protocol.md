# Ferry 开发协议

本文档把 Ferry `v1.1.0` 的双 Git 安全边界接入 `walker-northstar`。它用于判断开发任务应当进入
哪个仓库、哪个层级、哪个日志。

## 核心映射

```text
walker-northstar-skill repo = blueprint + .ferry
AdgaiWalker repo = reality
docs/archive = archive
references/reflection/execution-log-current.md = process log
未来 evolution log = P4 后沉淀的新规则
```

## 双 Git 边界

```text
Skill 仓库管判断规则、PRD、架构、计划、todo、复盘、工具脚本和知识入口。
产品仓库管真实代码、页面、接口、测试、部署配置和运行产物。
```

二者服务同一个项目，但不能互相吞掉：

- 改代码、跑测试、修页面、改接口：进入 AdgaiWalker 产品仓库。
- 改规则、改 PRD、改架构、改计划、改 todo：进入 `walker-northstar-skill`。
- 归档完成任务、记录阻滞、沉淀新规则：进入 archive 或日志。

## P0-P4 映射

| Ferry 阶段 | 在本项目中的表现 | 应读文件 |
| --- | --- | --- |
| P0 混沌期 | 用户在说想法、方向、矛盾，还没形成需求。 | `charter.md`、`idea-operating-system.md` |
| P1 规划期 | 开始形成 PRD、架构、计划、todo。 | `project-docs-index.md`、`references/working/prd.md`、`references/working/plan.md`、必要的 `*-architecture.md` |
| P2 执行期 | 明确要改代码、改文档、跑测试、推进 todo。 | `references/current-cycle-state.md`、`references/working/to-do list.md`、产品仓库实际文件 |
| P3 修正期 | 出现阻滞、冲突、权限问题、文档和现实不一致。 | `references/reflection/execution-log-current.md`、相关 PRD / architecture / code |
| P4 进化期 | 任务完成并沉淀出可复用规则或 skill。 | archive、未来 evolution log、`SKILL.md` 必要更新 |

## 工作顺序

```text
1. 先判断任务属于 blueprint、reality、archive，还是跨仓桥接。
2. 再判断任务处于 P0-P4 哪个阶段。
3. 只读取当前阶段真正需要的 references。
4. 执行可撤回动作。
5. 遇到阻滞时记录到 execution-log-current.md。
6. 当同类阻滞重复出现或形成稳定规则时，再考虑更新 SKILL.md。
```

## 不做

- 不把产品代码塞进 Skill 仓库。
- 不把所有历史讨论塞进 references。
- 不把未验证想法写进 `SKILL.md`。
- 不在产品仓库里长期堆当前 PRD、plan、todo。
- 不绕过 Human Gate 做删除、推送、发布、公开私密内容等动作。

## 判断句

```text
Skill 仓库保护思想规则，产品仓库保护现实实现；AI 可以执行，但必须在正确仓库、正确阶段和正确权限内执行。
```
