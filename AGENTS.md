# AGENTS.md

多模态 AI 课程成果平台的项目级 harness。`multimodal-ai-course-platform/` 是唯一 canonical project root；这个仓库同时承载课程数据、UI 参考资产、前端工程和后端服务，所有后续开发都应围绕可恢复、可验证、可交接来推进。

## Startup Workflow

开始编码前按顺序执行：

1. 阅读本文件，明确当前工作规则。
2. 阅读 `README.md` 了解仓库边界和 6 个页面目标。
3. 阅读 `docs/architecture/2026-06-05-multimodal-ai-platform-web-architecture-spec.md`，确认设计基准与技术路线。
4. 阅读 `docs/architecture/2026-06-05-project-root-canonicalization.md`，确认当前目录命名、工作区入口和后续重构约束。
5. 阅读 `feature_list.json`、`progress.md`、`session-handoff.md`，确认当前进度、活跃特性和阻塞项。
6. 在项目根目录运行 `./init.sh`，先拿到当前可验证状态，再开始改动。

## Source Of Truth

- 视觉基准：`docs/ui-reference/high-fidelity/`
- 页面结构参考：`docs/ui-reference/html-reference/`
- 产品与目录总览：`README.md`
- Web 架构基线：`docs/architecture/2026-06-05-multimodal-ai-platform-web-architecture-spec.md`
- 项目根命名与入口规范：`docs/architecture/2026-06-05-project-root-canonicalization.md`
- 当前工作状态：`feature_list.json`、`progress.md`、`session-handoff.md`

## Working Rules

- 一次只推进一个明确 feature，不同时跨做多个页面和后端接口。
- 最终页面以高保真原型图为准，HTML 参考稿只能借结构和局部样式，不能直接视为生产代码。
- 前端在替换 mock 数据前，先确认对应 API contract 已落在 `backend/app/schemas/` 中，并通过 `backend/scripts/sync_api_contracts.py` 同步到 `web/src/shared/api/generated-contract.ts`。
- 后端变更要同步检查 `web/src/shared/api/client.ts` 和对应页面的数据消费方式，避免合同漂移。
- 目录、脚本和文档中的正式项目名统一使用 `multimodal-ai-course-platform`，不再继续使用 `项目3` 这种阶段性命名。
- 新增文件必须放进 `docs/`、`data/`、`web/`、`backend/`、`scripts/` 对应目录，避免根目录继续发散。
- 声称“完成”前必须运行相关验证命令；如果有验证无法运行，要把原因写进 `progress.md`。
- 每次结束前都要更新 `feature_list.json`、`progress.md` 和 `session-handoff.md`，保证下一次会话能直接接续。

## Required Artifacts

- `feature_list.json`
  - 维护 feature 状态、依赖和完成证据。
- `progress.md`
  - 维护当前里程碑、验证结果、风险和推荐下一步。
- `session-handoff.md`
  - 维护中断后如何恢复、从哪里继续、有哪些未决事项。
- `init.sh`
  - 统一入口，负责最小化启动检查和项目验证。

## Verification Commands

优先使用：

- `./init.sh`
- `./init.sh e2e`

按需单独执行：

- `cd web && npm run lint`
- `cd web && npm run test`
- `cd web && npm run build`
- `cd web && npm run e2e:smoke`
- `cd web && npm run dev`
- `cd backend && uv sync`
- `cd backend && uv run pytest`
- `cd backend && uv run python scripts/sync_api_contracts.py`
- `cd backend && uv run python scripts/warm_runtime_assets.py`
- `cd backend && uv run uvicorn app.main:app --reload --port 8000`
- `./scripts/run_e2e_smoke.sh`

说明：

- 当前 `backend/` 已经落下 `FastAPI + Pydantic + SQLite` 基线，并通过 `pytest` 做接口验证。
- `./init.sh e2e` 会在默认前后端验证之后继续执行运行时缓存预热与 Playwright 烟雾回归。
- 当前 `./init.sh` 默认已经覆盖前端 `lint + component tests + build`，避免组件测试层只在手工场景下运行。
- 当前 `./init.sh` 默认还会检查 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts` 是否与后端 OpenAPI 合同保持同步。
- `scripts/run_e2e_smoke.sh` 会自动拉起临时前后端服务、选择空闲端口，并运行 Playwright 烟雾回归。
- 新增后端接口时，必须同步更新 `backend/tests/`、`init.sh` 和本文件中的验证命令。

## Definition Of Done

一个 feature 只有在满足以下条件后才能标记为完成：

- 实现或文档产物已经落盘。
- 相关验证命令已执行并通过，或明确记录了未运行原因。
- `feature_list.json` 已补上状态与 evidence。
- `progress.md` 已记录本次变更、风险和下一步。
- `session-handoff.md` 已能指导下一次会话从相同上下文恢复。

## End Of Session

结束前固定执行：

1. 更新 `progress.md` 中的“本次完成”“验证结果”“下一步”。
2. 更新 `feature_list.json` 中受影响的 feature 状态和 evidence。
3. 更新 `session-handoff.md` 中的恢复步骤与当前阻塞。
4. 记录未完成项的第一步动作，避免留下模糊待办。
