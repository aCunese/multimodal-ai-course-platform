# Progress

Last updated: 2026-06-07

## Current Snapshot

- 仓库已经完成目录归档，课程数据、UI 参考稿与运行时代码边界明确。
- 项目根 `multimodal-ai-course-platform/` 现已初始化为正式 Git 仓库，并接入 GitHub 私有远端 `origin`：`https://github.com/aCunese/multimodal-ai-course-platform`。
- 项目级 `.gitignore` 已按当前真实工程边界补齐，明确排除了 `web/node_modules`、`web/dist`、`backend/.venv`、`backend/var`、`output/`、`.playwright-cli/`、实验原始压缩包目录，以及 `experiment-01` 与 `dataset/` 重复的 `raw/` 原图目录。
- 正式项目根目录已经统一为 `multimodal-ai-course-platform/`，工作区根目录新增了路由型 `AGENTS.md` 与更新后的 `README.md`。
- 原先位于工作区根目录的课程文档生成脚本已经迁入 `scripts/`，并改为输出到项目内的 `docs/course-materials/generated-output/`。
- 课程报告与项目部署说明书已经按学院模板重新生成，目录页码、标题层级、正文行距和图片题注格式已统一到课程提交规范。
- 课程报告与项目部署说明书的首页页眉、首页页脚和左右对齐方式已进一步修正：当前首页已经显示页眉与 `第 1 页` 页脚，页眉改为无边框双列表格锚定，左侧文档名贴左、右侧“多模态AI课程成果平台”贴右。
- 课程文档生成链路已在本轮继续对齐桌面交付稿：实验报告 `4.3 系统运行` 现已补齐首页总览、情感分析、文案生成与博物馆图像识别运行图，其中新增 `图4.6 博物馆图像识别模块运行效果图`；项目部署说明书中手工稿残留的 Node 版本门槛也已修正为真实项目基线 `20.19.0`。
- 项目根目录现已补上一条本地邮件自动化链路：`scripts/send_mail_via_mail_app.py` 会复用 macOS Mail 中已经配置好的 QQ 账户向 `946265043@qq.com` 发信，Codex app 里的 `每日 AI 邮件速递` cron 自动化则会每天搜索 AI 动态并调用该脚本完成邮件投递。
- 项目内现已补齐 `docs/course-materials/templates/` 模板归档，课程报告和项目部署说明书会在项目根内统一生成，不再依赖工作区外层目录作为正式交付位置。
- 课程报告内容现已对齐当前真实项目状态，覆盖前端、后端、课程数据、运行时缓存、OpenAPI 合同、搜索与交付导出链路；项目部署说明书也已重写为覆盖前后端启动、缓存预热、合同校验与 `./init.sh e2e` 验收的完整版本。
- `web/` 已存在可运行的 React + TypeScript + Vite 前端基础，包含路由、共享样式、页面占位和 mock 数据。
- `web/` 已新增共享 API client，首页、历史页与 4 个业务模块都可以请求真实后端接口而不是只依赖页面内本地推理。
- `backend/` 已经落下 `FastAPI + Pydantic + SQLite` 服务骨架，并提供首页摘要、历史记录、图像识别、情感分析、文案生成和博物馆图像理解接口。
- `backend/` 的文本类能力已经开始直接消费 `experiment-02` 真实课程数据：情感分析会从 IMDb 数据集构建词典，文案生成会从 `poetry.txt` 读取诗词语料。
- `backend/` 的文案生成模块现在也支持通过 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek` 接入 DeepSeek API；当远程接口不可用、未配置密钥或返回内容不合法时，会自动回退到现有本地模板与诗词语料生成逻辑，保证课堂演示稳定性。
- `backend/` 的情感分析模块本轮也已升级为 `MULTIMODAL_SENTIMENT_PROVIDER=local|deepseek` 的“双引擎”结构：优先走 DeepSeek 结构化分析，异常时自动回退到本地 IMDb 词典，并把当前实际使用的 provider 状态暴露给前端。
- `backend/` 的图像识别模块已经开始直接消费 `experiment-01` 真实课程数据：后端会自动准备中药样本数据集，并基于上传图片内容提取颜色与纹理特征完成 5 类中药材分类。
- `backend/` 的中药分类器现在会把训练结果持久化到 `backend/var/herbal-classifier.pkl`，降低新后端进程首次请求时的训练开销。
- `backend/` 的博物馆模块已经开始直接消费 `experiment-03` 真实图像数据：上传文件会把图片内容发到后端，并和课程博物馆图像数据集做相似度比对。
- `backend/` 的博物馆特征索引现在也会持久化到 `backend/var/museum-feature-index.pkl`，降低新后端进程首次馆藏检索时的索引构建开销。
- 首页总览已经补上“运行时资源状态”面板，可直接读取后端缓存状态，并主动预热中药分类器与博物馆特征索引。
- 项目现在已经有显式的缓存预热链路：既可以通过后端 `runtime-assets` 接口触发，也可以通过 `backend/scripts/warm_runtime_assets.py` 与 `./init.sh e2e` 统一执行。
- `web/` 现在已经补上 `Vitest + React Testing Library` 组件级测试基线，当前覆盖首页运行时资源面板与历史页导出兜底逻辑。
- 组件测试覆盖面已经继续扩展到两个文本模块：情感分析页的默认加载 / 重分析 / 关键词过滤，以及文案生成页的后端结果映射 / 历史同步 / 示例恢复。
- 文本模块本轮已补回共享 fallback helper 的真实接线：`sentiment-analysis` 在分析失败时会按当前输入生成本地判断并展示命中的原始词与中文语义，`text-generation` 在生成失败时会按当前主题/风格/类型生成新的本地兜底文案，避免页面只提示失败却不刷新结果区。
- 组件测试覆盖面已经继续扩展到两个图像模块：图像识别页的样例加载 / 本地上传触发重新识别，以及博物馆页的初始来源识别 / 样例切换后结果更新。
- 历史记录页已经补上后端导出链路，当前支持按关键字、模块、状态筛选后导出 `JSON / CSV` 文件。
- 历史记录与项目说明页现在还会从后端 `GET /api/v1/history/metadata` 读取筛选项、导出格式、项目说明、模块导览，以及页面级标题/表头/按钮文案；本轮又继续把同步提示、导出反馈、记录计数模板和行操作标签也收口到同一份 metadata 合同里，进一步减少前端与后端之间的页面元信息漂移。
- `web/src/test/setup.ts` 现在已补上全局 `afterEach(cleanup)`，避免组件测试之间残留 DOM 导致选择器误命中。
- 后端 OpenAPI 合同现在已经可以自动同步为 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`，`web/src/shared/api/types.ts` 退化为轻量门面，减少手写 API 类型漂移。
- 生成的前端 API 合同现在还会额外输出 `BackendApiOperationMap`，把 operation 级 `method / path / query / requestBody / responseBody` 一并落盘，`HistoryQuery` 和导出格式已开始直接从这层映射推导。
- 前端 `web/src/shared/api/client.ts` 现在也已经切到生成出来的 `backendApiOperations` 运行时元信息，不再手写 `/dashboard`、`/runtime-assets`、`/history/export` 等路径和 method 字符串。
- `backendApiOperations` 现在还会额外包含 `queryKeys`，`web/src/shared/api/client.ts` 已通过 `buildOperationUrl()` 按 operation 合同统一组装查询字符串，历史页不再保留专门的手写 `buildHistorySearchParams()`。
- `GET /api/v1/history/export` 现在已经补齐正式导出响应合同：JSON 导出结构有独立 schema，CSV 下载类型与 `Content-Disposition` 文件名头也已进入 OpenAPI。
- 生成出来的 `backendApiOperations` 现在还会继续携带 `successStatus / responseContentTypes / responseHeaderKeys`，前端下载 helper 已切到消费这层响应元信息，不再保留端点专属的下载头判断。
- OpenAPI query parameter 默认值现在也已进入前端运行时合同：`backendApiOperations` 会继续生成 `queryDefaults`，历史页初始化状态和“清空筛选”动作已改为直接消费后端声明的默认值。
- OpenAPI 非成功响应 schema 现在也已进入前端运行时合同：`backendApiOperations` 会继续生成 `errorResponses / errorResponseSchemas`，前端 client 已开始按 operation 合同区分 `ApiErrorResponse` 和 `HTTPValidationError`。
- 顶栏“导出演示报告”现在也已经切到真实后端接口：`GET /api/v1/project-report/export` 会导出包含首页摘要、运行时缓存状态和历史页元信息的实时 JSON 快照，前端仅在接口不可用时才回退到本地演示数据导出。
- 顶栏全局搜索现在也已经切到真实后端接口：`GET /api/v1/search` 会统一搜索页面入口与历史记录建议，`AppShell` 搜索框不再只是跳转历史页，而会实时展示可点击建议并导航到对应页面或记录。
- AppShell 顶栏剩余停留在前端本地的壳层语义现在也已经切到独立后端接口：`GET /api/v1/app-shell/metadata` 会统一提供搜索框 aria/占位/状态文案、toolbar 按钮文案、账号 pill 展示语义，以及演示报告本地 fallback 的标题与文件名，`AppShell` 挂载后会优先消费这份 metadata。
- 博物馆图像理解页的“导出标签”现在也已经切到真实后端接口：`POST /api/v1/museum-vision/export-tags` 会生成可下载的标签文本文件，前端仅在接口不可用时才回退到本地标签导出。
- 文案生成页的默认配置现在也已经切到真实后端接口：`GET /api/v1/text-generation/metadata` 会提供风格选项、生成类型、默认表单配置、示例输出与恢复示例所需元信息；本轮又继续把页面标题说明、同步反馈、生成状态提示、恢复示例提示、复制按钮文案和生成/重新生成按钮标签也收口到同一份 metadata 合同里，页面不再只依赖 TSX 内部硬编码。
- 图像识别页的默认样例元信息现在也已经切到真实后端接口：`GET /api/v1/image-recognition/metadata` 会提供默认样例资产标识、默认识别结果和模型说明，页面启动时会优先按后端 metadata 初始化样例和说明文案，接口不可用时再回退到本地兜底。
- 博物馆图像理解页的默认样例和页面说明元信息现在也已经切到真实后端接口：`GET /api/v1/museum-vision/metadata` 会提供样例资产列表、默认识别结果、描述补充文案和数据来源说明，页面启动时会优先按后端 metadata 初始化样例、描述说明和底部数据来源面板，接口不可用时再回退到本地兜底。
- 博物馆图像理解页残留在前端本地的页面级标题说明、同步反馈、复制/导出标签文案，以及上传/切换样例状态标签现在也已继续收口到同一份 `museum-vision/metadata` 合同，页面展示语义进一步减少了 TSX 内部硬编码。
- 首页总览页残留在前端本地的摘要同步中提示、模块入口文案，以及运行时缓存卡片里的“已生成 / 未生成”状态标签现在也已继续收口到 `dashboard/metadata` 合同，首页展示语义进一步减少了 TSX 内部硬编码。
- 图像识别页残留在前端本地的页面标题说明、同步提示、上传区/结果区标题、按钮文案和状态标签现在也已继续收口到 `image-recognition/metadata` 合同，页面展示语义进一步减少了 TSX 内部硬编码。
- 情感分析页的默认示例文本和页面说明元信息现在也已经切到真实后端接口：`GET /api/v1/sentiment-analysis/metadata` 会提供示例文本、待分析占位结果、模型标签和分析说明；本轮又继续把页面标题说明、同步/空输入反馈、输入区与分析按钮文案、以及关键词切换按钮标签也收口到同一份 metadata 合同里，页面启动时会优先按后端 metadata 初始化输入区与默认结果卡片，接口不可用时再回退到本地兜底。
- 首页总览页的标题说明、摘要同步文案与 Hero 横幅元信息现在也已经切到真实后端接口：`GET /api/v1/dashboard/metadata` 会提供页面标题、页面说明、摘要同步提示文案、横幅标题、横幅描述和两个 CTA 按钮配置，首页启动时会优先按后端 metadata 初始化介绍区与横幅区域，接口不可用时再回退到本地兜底。
- 首页运行时资源面板与最近实验记录面板的标题、动作文案和运行时摘要文案现在也已经继续收口到后端合同：`GET /api/v1/dashboard/metadata` 会额外提供两个面板的标题与动作文案，`GET/POST /api/v1/runtime-assets*` 会直接返回可展示的 `summaryMessage`，首页不再自行拼装运行时摘要提示。
- 顶栏现在还新增了一个正式的“导出交付包”链路：`GET /api/v1/project-deliverables/export` 会由后端打包生成 ZIP，统一包含演示报告、历史记录、运行时资源状态、历史页元信息、OpenAPI 合同，以及 `README / feature_list / progress / session-handoff / architecture` 等项目状态文档，便于课程提交或交接时一次下载完整项目状态。
- 交付包内的 `manifest.json` 现已增强为 `v1.1` 结构，除 `path / category / sizeBytes` 外，还会继续输出 `sha256 / contentType / sourceKind / sourcePath`，便于核对 ZIP 内每个文件的来源、类型与完整性。
- 浏览器烟雾回归脚本的端口探测现在也已收口到 `scripts/find_free_port.mjs`，只会在 `EADDRINUSE` 时继续尝试下一个端口；若遇到 `EPERM` 这类非可恢复绑定错误，会直接给出清晰失败原因，不再递归撞到 `65536`。
- 首页总览还残留在前端本地的运行时缓存标签与最近实验记录表头，现已继续收口到 `GET /api/v1/dashboard/metadata`：运行时卡片会按后端下发的 `缓存文件 / 缓存体积 / 更新时间 / 暂无` 文案渲染，最近实验记录表头也改为按后端下发数组驱动，首页展示语义继续减少本地硬编码。
- 图像识别、情感分析与博物馆图像理解页面本轮又做了一次中文化细修：界面展示现在会优先显示中文类别名、中文情感语义和中文馆藏来源名，图像识别页也去掉了 `Dangshen / Huaihua` 这类拼音主标签。
- `web/src/shared/copy/display.ts` 现已新增统一展示格式化层，用来把后端或 mock 数据里残留的英文 / 拼音结果在界面上收口成中文，减少页面 copy 漂移。
- 后端默认 metadata 与历史输出本轮也同步收口为中文语义：账号角色 `Student` 已改为 `学生`，情感分析历史结果改为 `正面 / 负面 / 中性`，博物馆来源默认展示改为中文馆名，图像识别历史输出改为中文药材名。
- 顶栏长页面标题本轮也补了一次桌面端展示修正：`museum-vision` 与 `history` 页面对应的共享顶栏标题现在会优先保持单行，不再被搜索框和右侧按钮区挤成两行。
- 6 个主页面默认首屏 success 胶囊提示本轮已统一收口：首页、图像识别、情感分析、文案生成、博物馆和历史页都改为默认不显示 success 提示，只在加载中、失败/回退或显式操作成功时展示即时反馈。
- 文案生成页与情感分析页本轮都已补上 provider 可观测状态：页面结果区会明确展示“当前生成/分析引擎”为 DeepSeek 还是本地回退，不再靠顶部提示文案猜测后端是否真的生效。
- 历史记录页现已补上真正可用的分页：每页固定显示 `8` 条记录，同时把页码条收束为“上一页 / 当前附近页码 / 省略号 / 尾页 / 下一页”的紧凑形式，避免真实大数据量时把下方项目说明继续向下挤压。
- 文案生成页的“历史生成记录”现在也已补上真正可用的分页：每页固定显示 `8` 条记录，并复用与历史页一致的紧凑页码控件，避免文案记录持续累积后把页面纵向拉得过长。
- 项目级 harness 已补齐基础文件，后续会话可以从统一规则、进度状态和验证入口恢复。

