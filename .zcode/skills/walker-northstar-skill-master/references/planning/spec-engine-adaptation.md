# Spec Kit / OpenSpec 改造桥接

## Mode

Bridge Doc: 将 Spec Kit / OpenSpec 翻译成 Walker 可以直接执行的文档协议。

## 一句话结论

Spec Kit 不是要替换 Walker 现有体系，而是把“需求 -> 设计 -> 计划 -> 任务 -> 执行 -> 归档”固定成一条可审计、可复用、可回放的路线。

## 这次改造的目标

- 让每次开发先有边界，再有方案。
- 让每次方案都有输出物，不靠口头记忆。
- 让每次执行都能回到历史。
- 让可重复经验最终进入 skill，而不是无限留在临时文档里。

## 保持不变

- `project-docs-index.md` 仍是唯一当前入口。
- `charter.md` 仍是最高边界。
- `references/` 仍是当前工作台。
- `docs/archive/` 仍只放历史和提炼值。
- 代码仓库与文字 / 方法仓库继续分开管理。

## Spec Kit -> Walker

| Spec Kit / OpenSpec | Walker 对应物 | 职责 |
| --- | --- | --- |
| constitution | `charter.md` + `ferry-development-protocol.md` + `human-gate-policy.md` | 定边界、定权限、定不可越界事项 |
| spec | `*-prd.md` | 定需求、定问题、定验收 |
| design | `*-architecture.md` | 定模块、定关系、定接口 |
| plan | `*-plan.md` | 定阶段、定顺序、定策略 |
| tasks | `*-todo.md` | 定可执行清单 |
| implement | 代码改动 + `execution-log-current.md` | 定实际发生了什么 |
| review | `hai-audit-docs-*` / `hai-razor` | 定是否偏离、是否遗漏 |
| archive | `docs/archive/` | 定历史和沉淀 |
| skill candidate | `skill-admission-system-prd.md` | 定哪些经验可以升级成 skill |

## 推荐文件流

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

## 文件边界

- `references/`：当前有效
- `docs/adr/`：长期决策
- `docs/archive/`：历史材料
- `.scratch/` 或 `.tmp/`：临时缓存、截图、垃圾文件
- `docs/AI赋能/`：方法图谱、专题材料、额外素材

## 依赖倒置

上层只依赖文档角色，不依赖具体工具。

- `需求判断` 依赖 `PRD` 接口，不依赖某个编辑器
- `执行安排` 依赖 `plan/todo` 接口，不依赖某个任务软件
- `历史回放` 依赖 `log/archive` 接口，不依赖某次会话记忆
- `skill 晋级` 依赖 `admission` 接口，不依赖单个文件内容是否写得长

## 不做什么

- 不把每条笔记都升格成 PRD
- 不把每次灵感都升格成 skill
- 不把历史资料当当前真相
- 不把 `docs/` 再变回当前工作台
- 不把社区复杂度提前塞进个人系统

## 第一版落地顺序

1. 先用一条需求跑通 `PRD -> architecture -> plan -> todo -> log`
2. 再判断这条需求是不是可重复
3. 可重复才进入 `skill` 候选
4. 不可重复就留在方法卡、内容卡或归档里
