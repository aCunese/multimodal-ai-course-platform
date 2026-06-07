# 项目级 Harness 基线评估

## 目标

为 `multimodal-ai-course-platform/` 建立一个面向多会话开发的最小可用 harness，让后续前端实现、后端接入和文档维护都能在同一套工作流中持续推进。

## 五子系统评估

| 子系统 | 当前评分 | 现状 | 改进动作 |
|---|---:|---|---|
| Instructions | 2/5 | 已有 README 和架构文档，但没有统一启动规则和会话约束。 | 新增 `AGENTS.md` 作为路由层。 |
| State | 1/5 | 没有 feature 状态文件、进度日志和交接记录。 | 新增 `feature_list.json`、`progress.md`、`session-handoff.md`。 |
| Verification | 2/5 | `web/` 有 `lint/build/dev`，但没有项目级统一入口。 | 新增 `init.sh`，把前端验证和基础存在性检查统一起来。 |
| Scope | 2/5 | 产品范围和页面清单是清楚的，但没有“一次一个 feature”的执行约束。 | 在 `AGENTS.md` 中固定单 feature 推进规则。 |
| Lifecycle | 1/5 | 没有初始化、恢复和结束会话流程。 | 在 `AGENTS.md`、`session-handoff.md` 和 `init.sh` 中补齐恢复路径。 |

## 最低分瓶颈

当前最弱的是：

- `State`
- `Lifecycle`

这意味着真正的问题并不是“没有前端架构想法”，而是“会话结束后没有稳定状态，下一次很难无损恢复”。

## 本次 Harness 范围

本次只建立最小可用框架，不额外扩张业务实现范围：

1. 为项目根目录补齐统一说明文件。
2. 为项目根目录补齐 feature 状态与会话交接文件。
3. 为项目根目录补齐统一验证入口脚本。
4. 不在本次任务中强行重构 `web/` 或初始化 `backend/`。

## 后续补强

在基线建立之后，项目又补做了一个关键收束动作：

- 把阶段性目录名 `项目3/` 正式收束为 `multimodal-ai-course-platform/`。
- 在工作区根目录新增路由型 `AGENTS.md`，避免后续会话从错误根路径恢复。

这一步不改变业务范围，但显著降低了 instructions 和 lifecycle 的歧义成本。

## 后续建议

1. 先保持 `feat-004` 为当前活跃 feature，确保前端基础稳定。
2. 开始补单页面时，严格做到“一次一个页面或一个共享能力”。
3. 一旦初始化后端脚手架，立刻把后端验证命令并入 `init.sh`，避免再出现项目级验证断层。