## Five-Subsystem Baseline

### Instructions

- 已有：项目级 `README.md`、架构文档、UI 参考文档。
- 新增：工作区级 `AGENTS.md` 负责路由，项目级 `AGENTS.md` 负责执行规则。

### State

- 新增：`feature_list.json`、`progress.md`、`session-handoff.md`。

### Verification

- 已有：`web/package.json` 中的 `lint`、`build`、`dev`。
- 新增：`init.sh` 作为统一验证入口，`scripts/run_e2e_smoke.sh` 作为真实浏览器烟雾回归入口。

### Scope

- 当前规则：一次只推进一个 feature，优先完成 `web/` 中单个页面或单条后端能力，不跨多个模块同时展开。

### Lifecycle

- 当前规则：每次会话结束前必须更新 feature 状态、进度记录和 handoff 文档。

## Verification Baseline

推荐优先执行：

```bash
cd multimodal-ai-course-platform
./init.sh
```

如果只检查前端：

```bash
cd multimodal-ai-course-platform/web
npm run lint
npm run test
npm run build
```

如果要跑真实浏览器烟雾回归：

```bash
cd multimodal-ai-course-platform
./scripts/run_e2e_smoke.sh
```

如果要把“前后端验证 + 缓存预热 + 浏览器烟雾回归”一次跑完：

```bash
cd multimodal-ai-course-platform
./init.sh e2e
```

### Latest Verification Result

- 2026-06-07：围绕“项目 Git 仓库初始化与 GitHub 建仓”完成了仓库级校验，当前结果为：
  - 项目根目录 fresh 执行 `./init.sh` 通过；当前完整验收结果为前端组件测试 `38 passed`、后端测试 `50 passed`
  - `gh auth status` 通过，确认当前 GitHub 账号为 `aCunese`
  - staged-file 审计确认当前纳入版本控制的文件中没有任何单文件超过 `50MB`
  - GitHub 私有仓库 `https://github.com/aCunese/multimodal-ai-course-platform` 已创建并配置为本地 `origin`
