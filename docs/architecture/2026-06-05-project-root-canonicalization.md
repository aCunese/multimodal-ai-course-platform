# 项目根命名规范化与工作区路由收束

## 目标

把阶段性目录名 `项目3/` 收束为正式项目根 `multimodal-ai-course-platform/`，并补齐工作区级入口，让后续任何人或代理都能从同一个根路径恢复项目上下文。

## 问题

在已有项目级 harness 基线之后，仓库仍然存在三个明显歧义：

1. harness 文件挂在 `项目3/` 这个临时命名下，不利于长期维护、交付和对外说明。
2. 工作区根目录没有自己的 `AGENTS.md`，新会话很容易停留在课程目录层级，不知道该进入哪个正式项目根。
3. 工作区根目录还散落着课程文档生成脚本，说明“根目录只做路由”的边界没有真正落地。

这会直接影响 harness 的两个子系统：

- `Instructions`
  - 入口路径不唯一，恢复流程容易分叉。
- `Lifecycle`
  - 会话切换时容易从错误目录开始，导致验证命令、文档更新和状态记录落错位置。

## 决策

### 1. 统一 canonical project root

正式项目根目录固定为：

```text
multimodal-ai-course-platform/
```

后续要求：

- 目录名、脚本输出、文档说明统一使用 `multimodal-ai-course-platform`。
- 不再继续使用 `项目3` 作为项目名、路径名或交接入口。
- UI 展示和中文文档仍然可以使用中文产品名 `多模态 AI 课程成果平台`。

### 2. 引入双层入口

入口分为两层：

1. 工作区级入口
   - 根目录 `AGENTS.md`
   - 根目录 `README.md`
2. 项目级入口
   - `multimodal-ai-course-platform/AGENTS.md`
   - `multimodal-ai-course-platform/README.md`
   - `feature_list.json`
   - `progress.md`
   - `session-handoff.md`
   - `init.sh`

这样做的目的不是增加层级，而是把“先找到项目”与“进入项目后如何工作”拆开，减少恢复歧义。

### 3. 项目脚本回收进正式项目根

工作区根目录不再承载业务脚本。课程文档生成器统一迁入：

- `multimodal-ai-course-platform/scripts/`

## 影响

### Instructions

- 从“只有项目内规则”升级为“工作区路由 + 项目执行规则”。
- 任何新会话先读根目录 `AGENTS.md`，再进入正式项目根。

### State

- `feature_list.json`、`progress.md`、`session-handoff.md` 继续保留在项目根，不上移到工作区层。
- 状态文件只对应一个正式项目，避免课程目录层出现第二套状态源。

### Verification

- 验证入口仍然只有一个：`multimodal-ai-course-platform/init.sh`。
- 所有文档中的示例命令统一为 `cd multimodal-ai-course-platform && ./init.sh`。

### Scope

- 项目重构范围限定为“命名规范化与入口收束”，不顺手扩张到业务功能改造。
- 后续仍然遵守“一次只推进一个 feature”的规则。

### Lifecycle

- 恢复路径已经固定为：工作区根 -> 项目根 -> `./init.sh` -> 选择单个 feature。
- 结束会话时，若修改了路径规范或结构约束，必须同步更新工作区根和项目根文档。

## 后续约束

1. 新增业务代码、文档和状态文件时，只放在 `multimodal-ai-course-platform/` 内。
2. 项目内部脚本统一放在 `multimodal-ai-course-platform/scripts/`，不再放回工作区根目录。
3. 如果未来再次调整目录结构，必须同步更新：
   - 工作区 `AGENTS.md`
   - 工作区 `README.md`
   - 项目 `AGENTS.md`
   - `progress.md`
   - `session-handoff.md`
   - 相关 architecture 文档
4. 若旧路径 `项目3/` 在本地环境再次出现，应视为废弃目录并及时清理，避免误用。