- 2026-06-07：围绕“文本模块 fallback helper 重新接线”执行了定向与整体验收，结果通过：
  - `cd web && npm run test -- src/features/sentiment-analysis/page.test.tsx src/features/text-generation/page.test.tsx`，结果为 `2 passed files / 6 passed tests`
  - `cd web && npm run test`，结果为 `9 passed files / 38 passed tests`
  - 使用 Playwright 对 `http://127.0.0.1:5173/sentiment-analysis` 与 `http://127.0.0.1:5173/text-generation` 做断网 spot-check：主动中断对应 API 请求后，情感分析仍可按输入给出“负面判断”，文案生成仍可按输入主题生成新的本地兜底文案
  - 项目根目录执行 `./init.sh` 通过；当前完整验收结果为前端组件测试 `38 passed`、后端测试 `50 passed`
- 2026-06-07：围绕“DeepSeek 可观测化 + 情感分析 provider + 顶栏/提示条整理”执行了整体验收，结果通过：
  - `cd web && npm run test`，结果为 `9 passed files / 36 passed tests`
  - `cd backend && uv run pytest -q`，结果为 `50 passed`
  - 项目根目录执行 `./init.sh` 通过
  - 项目根目录执行 `./init.sh e2e` 通过；期间同步修正了 `web/scripts/e2e-smoke.mjs` 中仍使用旧英文/拼音展示文案的断言，当前 Playwright smoke 已按中文展示结果验证图像识别、情感分析、全局搜索、文案生成、博物馆导出与历史导出链路
- 2026-06-07：围绕“文案生成历史记录改为 8 条分页”执行了定向验证，当前结果为：
  - `web/` 内执行 `npm run test -- src/features/text-generation/page.test.tsx`，结果为 `3 passed`
  - `web/` 内执行 `npm run lint` 通过
  - 项目根目录 fresh 执行 `./init.sh` 未通过，但失败点与本次分页改动无直接关系；当前卡在既有前端组件测试：`dashboard/page.test.tsx` 2 条失败、`history/page.test.tsx` 1 条失败、`image-recognition/page.test.tsx` 2 条失败、`museum-vision/page.test.tsx` 3 条失败。此次未顺手扩修这些无关模块，只记录为当前基线状态。
- 2026-06-07：围绕“顶栏标题单行显示 + 历史页 8 条分页”执行了前端定向与整体验证，结果通过：
  - `web/` 内执行 `npm run test -- src/features/history/page.test.tsx`，结果为 `3 passed`
  - `web/` 内执行 `npm run test`，结果为 `34 passed`
  - 项目根目录执行 `./init.sh` 通过，完整验收结果已更新为：前端组件测试 `34 passed`、后端 API 测试 `46 passed`
  - 使用 Playwright 实际抓取 `/museum-vision`、`/history` 与 `/history?page=2` 页面截图，已确认两个顶栏标题在桌面宽度下保持单行，且历史页分页条不会再因真实大数据量而铺满整屏
- 2026-06-07：围绕“英文描述替换为中文 + 去掉图像识别页拼音标签”执行了定向与全量验收，结果均通过：
  - `web/` 内执行 `npm run test -- src/features/image-recognition/page.test.tsx src/features/sentiment-analysis/page.test.tsx src/features/museum-vision/page.test.tsx src/features/history/page.test.tsx src/shared/layout/AppShell.test.tsx`，结果为 `14 passed`
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'sentiment_analysis_keeps_frontend_sample_positive or sentiment_analysis_uses_imdb_lexicon_terms or image_recognition_metadata_returns_backend_defaults or app_shell_metadata_returns_backend_defaults or search_returns_history_suggestions or museum_vision_tag_export_returns_downloadable_txt or museum_vision_metadata_returns_backend_defaults or image_recognition_upload_uses_real_herbal_dataset or image_recognition_reuses_cached_herbal_classifier or museum_vision_upload_uses_real_dataset_match or museum_feature_index_reuses_disk_cache'`，结果为 `10 passed`
  - 项目根目录执行 `./init.sh` 通过，完整验收结果已更新为：前端组件测试 `34 passed`、后端 API 测试 `46 passed`
- 2026-06-07：围绕“每日 AI 邮件速递自动化”执行了本地 Mail 配置确认与脚本级验证：
  - 通过 AppleScript 只读查询确认本机 `Mail` 已配置 `QQ` 账户，账号地址为 `946265043@qq.com`，IMAP 为 `imap.qq.com:993`，SMTP 为 `smtp.qq.com:587`
  - 在项目根目录执行 `python3 scripts/send_mail_via_mail_app.py --to 946265043@qq.com --subject 'Codex Mail Dry Run' --dry-run` 通过，确认脚本参数与 stdin 邮件正文读取链路正常
  - 在项目根目录执行 `python3 -m py_compile scripts/send_mail_via_mail_app.py` 通过
  - 通过 `osacompile` 对内嵌 Mail AppleScript 进行语法编译通过，确认发送脚本的 AppleScript 语法有效
  - Codex app 自动化已切换为本地 cron 任务 `每日 AI 邮件速递`，计划于每天 `09:00` 运行并调用该脚本向 `946265043@qq.com` 发出摘要邮件；本轮未主动发送测试邮件，避免在未经额外确认的情况下立即触发一封真实邮件
- 2026-06-07：在 `multimodal-ai-course-platform/` 内执行 `python scripts/generate_course_documents.py` 已通过，重新生成了项目内课程报告与部署说明书；其中已确认：
  - 生成版课程报告新增 `图4.6 博物馆图像识别模块运行效果图`
  - 生成版部署说明书中的环境要求文字已统一为 `Node 20.19.0`
- 2026-06-07：围绕 DeepSeek 文案生成接入执行了定向、真实远程链路与全量验收，结果均通过：
  - `backend/` 内执行 `uv run pytest tests/test_api.py -k 'text_generation_uses_deepseek_outputs_when_provider_enabled or text_generation_falls_back_to_local_outputs_when_deepseek_raises or text_generation_falls_back_to_local_outputs_when_api_key_missing' -v`，结果为 `3 passed`
  - 在 `backend/` 内显式设置 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek`、`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL=https://api.deepseek.com` 与 `DEEPSEEK_MODEL=deepseek-chat` 后执行真实 smoke 请求，输出 `provider= deepseek`、`enabled= True`，并成功返回 2 条远程生成结果
  - 项目根目录再次执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `33 passed`、后端 API 测试 `44 passed`、运行时缓存预热通过、Playwright smoke 通过
- 2026-06-07：又补做了一轮提交前最终验收，结果继续通过：
  - `backend/` 内使用 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek` 环境再次执行 `generate_text(TextGenerationRequest(...))`，输出 `provider= deepseek`、`enabled= True`、`output_count=2`，确认 DeepSeek provider 仍在真实生效
  - 使用 Playwright 对 `/`、`/image-recognition`、`/sentiment-analysis`、`/text-generation`、`/museum-vision` 与 `/history` 做逐页人工抽检，确认首页加载、图像识别上传、情感分析、文案生成、博物馆上传与历史筛选主链路均可用
  - 同轮人工抽检还覆盖了 `ghost` 搜索无结果提示、无效图片上传提示、文案生成失败保留最近一次结果、历史导出失败回退到本地 CSV 四个异常场景，均通过
  - 对 6 个主页面额外执行了不注入失败的纯净控制台巡检，结果为 `severe=[]`，未看到新的前端 console warning/error
- 2026-06-07：围绕“DeepSeek prompt 过于保守”继续做了一轮质量优化与复验，结果通过：
  - 调整了 `backend/app/services/llm_provider.py` 的 DeepSeek prompt，不再鼓励 `标题 1 / 宣传语 1 / 短文案 1` 这类占位标题，并按 `标题 / 宣传语 / 短文案 / 诗意表达` 分别约束输出风格与长度
  - 新增 `backend/tests/test_llm_provider.py`，锁定“prompt 明确禁止占位标题”和“provider 后处理会把占位标题修正为可展示标题”两条回归
  - `backend/` 内执行 `uv run pytest tests/test_llm_provider.py tests/test_api.py -k 'deepseek or text_generation_uses_deepseek_outputs_when_provider_enabled or text_generation_falls_back_to_local_outputs_when_deepseek_raises or text_generation_falls_back_to_local_outputs_when_api_key_missing' -v`，结果为 `4 passed`
  - 启用真实 DeepSeek 后再次执行样本生成，标题质量已明显改善，例如 `数据引擎全链路复盘 / 系统效能峰值报告 / 未来架构答辩实录`
  - 再次执行 `./init.sh e2e` 通过，最新整体验收结果更新为：前端组件测试 `33 passed`、后端测试 `46 passed`、运行时缓存预热通过、Playwright smoke 通过
  - 在 DeepSeek 启用的前后端联调环境下，对 `/text-generation` 做页面级 spot-check，确认前端实际展示结果已变为非占位标题，例如 `成果引擎·全链可视化 / 1780万次迭代的接口 / 系统级成果交付指南`
- 2026-06-06：在 `multimodal-ai-course-platform/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e` 已通过。
- 结果包含：
  - `web` 的 `npm run lint` 通过。
  - `web` 的组件测试通过，共 `33 passed`。
  - `web` 的 `npm run build` 通过。
  - `backend/` 的 `pytest` 通过，共 `41 passed`。
  - 运行时缓存预热通过。
  - Playwright smoke 通过，覆盖 dashboard warmup、project report、delivery bundle、image recognition、invalid upload、sentiment、global search、text generation、museum tag export 与 history csv export fallback 等链路。
- 2026-06-05：在 `multimodal-ai-course-platform/` 内执行 `./init.sh` 已通过。
- 结果包含：
  - `web` 的 `npm run lint` 通过。
  - `web` 的 `npm run build` 通过。
  - `backend/` 因尚未初始化脚手架而被正常跳过。
- 2026-06-06：在 `web/` 内执行 `npm run lint` 与 `npm run build` 已通过。
- 2026-06-06：在 `multimodal-ai-course-platform/` 内再次执行 `./init.sh` 已通过。
- 2026-06-06：首页资源替换后，使用本地浏览器打开 `http://127.0.0.1:5174/` 进行人工检查，已确认首页背景图、侧栏装饰图与统计卡插画不再出现明显遮挡或裁切。
- 2026-06-06：在 `backend/` 内执行 `uv run pytest` 通过，共 5 个 API 测试全部通过。
- 2026-06-06：在 `backend/` 内再次执行 `uv run pytest` 通过，共 6 个 API 测试全部通过，其中新增了一条真实诗词数据接入测试。
- 2026-06-06：在 `backend/` 内执行 `uv run pytest` 通过，共 8 个 API 测试全部通过，其中新增了 IMDb 词典回归与前端默认样例回归。
- 2026-06-06：在 `backend/` 内执行 `uv run pytest` 通过，共 9 个 API 测试全部通过，其中新增了博物馆上传图片与真实数据集比对回归。
- 2026-06-06：在 `backend/` 内再次执行 `uv run pytest -q` 通过，共 13 个 API 测试全部通过，其中新增了历史记录 `CSV/JSON` 导出回归与跨域导出头暴露回归。
- 2026-06-06：在 `backend/` 内再次执行 `uv run pytest -q` 通过，共 14 个 API 测试全部通过，其中新增了中药分类器磁盘缓存复用回归。
- 2026-06-06：在 `backend/` 内再次执行 `uv run pytest -q` 通过，共 15 个 API 测试全部通过，其中新增了博物馆特征索引磁盘缓存复用回归。
- 2026-06-06：在 `multimodal-ai-course-platform/` 内执行新的 `./init.sh` 通过，结果同时覆盖了前端 `lint/build` 和后端 `uv sync + pytest`。
- 2026-06-06：使用 Playwright 对运行中的前后端联调环境做端到端验证，已确认：
  - 首页总览从后端摘要接口读取状态文案。
  - 情感分析页可以触发后端分析，并在历史页通过关键字检索到新记录。
  - 文案生成页可以调用后端生成接口，且生成历史数量随请求增加。
- 2026-06-06：再次使用 Playwright 对情感分析页做浏览器级回归，已确认：
  - 页面默认样例会自动命中后端 IMDb 词典并展示正面结果。
  - 手动输入 `This sequel is a flop and feels copied.` 后，会返回 `Negative`，并在历史页通过 `flop` 检索到新增记录。
- 2026-06-06：使用 Playwright 对博物馆模块做真实上传回归，已确认：
  - 上传本地 `smithsonian_786.jpg` 后，页面会显示 `Smithsonian Institution`。
  - 结果说明会展示课程数据集相似样本。
  - 历史页会新增 `smithsonian_786.jpg -> Smithsonian Institution` 记录。
- 2026-06-06：使用 Playwright 对图像识别模块与历史导出做浏览器级回归，已确认：
  - 上传本地 `huaihua_1.jpg` 后，页面会显示 `槐花 / Huaihua` 与 `66.1%` 置信度。
  - 历史页顶部会出现 `huaihua_1.jpg -> Huaihua` 新记录。
  - 历史页切换为 `CSV` 导出格式后，会调用 `GET http://127.0.0.1:8001/api/v1/history/export?...&format=csv` 并成功下载文件。
- 2026-06-06：在项目根目录执行 `./scripts/run_e2e_smoke.sh` 通过，脚本会自动选择空闲端口并完成以下真实浏览器回归：
  - 首页运行时资源状态面板触发预热并确认两个缓存变为 `就绪`
  - 中药图片上传 `huaihua_1.jpg -> Huaihua`
  - 负面情感分析 `flop -> Negative`
  - 文案生成写入历史记录
  - 博物馆图片上传 `smithsonian_786.jpg -> Smithsonian Institution`
  - 历史页 `CSV` 导出下载与内容校验
- 2026-06-06：在默认运行目录下确认 `backend/var/herbal-classifier.pkl` 已生成，说明中药分类器训练结果会在真实运行时落盘复用。
- 2026-06-06：在默认运行目录下确认 `backend/var/museum-feature-index.pkl` 已生成，说明博物馆特征索引也会在真实运行时落盘复用。
- 2026-06-06：在 `backend/` 内执行 `uv run python scripts/warm_runtime_assets.py` 通过，命令会输出两项运行时资源状态与预热耗时，证明缓存可在不经过首个业务请求的情况下主动生成。
- 2026-06-06：在项目根目录执行 `./init.sh e2e` 通过，结果串行覆盖了 `lint/build + uv sync/pytest + 运行时缓存预热 + Playwright 烟雾回归` 整条验收链路。
- 2026-06-06：在 `web/` 内执行 `npm run test` 通过，共 2 条组件测试全部通过，当前覆盖：
  - 首页运行时资源状态面板的加载与预热交互
  - 历史页导出接口失败后的前端 CSV 兜底导出
- 2026-06-06：在 `web/` 内再次执行 `npm run test` 通过，共 4 条组件测试全部通过，新增覆盖：
  - 情感分析页默认样例自动分析、负面重分析与“仅积极”关键词过滤
  - 文案生成页后端生成结果映射、历史同步与“恢复示例”状态回退
- 2026-06-06：在 `web/` 内再次执行 `npm run test` 通过，共 6 条组件测试全部通过，新增覆盖：
  - 图像识别页课程样例初始识别与本地上传触发重新识别
  - 博物馆图像理解页初始样例识别与“切换样例”后的来源结果刷新
- 2026-06-06：在项目根目录再次执行 `./init.sh` 与 `./init.sh e2e` 均通过，新的统一验证入口已经覆盖前端 `lint + test + build`、后端 `uv sync + pytest`、缓存预热与 Playwright 烟雾回归。
- 2026-06-06：将后端 API 测试客户端迁移为 `httpx.AsyncClient + ASGITransport` 后，补上了 FastAPI lifespan 上下文，避免测试使用临时数据库路径时跳过建表初始化；随后在 `backend/` 内再次执行 `uv run pytest`，17 条 API 测试全部通过。
- 2026-06-06：在 `web/` 内执行 `npm audit --json`，当前依赖漏洞结果为 0；随后在项目根目录再次执行 `./init.sh e2e`，前端 `lint + test + build`、后端 `pytest`、缓存预热与 Playwright 烟雾回归再次整链通过。
- 2026-06-06：收紧了两个图片接口的上传合同：当 `image-recognition` 或 `museum-vision` 收到无效图片载荷时，后端现在会返回明确 `400` 错误，而不是静默回退到默认演示结果；前端两个页面也会直接展示后端错误文案。
- 2026-06-06：在 `backend/` 内再次执行 `uv run pytest -q` 通过，共 19 条 API 测试全部通过，新增覆盖：
  - 图像识别接口对无效图片上传返回显式错误
  - 博物馆图像理解接口对无效图片上传返回显式错误
- 2026-06-06：在 `web/` 内对 `image-recognition` 与 `museum-vision` 页面单独执行组件测试通过；随后在项目根目录再次执行 `./init.sh e2e` 通过，当前前端组件测试总数已增至 8 条，并新增覆盖两页的无效上传错误提示回归。
- 2026-06-06：在项目根目录再次执行 `./scripts/run_e2e_smoke.sh` 与 `./init.sh e2e` 通过，Playwright 烟雾脚本已新增真实浏览器级失败场景覆盖：
  - 图像识别页在有效上传 `huaihua_1.jpg -> Huaihua` 后，继续上传非图片文件时，会显示“上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。”
  - 无效上传后页面仍保留最近一次成功识别结果，不会静默回退为默认演示结果
- 2026-06-06：在项目根目录再次执行 `./scripts/run_e2e_smoke.sh` 与 `./init.sh e2e` 通过，Playwright 烟雾脚本已继续新增真实浏览器级失败场景覆盖：
  - 历史页在后端 `GET /api/v1/history/export?...` 请求被主动中断时，会回退到前端本地 CSV 导出
  - 回退下载的文件名为 `history-records.csv`，内容仍包含当前筛选结果，页面会显示“历史记录导出接口暂时不可用，已导出当前页面数据。”
- 2026-06-06：在 `web/` 内执行 `npm run test -- src/features/text-generation/page.test.tsx` 通过，共 2 条测试全部通过；当前已补齐“文案生成失败后保留最近一次成功结果”的组件级回归。
- 2026-06-06：在项目根目录再次执行 `./scripts/run_e2e_smoke.sh` 与 `./init.sh e2e` 通过，Playwright 烟雾脚本现已确认：
  - 文案生成页在成功生成后，如果后端 `POST /api/v1/text-generation/generate` 请求被主动中断，会显示“文案生成接口暂时不可用，当前保留最近一次生成结果。”
  - 失败提示出现后，页面仍保留最近一次成功生成的结果标题，不会回退到本地默认文案
- 2026-06-06：在 `backend/` 内执行 `uv run pytest -q tests/test_api.py -k history_metadata` 通过，新增确认 `GET /api/v1/history/metadata` 会稳定返回模块筛选项、状态筛选项、导出格式、项目说明和模块导览合同。
- 2026-06-06：在 `web/` 内执行 `npm run test -- src/features/history/page.test.tsx` 通过，共 2 条测试全部通过；新增覆盖历史页从后端读取元信息合同的渲染回归。
- 2026-06-06：在项目根目录再次执行 `./init.sh e2e` 通过，当前完整验收结果已更新为：
  - 前端组件测试 `10 passed`
  - 后端 API 测试 `20 passed`
  - 运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：在 `backend/` 内执行 `uv run python scripts/sync_api_contracts.py --check` 通过，说明 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts` 均与当前 FastAPI OpenAPI 合同保持同步。
- 2026-06-06：在 `web/` 内执行 `npm run lint` 与 `npm run build` 通过；其中 `build` 已验证新的生成类型门面 `web/src/shared/api/types.ts` 不会破坏现有前端消费路径。
- 2026-06-06：按用户提供的新素材替换了首页 Hero 封面图 `web/src/assets/hero/dashboard-hero.png`；当前资源尺寸为 `1913x822`，可继续直接被 `web/src/features/dashboard/page.tsx` 的横幅背景复用，无需额外改动布局结构。
- 2026-06-06：在项目根目录再次执行 `./init.sh e2e` 通过，统一验收入口现在还会额外执行“generated API contract artifacts” 校验步骤，确保后端 schema 与前端 API 类型没有静默漂移。
- 2026-06-06：在 `backend/` 内再次执行 `uv run python scripts/sync_api_contracts.py --check` 通过，生成器现在已经包含 `BackendApiOperationMap`，并确认：
  - `HistoryQuery` 已由 `history_api_v1_history_get.query` 推导
  - `HistoryExportFormat` 已由 `export_history_api_v1_history_export_get.query.format` 推导
- 2026-06-06：在项目根目录再次执行 `./init.sh e2e` 通过，说明 operation 级合同映射扩展没有破坏前端 `lint/test/build`、后端 `20 passed`、缓存预热或 Playwright 烟雾回归。
- 2026-06-06：在 `backend/` 内再次执行 `uv run python scripts/sync_api_contracts.py --check`、在 `web/` 内再次执行 `npm run lint` 与 `npm run build`、以及在项目根目录再次执行 `./init.sh e2e` 均通过；当前已确认 `web/src/shared/api/client.ts` 中的接口调用路径与 method 也已改为消费 `backendApiOperations`，不再手写维护。
- 2026-06-06：在 `backend/` 内再次执行 `uv run python scripts/sync_api_contracts.py --check`、在 `web/` 内再次执行 `npm run lint` 与 `npm run build`、以及在项目根目录再次执行 `./init.sh e2e` 均通过；当前已确认：
  - `backendApiOperations` 已生成 `queryKeys`
  - `web/src/shared/api/client.ts` 已改为使用 `buildOperationUrl()` 统一序列化 query 参数
  - 历史记录查询与导出链路不再保留专门的手写 query 拼接逻辑
- 2026-06-06：在 `backend/` 内执行 `uv run pytest -q tests/test_api.py -k history_export` 通过，共 `4 passed`，新增确认 `GET /api/v1/history/export` 的 OpenAPI 已声明：
  - `application/json` 导出结构引用 `HistoryExportResponse`
  - `text/csv` 导出内容标记为 binary schema
  - `Content-Disposition` 下载文件名头已进入响应合同
- 2026-06-06：在 `web/` 内执行 `npm run test -- src/shared/api/client.test.ts` 通过，共 `2 passed`，新增覆盖：
  - 历史导出下载 helper 会按 operation-aware query 参数发起请求
  - 有文件名头时优先读取后端文件名，无文件名头时回退到本地默认文件名
- 2026-06-06：在 `backend/` 内再次执行 `uv run python scripts/sync_api_contracts.py --check` 通过；生成合同现在已包含 `successStatus / responseContentTypes / responseHeaderKeys`，且 `export_history_api_v1_history_export_get.responseBody` 已从 `unknown` 收紧为 `HistoryExportResponse`。
- 2026-06-06：在项目根目录再次执行 `./init.sh e2e` 通过，当前完整验收结果已更新为：
  - 前端组件测试 `12 passed`
  - 后端 API 测试 `21 passed`
  - 运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：在 `backend/` 内再次执行 `uv run python scripts/sync_api_contracts.py --check` 通过；生成合同现在还会额外包含 `queryDefaults`，并确认：
  - `history_api_v1_history_get.queryDefaults` 为 `{ keyword: \"\", module: \"全部\", status: \"全部\" }`
  - `export_history_api_v1_history_export_get.queryDefaults` 为 `{ keyword: \"\", module: \"全部\", status: \"全部\", format: \"json\" }`
- 2026-06-06：在 `web/` 内执行 `npm run test -- src/shared/api/generated-contract.test.ts` 通过，共 `1 passed`，新增锁定生成合同会把历史查询与导出接口的默认 query 值输出到运行时元信息。
- 2026-06-06：在 `web/` 内执行 `npm run test -- src/features/history/page.test.tsx` 与 `npm run build` 通过；历史页当前已改为从生成合同读取默认筛选状态与默认导出格式，不再手写维护这些初始值。
- 2026-06-06：在项目根目录再次执行 `./init.sh e2e` 通过，当前完整验收结果已更新为：
  - 前端组件测试 `13 passed`
  - 后端 API 测试 `21 passed`
  - 运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：在 `backend/` 内再次执行 `uv run python scripts/sync_api_contracts.py --check` 通过；生成合同现在还会额外包含 `errorResponses / errorResponseSchemas`，并确认：
  - `image_recognition_api_v1_image_recognition_predict_post.errorResponseSchemas` 为 `{ "400": "ApiErrorResponse", "422": "HTTPValidationError" }`
  - `sentiment_analysis_api_v1_sentiment_analysis_analyze_post.errorResponseSchemas` 为 `{ "422": "HTTPValidationError" }`
- 2026-06-06：在 `web/` 内执行 `npm run test -- src/shared/api/generated-contract.test.ts src/shared/api/client.test.ts` 通过，共 `5 passed`，新增覆盖：
  - 生成合同会输出接口级错误响应 schema 名
  - 前端 client 遇到 `422 HTTPValidationError` 时会优先展示合同对应的校验错误消息
- 2026-06-06：在 `web/` 内执行 `npm run build` 通过；随后在项目根目录再次执行 `./init.sh e2e` 通过，当前完整验收结果已更新为：
  - 前端组件测试 `15 passed`
  - 后端 API 测试 `21 passed`
  - 运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：围绕新加的演示报告导出链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k project_report`，结果为 `2 passed`
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py`，结果为 `23 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py --check` 通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/shared/layout/AppShell.test.tsx` 通过
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `17 passed`、后端 API 测试 `23 passed`，且 Playwright 烟雾回归新增确认“导出演示报告”会下载后端实时快照文件
- 2026-06-06：顶栏全局搜索后端化后，围绕搜索建议链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'search or project_report'`，结果为 `5 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/shared/api/generated-contract.test.ts src/shared/layout/AppShell.test.tsx` 通过，共 `9 passed`
  - `web/` 内执行 `npm run lint` 与 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `19 passed`、后端 API 测试 `26 passed`，且 Playwright 烟雾回归新增确认顶栏全局搜索会返回后端建议并跳转到匹配历史记录
- 2026-06-06：博物馆标签导出后端化后，围绕下载链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'museum_tag_export or museum_vision_tag_export or project_report or search'`，结果为 `7 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/museum-vision/page.test.tsx` 通过，共 `9 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `21 passed`、后端 API 测试 `28 passed`，且 Playwright 烟雾回归新增确认博物馆页会下载后端生成的标签文件
- 2026-06-06：文案生成元信息后端合同化后，围绕 metadata 与恢复示例链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'text_generation_metadata'`，结果为 `2 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/text-generation/page.test.tsx` 通过，共 `9 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `22 passed`、后端 API 测试 `30 passed`，运行时预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：文案生成页 residual metadata 合同化继续推进后，围绕 `text-generation/metadata` 新增的页面标题说明、同步反馈、生成状态提示、恢复示例提示、复制按钮文案与生成/重新生成按钮标签再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k 'text_generation_metadata'`，结果为 `2 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/text-generation/page.test.tsx` 通过，共 `15 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：图像识别元信息后端合同化后，围绕 metadata 与默认样例初始化链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'image_recognition_metadata'`，结果为 `1 passed`
- 2026-06-06：博物馆页 residual metadata 合同化继续推进后，围绕 `museum-vision/metadata` 新增的页面标题说明、同步反馈、复制/导出标签文案与上传/切换样例状态标签再次执行定向、浏览器级与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k museum_vision_metadata`，结果为 `2 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/features/museum-vision/page.test.tsx src/shared/api/client.test.ts` 通过，共 `16 passed`
  - `web/` 内执行 `npm run build` 通过
  - 在真实浏览器打开 `http://127.0.0.1:4173/museum-vision` 复验通过，已确认页面会展示后端下发的 museum metadata，且复制描述、切换样例后的同步提示都能按后端文案驱动更新
  - 项目根目录执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：首页 residual metadata 合同化继续推进后，围绕 `dashboard/metadata` 新增的摘要同步中提示、模块入口文案与缓存卡状态标签再次执行定向、浏览器级与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k dashboard_metadata`，结果为 `2 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/features/dashboard/page.test.tsx src/shared/api/client.test.ts` 通过，共 `15 passed`
  - `web/` 内执行 `npm run build` 通过
  - 在真实浏览器打开 `http://127.0.0.1:4173/` 复验通过，已确认首页会正常展示模块入口、运行时面板与缓存状态文案，没有引入页面回归
  - 项目根目录执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：图像识别页 residual metadata 合同化继续推进后，围绕 `image-recognition/metadata` 新增的页面标题说明、同步提示、上传区/结果区标题、按钮文案与状态标签再次执行定向、浏览器级与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k image_recognition_metadata`，结果为 `1 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/features/image-recognition/page.test.tsx src/shared/api/client.test.ts` 通过，共 `15 passed`
  - `web/` 内执行 `npm run lint` 与 `npm run build` 通过；其中本轮还顺手修掉了 `image-recognition/page.tsx` 新引入的一条 `react-hooks/exhaustive-deps` 警告，并在修正后再次执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e` 复验通过
  - 在真实浏览器打开 `http://127.0.0.1:4174/image-recognition` 复验通过，已确认页面会展示后端下发的 image metadata，点击“示例图片”后页面交互仍正常
  - 项目根目录执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/image-recognition/page.test.tsx` 通过，共 `10 passed`
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `23 passed`、后端 API 测试 `31 passed`，运行时预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：博物馆图像理解元信息后端合同化后，围绕 metadata、样例初始化和数据来源说明链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'museum_vision_metadata'`，结果为 `2 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/museum-vision/page.test.tsx` 通过，共 `12 passed`
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `24 passed`、后端 API 测试 `33 passed`，运行时预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：情感分析元信息后端合同化后，围绕 metadata、默认示例初始化与页面说明链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'sentiment_analysis_metadata'`，结果为 `2 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py --check` 通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/sentiment-analysis/page.test.tsx` 通过，共 `11 passed`
  - `web/` 内执行 `npm run lint` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `25 passed`、后端 API 测试 `35 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：情感分析页 residual metadata 合同化继续推进后，围绕 `sentiment-analysis/metadata` 新增的页面标题说明、同步/空输入反馈、输入区与分析按钮文案、以及关键词切换按钮标签再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k 'sentiment_analysis_metadata'`，结果为 `2 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/sentiment-analysis/page.test.tsx` 通过，共 `14 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：首页总览元信息后端合同化后，围绕 metadata、横幅文案与 CTA 初始化链路再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'dashboard_metadata'`，结果为 `2 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/features/dashboard/page.test.tsx` 通过，共 `13 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `27 passed`、后端 API 测试 `37 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：首页面板文案合同化与运行时摘要后端下沉后，围绕 dashboard metadata 扩展字段与 runtime summary 合同再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'dashboard_metadata or runtime_assets'`，结果为 `4 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/features/dashboard/page.test.tsx` 通过，共 `2 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果维持为：前端组件测试 `27 passed`、后端 API 测试 `37 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：项目交付包 ZIP 导出链路落地后，围绕下载合同、前端触发和浏览器级打包校验再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest -q tests/test_api.py -k 'project_delivery_bundle or project_report'`，结果为 `4 passed`
  - `backend/` 内执行 `uv run python scripts/sync_api_contracts.py` 与 `uv run python scripts/sync_api_contracts.py --check` 均通过
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts src/shared/layout/AppShell.test.tsx` 通过，共 `15 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `29 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：项目交付包已继续扩展为结构化 manifest + 项目状态文档附件，当前 ZIP 内除演示报告和历史记录外，还会继续附带 `README.md`、`feature_list.json`、`progress.md`、`session-handoff.md` 与关键架构说明 Markdown；随后再次执行 `./init.sh e2e`，整链继续通过，最新基线保持为前端组件测试 `29 passed`、后端 API 测试 `39 passed`。
- 2026-06-06：项目交付包 manifest 已继续升级到 `v1.1`，新增 `sha256 / contentType / sourceKind / sourcePath` 文件级元信息；新增后的后端断言与真实浏览器 ZIP 下载校验均已通过，最新基线仍为前端组件测试 `29 passed`、后端 API 测试 `39 passed`、Playwright smoke 通过。
- 2026-06-06：在继续执行 `./init.sh e2e` 时暴露出一个真实 harness 缺陷：旧版端口探测把 `EPERM` 这类非可恢复绑定错误误判为“继续尝试下一个端口”，最终递归撞到 `65536`。现已将逻辑抽到 `scripts/find_free_port.mjs`，只在 `EADDRINUSE` 时继续递增，并新增 `scripts/find_free_port.test.mjs` 回归 `EADDRINUSE -> 下一个端口` 与 `EPERM -> 直接清晰失败` 两条场景；修复后重新执行 `node --test scripts/find_free_port.test.mjs` 与 `./init.sh e2e` 均通过，最新基线保持为前端组件测试 `29 passed`、后端 API 测试 `39 passed`、Playwright smoke 通过。
- 2026-06-06：首页 residual metadata 合同化继续推进后，围绕 `dashboard/metadata` 新增的运行时缓存标签与最近实验记录表头字段再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k dashboard_metadata`，结果为 `2 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/features/dashboard/page.test.tsx` 通过，共 `2 passed`
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts` 通过，共 `12 passed`
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `29 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：历史页页面级 metadata 合同化继续推进后，围绕 `history/metadata` 新增的页面标题、搜索/筛选/导出文案、表格标题/表头和模块导览动作文案再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k history_metadata`，结果为 `1 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/features/history/page.test.tsx` 通过，共 `2 passed`
  - `web/` 内执行 `npm run test -- src/shared/api/client.test.ts` 通过，共 `13 passed`
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果已更新为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：历史页 residual metadata 合同化继续推进后，围绕 `history/metadata` 新增的同步提示、导出反馈、记录计数模板与行操作标签再次执行定向与全量验证，结果均通过：
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run pytest -q tests/test_api.py -k history_metadata`，结果为 `1 passed`
  - `backend/` 内执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache uv run python scripts/sync_api_contracts.py` 通过，并已刷新 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`
  - `web/` 内执行 `npm run test -- src/features/history/page.test.tsx src/shared/api/client.test.ts` 通过，共 `15 passed`
  - `web/` 内执行 `npm run build` 通过
  - 项目根目录执行 `./init.sh e2e` 通过，完整验收结果保持为：前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时缓存预热与 Playwright 烟雾回归继续整链通过
- 2026-06-06：在项目根目录执行 `/Users/ruyne./.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/generate_course_documents.py` 后，课程报告与项目部署说明书已按项目内模板路径重新生成；随后检查生成文档，已确认两份文档目录均已刷新、页眉右侧内容已统一为 `多模态AI课程成果平台`、课程报告嵌入 `7` 张图片、部署说明书嵌入 `3` 张图片，且显式字体运行检查结果为 `0` 条非黑色文本。
- 2026-06-06：课程文档页码显示异常已进一步修复。根因是 Word 在刷新 `PAGE` 域后保留了一个字面量 `1` 后缀，导致页脚可能显示成 `31 页` 这类错误值；现已在 `scripts/generate_course_documents.py` 中调整页码域写法、把域刷新放到最终保存之后，并在生成完成后定点清理 footer XML 中残留的 `1 页` 后缀。
- 2026-06-06：继续执行 `/Users/ruyne./.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/generate_course_documents.py` 后，已把两份课程文档的页眉结构进一步改为无边框双列表格，并为 `default + first-page` 两套页眉页脚同时写入内容；随后使用 Microsoft Word 实际打开两份文档首页确认：
  - 首页页眉已显示
  - 首页页脚已显示 `第 1 页`
  - 左侧文档名与右侧“多模态AI课程成果平台”已分别贴左、贴右显示

## Known Risks

- `web/` 现在已经为 6 个页面都补上了至少一条组件级回归，且历史页元信息合同也已接口化，但覆盖深度仍然有限，很多边界场景依然主要依赖 API 测试和 Playwright 烟雾回归。
- 2026-06-06：按前端整体验收再次执行 fresh 验证，结果均通过：
  - 项目根目录执行 `./init.sh` 通过，结果为前端组件测试 `33 passed`、后端 API 测试 `41 passed`
  - 项目根目录执行 `./scripts/run_e2e_smoke.sh` 通过，真实浏览器主链路继续覆盖 dashboard warmup、project report、delivery bundle、image recognition、invalid upload、sentiment、global search、text generation、museum tag export、history csv export 与 fallback
  - 项目根目录执行 `./init.sh e2e` 通过，结果为前端组件测试 `33 passed`、后端 API 测试 `41 passed`、运行时缓存预热通过、Playwright smoke 通过
  - 额外使用 `playwright-cli` 对首页、全局搜索建议和历史页跳转做了手工抽检；首页控制台 warning/error 为 `0`，`GET /api/v1/dashboard*`、`GET /api/v1/runtime-assets`、`GET /api/v1/app-shell/metadata` 均返回 `200`，输入 `flop` 后可展示搜索建议并跳转到带记录筛选参数的历史页
- 当前 6 个业务页和首页总览页都已经至少把核心页面元信息或关键用户动作收口到了后端合同，且现在还补上了带结构化 manifest 的正式交付包导出能力；但首页面板中的表头文本、资产卡片局部文案与更多失败分支仍然主要依赖前端本地兜底。
- 当前 6 个业务页和首页总览页都已经至少把核心页面元信息或关键用户动作收口到了后端合同，首页 residual 的运行时缓存标签与最近实验记录表头、历史页页面级说明与表头语义也已继续后端化；但更多空状态提示、失败分支与其它页面局部语义仍然存在前端本地兜底。
- 当前工作目录没有检测到 Git 仓库元数据，后续变更追踪需要额外注意。
- 课程文档目录页码依赖本机 Microsoft Word 的 JXA 自动刷新；若后续在其他机器上重新生成，需要保留同等 Word 环境或再次手动更新目录。
- 当前后端仍不是完整训练产物服务；图像识别虽然已经改为真实图片内容分类，但当前模型是在运行时从课程样本训练的轻量 `scikit-learn` 分类器，还没有沉淀为独立模型文件或原实验深度学习权重。
- 本地浏览器联调时如果直接复用旧的 `:8000` 进程，可能会命中未热更新的旧后端版本；当前 `scripts/run_e2e_smoke.sh` 已具备更稳的自动选端口与非可恢复绑定错误快速失败逻辑，但手工开发仍需要注意这一点。
- 当前缓存产物虽然已经支持脚本预热和首页面板主动生成，但如果正式部署时没有执行 `warmup`/`e2e` 流程，首个业务请求仍可能承担一次初始化成本。
- 当前 API 类型虽然已经从后端 OpenAPI 自动生成，query 参数、query 默认值、导出格式、client 路径/method、历史页 query 序列化、导出响应元信息和错误响应 schema 也已改为消费 operation 级合同，但仍有少量前端专用组合类型与导出兜底策略保留在 `web/src/shared/api/types.ts` 与 `client.ts` 门面内。
- 顶栏“导出演示报告”虽然已经优先走后端实时导出，但当前导出格式仍是 JSON 快照；如果后续要用于正式课程交付，可能还需要继续扩展为更成体系的报告文件或压缩包产物。
- 顶栏全局搜索当前已经能统一搜索页面入口和历史记录，但结果排序仍以简单文本匹配为主；如果后续数据量继续增长，可能还需要更细的相关度排序或分类分组策略。
- 博物馆标签导出当前已升级为后端文本文件下载，但内容仍以标签列表为主；如果后续要继续提升交付感，可以再扩展成更完整的分析摘要或多格式导出。
- 文案生成页默认配置、图像识别页页面级语义、博物馆页页面级语义、情感分析页页面级语义和首页 residual 展示语义现在都已进一步接口化；如果继续收口一致性，更合适的下一站会是首页更多空状态提示、更多失败分支测试，或继续扩展 ZIP 交付包附件层级。
- AppShell 顶栏搜索区和 toolbar 残留语义现在也已接口化，且最新统一验收已经恢复为完整绿；更直接的下一条单一切片更适合转向 `text-generation` residual section titles 或 `sentiment-analysis` residual panel titles/status phrases，而不是继续在 shared shell 上扩散范围。

## Recommended Next Steps

1. 如果继续补单一切片，优先从 `text-generation` residual section titles 开始，把仍停留在前端本地的区块标题和提示语继续收口到 metadata 合同。
2. 如果下一条不做文案生成，再考虑 `sentiment-analysis` residual panel titles/status phrases，保持“一次只推进一个明确 feature”。
3. 如果继续补测试层次，优先沿现有 `Vitest + RTL` 基线为各页面补更多失败分支和权限/复制/导出等边界场景。
4. 如果继续推进接口工程化，可以在现有 OpenAPI 生成链路上继续补 typed operation helper、更细的错误策略或更严格的 contract diff，而不是回到手写同步。

## Session Log

### 2026-06-07

- 将 `multimodal-ai-course-platform/` 初始化为正式 Git 仓库，并补齐了项目级 `.gitignore`，把 `web/node_modules`、`web/dist`、`backend/.venv`、`backend/var`、`output/`、`.playwright-cli/`、实验原始压缩包目录以及 `experiment-01` 重复 `raw/` 原图排除在版本控制之外。
- 在 staged-file 进入首次提交前做了一轮体检，确认当前纳入版本控制的文件里没有任何单文件超过 `50MB`，避免首次推送被 GitHub 大文件限制拦截。
- 已在 GitHub 上创建私有远端仓库 `https://github.com/aCunese/multimodal-ai-course-platform` 并接线为本地 `origin`，为后续提交、回滚和协作提供正式版本控制基线。

### 2026-06-05

- 建立了项目级 harness 基线文件：
  - `AGENTS.md`
  - `feature_list.json`
  - `progress.md`
  - `session-handoff.md`
  - `init.sh`
- 将正式项目根目录由 `项目3/` 规范化为 `multimodal-ai-course-platform/`，并在工作区根目录补齐路由型 `AGENTS.md`。
- 将课程文档生成脚本迁入 `scripts/generate_course_documents.py`，消除了工作区根目录中的业务脚本散落问题。
- 运行 `./init.sh` 验证了当前项目基线，确认前端 lint/build 通过。
- 明确了当前里程碑：先稳住项目级工作流，再持续推进 `web/` 和后端脚手架建设。

### 2026-06-06

- 将用户提供的 5 张新素材替换到 `web/src/assets/` 中：
  - 首页 Hero 背景图
  - 平台品牌标识
  - 侧栏底部装饰插画
  - 首页两张统计卡插画
- 按用户本轮提供的新图片再次替换了首页 Hero 封面资源 `web/src/assets/hero/dashboard-hero.png`，保持首页横幅仍沿用原有背景图接线方式。
- 调整了 `web/src/styles/globals.css` 中首页统计卡和侧栏装饰图的展示方式，避免图片被压到卡片边角造成遮挡感。
- 在 `web/src/features/dashboard/page.tsx` 中为带插画的统计卡增加了显式样式钩子，便于控制有图卡片的布局。
- 重新执行 `./init.sh`，确认替换资源与样式调整后前端 lint/build 仍然通过。
- 重构了 `scripts/generate_course_documents.py` 的排版逻辑，按学院模板统一了课程报告和项目部署说明书的封面、目录、标题、正文与图片题注格式。
- 使用本机 Microsoft Word 的 JXA 自动化刷新了两个 `docx` 的目录字段，使目录项、标题层级和页码实际写回到文档中。
- 调整了课程报告中 `3.1.3`、`3.3`、`4.2` 三处章节顺序与模块命名，使需求分析、详细设计和实现说明一一对应。
- 初始化了 `backend/` 的 `FastAPI + Pydantic + SQLite` 服务基线，并实现首页摘要、历史记录、图像识别、情感分析、文案生成和博物馆图像理解接口。
- 在 `web/src/shared/api/` 中补齐 typed API client，并将首页、历史页与 4 个业务页接到真实后端请求。
- 更新了 `init.sh`，让项目统一验证入口同时覆盖前端 `lint/build` 和后端 `uv sync + pytest`。
- 在后端历史记录写入层修复了并发 ID 冲突问题，解决了 Playwright 端到端回归里触发的 `sentiment-analysis` 500 错误。
- 使用 Playwright 实际验证了“情感分析 -> 历史记录检索”和“文案生成 -> 生成历史增长”两条联调闭环。
- 将 `experiment-02-text-analysis-generation/datasets/poetry.txt` 接入后端文案生成逻辑，`文艺` 风格与 `诗意表达` 类型现在会优先引用真实课程诗词语料而不是只靠模板拼接。
- 将 `experiment-02-text-analysis-generation/datasets/imdb.npz` 与 `imdb_word_index.json` 接入后端情感分析逻辑，当前会基于 IMDb 训练集词统计构建缓存词典，再叠加少量人工覆盖词修正展示语义。
- 修正了情感分析结果组装中的关键词回退问题，避免正面样例页面仍展示无关的默认消极词。
- 再次使用 Playwright 验证了情感分析页的默认正面样例、负面样例提交和历史页关键字检索闭环。
- 为博物馆模块补上了真实图片载荷：前端现在会把上传文件转成 data URL 发送给后端，后端会读取图片内容并与 `experiment-03` 下的博物馆图像数据集做相似度检索。
- 在 `backend/tests/test_api.py` 中新增了基于 `smithsonian_786.jpg` 的真实上传回归测试，确保博物馆模块能够命中 `Smithsonian Institution`。
- 使用 Playwright 实际上传本地 `smithsonian_786.jpg`，确认页面结果、说明文案和历史记录都已接入真实数据集比对链路。
- 继续收紧了课程文档版式：为正文页添加了“多模态 AI 课程成果平台”页眉，将一级/二级标题样式补成 0.78 厘米悬挂缩进，并把图片段落从固定 20 磅正文行高中拆开，避免插图显示受段落行高影响。
- 将 `experiment-01-herbal-image-classification/archives/data.rar` 解包到项目内数据目录，并在后端加入基于颜色直方图、HSV 分布和 HOG-like 纹理特征的轻量中药分类器。
- 图像识别前端现在会把真实上传图片转成 data URL 发送给后端，默认示例也切换为课程中药样本 `dangshen_1.jpg`。
- 在 `backend/tests/test_api.py` 中新增了中药真实上传分类回归和历史记录 `CSV/JSON` 导出回归，随后又补上了跨域导出头暴露回归，当前 API 测试总数已增至 13 条。
- 使用 Playwright 实际上传本地 `huaihua_1.jpg`，确认页面结果会更新为 `槐花 / Huaihua`，并在历史页写入新记录。
- 历史页新增导出格式选择，当前会优先调用后端 `GET /api/v1/history/export` 导出 `JSON / CSV`，接口不可用时再回退到当前页数据导出。
- 浏览器回归期间定位到一次真实联调问题：前端曾连到陈旧的 `127.0.0.1:8000` 后端进程而导致新导出接口 `404`，随后在 `127.0.0.1:8001 + 5177` 组合上复验通过。
- 在 `web/` 中新增 `playwright` 依赖与 `npm run e2e:smoke` 脚本，并在项目根目录新增 `scripts/run_e2e_smoke.sh` 统一拉起临时前后端服务。
- `scripts/run_e2e_smoke.sh` 现在会自动选择空闲端口、准备 Playwright 浏览器运行时、执行真实浏览器主路径并把日志与截图落到 `output/playwright/`。
- 在后端 CORS 中显式暴露 `Content-Disposition` 响应头，并新增回归测试，保证跨域直连场景下历史导出仍能拿到真实文件名。
- 通过真实脚本验证了“图像识别 / 情感分析 / 文案生成 / 博物馆上传 / 历史导出”五条主链路已经可以在一条命令中完成回归。
- 为中药分类器补上了磁盘缓存层：后端会根据数据集指纹复用已落盘的 `herbal-classifier.pkl`，测试也已证明缓存命中时不会再次调用训练函数。
- 为博物馆特征索引补上了磁盘缓存层：后端会根据数据集指纹复用已落盘的 `museum-feature-index.pkl`，测试也已证明缓存命中时不会再次重建全量特征索引。
- 新增了 `GET /api/v1/runtime-assets` 与 `POST /api/v1/runtime-assets/warmup`，首页总览会展示运行时缓存状态，并支持直接触发预热。
- 新增了 `backend/scripts/warm_runtime_assets.py` 和 `init.sh warmup/e2e` 模式，当前可以在不依赖首个业务请求的情况下主动生成缓存，并把完整验收收敛到单一入口。
- 为前端新增了 `Vitest + React Testing Library + jsdom` 组件测试基线，`web/src/features/dashboard/page.test.tsx` 与 `web/src/features/history/page.test.tsx` 已覆盖首页预热面板和导出兜底逻辑。
- `init.sh` 默认验证链路现在已经纳入 `npm run test`，不再只靠 lint、build、API 测试和 smoke 兜底前端质量。
- 为前端新增了测试依赖与 `web/src/test/setup.ts`，并同步更新 `package-lock.json`，使组件测试可以在当前工程里直接复现。
- 继续沿组件测试基线补上了 `web/src/features/sentiment-analysis/page.test.tsx` 与 `web/src/features/text-generation/page.test.tsx`，当前文本模块的关键前端状态切换已经有独立回归锚点。
- 继续沿组件测试基线补上了 `web/src/features/image-recognition/page.test.tsx` 与 `web/src/features/museum-vision/page.test.tsx`，当前图像模块的关键前端状态切换也已有独立回归锚点。
- 后端测试客户端已从旧的 `starlette.testclient` 路径切到 `httpx.AsyncClient + ASGITransport`，并补上 FastAPI lifespan 上下文，避免测试使用临时数据库时漏掉 `init_db()` 建表初始化。
- 前端测试依赖已刷新到当前 `vitest` 安全版本区间，`npm audit --json` 现为 0 漏洞；随后再次执行 `./init.sh e2e`，确认完整验收链路依旧通过。
- 图片上传异常链路已补齐明确错误合同：`backend/app/api/routes.py` 为两个图片接口声明了 `400` 错误响应，`backend/app/services/core.py` 会拒绝无效图片载荷，前端两个图片页会把后端错误信息直接展示出来，而不是静默保留“伪成功”结果。
- Playwright 烟雾脚本现在也把图像识别页的无效上传反馈纳入真实浏览器回归，避免这条失败链路只在 API/组件层被验证。
- 历史导出失败回退现在也已经提升到 Playwright 浏览器级覆盖，不再只依赖组件测试验证下载兜底逻辑。
- `web/src/test/setup.ts` 已补上全局 `afterEach(cleanup)`，修正了组件测试之间残留 DOM 导致同名“开始生成”按钮被误判为重复元素的问题。
- `web/scripts/e2e-smoke.mjs` 已继续提升真实浏览器失败链路覆盖，当前会验证文案生成请求失败后页面仍保留最近一次成功生成结果。
- 后端已新增 `GET /api/v1/history/metadata`，历史页现在会从接口读取模块筛选项、状态筛选项、导出格式、项目说明与模块导览，不再长期把这些元信息散落在前端硬编码中。
- `backend/app/schemas/__init__.py` 已新增 `HistoryExportFilters` 与 `HistoryExportResponse`，`GET /api/v1/history/export` 现在会在 OpenAPI 中同时声明 JSON 导出 schema、CSV binary content 和 `Content-Disposition` 文件名头。
- `backend/scripts/sync_api_contracts.py` 现已继续输出 operation 级响应元信息：`successStatus`、`responseContentTypes` 与 `responseHeaderKeys`；因此 `export_history_api_v1_history_export_get.responseBody` 已从 `unknown` 收紧为 `HistoryExportResponse`。
- `web/src/shared/api/client.ts` 已新增通用 `requestDownloadOperation()`，历史导出下载逻辑改为消费生成出来的响应头元信息；`web/src/shared/api/client.test.ts` 也已补齐文件名头优先级与回退文件名回归。
- 重新执行 `uv run pytest -q tests/test_api.py -k history_export`、`npm run test -- src/shared/api/client.test.ts`、`uv run python scripts/sync_api_contracts.py --check` 与 `./init.sh e2e` 后全部通过；当前前端组件测试为 `12 passed`，后端 API 测试为 `21 passed`。
- `backend/scripts/sync_api_contracts.py` 现已继续输出 `queryDefaults`，`web/src/shared/api/generated-contract.ts` 会把历史查询与导出接口的默认 query 参数直接落到运行时合同。
- `web/src/features/history/page.tsx` 当前已改为从生成合同读取默认模块、默认状态和默认导出格式；`web/src/shared/api/generated-contract.test.ts` 也已补齐回归，避免默认值再次悄悄回退到前端手写常量。
- 重新执行 `npm run test -- src/shared/api/generated-contract.test.ts`、`npm run test -- src/features/history/page.test.tsx`、`npm run build` 与 `./init.sh e2e` 后全部通过；当前前端组件测试为 `13 passed`，后端 API 测试保持 `21 passed`。
- `backend/scripts/sync_api_contracts.py` 现已继续输出 `errorResponses / errorResponseSchemas`，`web/src/shared/api/generated-contract.ts` 会把接口级 `400/422` 错误 schema 名直接落到运行时合同。
- `web/src/shared/api/client.ts` 当前已改为按 operation 合同解析错误消息：`ApiErrorResponse` 读取字符串 `detail`，`HTTPValidationError` 则优先展示第一条校验 `msg`；相关回归已补到 `web/src/shared/api/client.test.ts` 与 `web/src/shared/api/generated-contract.test.ts`。
- 重新执行 `npm run test -- src/shared/api/generated-contract.test.ts src/shared/api/client.test.ts`、`npm run build` 与 `./init.sh e2e` 后全部通过；当前前端组件测试为 `15 passed`，后端 API 测试保持 `21 passed`。
