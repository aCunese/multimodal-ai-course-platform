# Session Handoff

Last updated: 2026-06-07

## Resume Checklist

1. 进入项目目录：`cd multimodal-ai-course-platform`
2. 阅读：`AGENTS.md`
3. 阅读：`feature_list.json`、`progress.md`
4. 运行：`./init.sh`
5. 只选择一个 feature 继续推进

## Current Focus

- 项目根 `multimodal-ai-course-platform/` 现已初始化为正式 Git 仓库，并已接入 GitHub 私有远端 `origin`：`https://github.com/aCunese/multimodal-ai-course-platform`。
- 项目级 `.gitignore` 已明确排除本地构建产物、运行时缓存、调试输出、实验原始压缩包，以及 `experiment-01` 与 `dataset/` 重复的 `raw/` 原图目录；后续默认只围绕受控源码、文档与实际运行依赖数据推进。
- 文本模块本轮已补回共享 fallback helper 的真实接线：`web/src/features/sentiment-analysis/page.tsx` 现在会在分析失败时按当前输入生成本地情感判断，并同时展示命中的原词与中文语义；`web/src/features/text-generation/page.tsx` 现在会在生成失败时按当前配置生成新的本地兜底文案，而不是只停留在顶部提示。
- 最新统一验收已重新通过：`cd web && npm run test` 为 `9 passed files / 38 passed tests`，项目根目录 `./init.sh` 通过，后端 `pytest` 为 `50 passed`。
- `feat-046 DeepSeek 可观测化、情感分析 provider 接入与共享顶栏整理` 已完成：6 个页面默认首屏 success 胶囊提示已经统一收口；`text-generation` 与 `sentiment-analysis` 都已补齐 provider 可观测状态；`sentiment-analysis` 现已升级为 `MULTIMODAL_SENTIMENT_PROVIDER=local|deepseek` 的 DeepSeek 主分析 + 本地词典回退；`AppShell` 顶栏桌面端布局与图片页/博物馆页反馈状态也已整理完成。
- `feat-044 DeepSeek 文案生成接入` 保持完成态：`text-generation` 当前可通过 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek`、`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` 与 `DEEPSEEK_TIMEOUT_SECONDS` 启用远程大模型生成；远程不可用时继续自动回退到本地模板与诗词语料逻辑。
- 最新统一验收已经确认恢复到完整绿：`cd web && npm run test` 为 `9 passed files / 36 passed tests`，`cd backend && uv run pytest -q` 为 `50 passed`，项目根 `./init.sh` 与 `./init.sh e2e` 均通过。
- `web/scripts/e2e-smoke.mjs` 已按当前中文展示结果完成断言更新：图像识别改为 `党参 / 槐花`，情感分析与搜索建议改为 `负面判断 / 负面`，博物馆馆名与标签导出改为 `史密森学会`。
- 当前继续往下做时，不需要再重复大范围联调排查；更合适的下一条单一切片是继续深化文本模块质量，例如补情感分析 DeepSeek explanation 质量回归，或继续细化文案生成的分类型风格词典。
- 课程提交文档已经形成可重复生成链路；如果还要继续润色报告或部署说明书，优先修改 `scripts/generate_course_documents.py` 后再统一重生成。
- 当前课程文档生成链路已经显式补齐 `default + first-page` 两套页眉页脚；如果后续还要微调页眉位置，优先继续在 `scripts/generate_course_documents.py` 中调整无边框双列表格锚点，而不是手工在 Word 中逐页拖动。
- 项目内现已补齐 `docs/course-materials/templates/` 模板归档；后续若继续修改课程报告或部署说明书，直接以项目内模板与 `generated-output/` 产物为准，不再以工作区外层的散落 Word 文件作为正式来源。

## What Changed In This Session

- 将 canonical project root 初始化为正式 Git 仓库，补齐了项目级 `.gitignore`，明确排除了 `web/node_modules`、`web/dist`、`backend/.venv`、`backend/var`、`output/`、`.playwright-cli/`、实验原始压缩包目录，以及 `experiment-01` 与 `dataset/` 重复的 `raw/` 原图目录。
- 在首次提交前做了一轮 staged-file 审计，确认当前纳入版本控制的文件里没有任何单文件超过 `50MB`，避免首次推送被 GitHub 大文件限制拦截。
- 已在 GitHub 上创建私有远端仓库 `https://github.com/aCunese/multimodal-ai-course-platform` 并接线为本地 `origin`，后续可以直接在项目根目录继续做正常的 commit / push / branch 管理。
- 新增 `web/src/shared/fallbacks/local-text-tools.ts` 并把它接到 `web/src/features/sentiment-analysis/page.tsx` 与 `web/src/features/text-generation/page.tsx`：当前两个文本页在对应后端接口失败时，会直接基于当前输入执行本地兜底分析/生成，而不是只保留旧演示结果。
- `web/src/features/sentiment-analysis/page.test.tsx` 与 `web/src/features/text-generation/page.test.tsx` 已补上离线兜底回归；当前 `cd web && npm run test` 为 `9 passed files / 38 passed tests`。
- 又做了一轮浏览器级断网 spot-check：主动中断 `http://127.0.0.1:5173/sentiment-analysis` 与 `/text-generation` 的对应 API 请求后，两页仍可按当前输入刷新结果区。
- 新增并完成 `feat-046`：统一清理了首页、图像识别、情感分析、文案生成、博物馆图像理解、历史页的默认首屏 success 胶囊提示，页面现在只会在加载中、失败/回退或显式操作成功时展示顶部反馈。
- 扩展了后端 provider 合同：`backend/app/schemas/__init__.py`、`backend/app/services/llm_provider.py`、`backend/app/services/core.py` 现已为文案生成与情感分析统一提供 `providerStatus / providerUsed / usedFallback / providerStatusMessage`，前端不再靠固定提示文案猜测 DeepSeek 是否真的生效。
- `sentiment-analysis` 已升级为独立 provider 开关：新增 `MULTIMODAL_SENTIMENT_PROVIDER=local|deepseek` 路径，优先走 DeepSeek 结构化 JSON 分析，失败时回退到本地 IMDb 词典，并顺手收紧了本地保底词表里的误判高频词。
- `web/src/shared/layout/AppShell.tsx` 与 `web/src/styles/globals.css` 本轮继续做了桌面端顶栏整理：标题摘要区、搜索区、按钮区和账号卡片的对齐更紧凑，首页和内页顶部留白明显收敛。
- `web/src/features/image-recognition/page.tsx` 与 `web/src/features/museum-vision/page.tsx` 的 success/error 反馈状态已再次收口，不再因为额外 success 标志位让错误提示被覆盖。
- 本轮把前端旧测试与 smoke 断言全部跟新 UX 和中文展示对齐：`dashboard/history/image-recognition/museum-vision/text-generation/sentiment-analysis/AppShell` 相关组件测试全部恢复为绿色，同时 `web/scripts/e2e-smoke.mjs` 也更新了图像、情感、搜索和博物馆导出链路的中文断言。
- 最新全量验收结果已重新确认：`cd web && npm run test` 为 `9 passed files / 36 passed tests`，`cd backend && uv run pytest -q` 为 `50 passed`，项目根 `./init.sh` 与 `./init.sh e2e` 均通过。
- 调整了 `web/src/shared/layout/AppShell.tsx` 与 `web/src/styles/globals.css` 的顶栏布局，让长页面标题在桌面宽度下优先保持单行；同时保留移动端回退为正常换行，避免小屏溢出。
- 在 `web/src/features/history/page.tsx` 中新增了历史记录分页，当前固定 `8` 条一页，并把页码控件收敛为首尾页 + 当前邻近页 + 省略号的紧凑布局，避免真实数据量较大时分页按钮把页面继续向下撑长。
- 在 `web/src/features/history/page.test.tsx` 中补了一条分页回归，并分别用 `npm run test`、`./init.sh` 与 Playwright 页面截图验证了 museum/history 两页的视觉结果。
- 在 `web/src/features/text-generation/page.tsx` 中为“历史生成记录”新增了本地分页，当前固定 `8` 条一页，并复用历史页同款的紧凑分页条，避免文案历史表格无限拉长。
- 在 `web/src/features/text-generation/page.test.tsx` 中补了一条分页回归；本轮定向验证结果为 `npm run test -- src/features/text-generation/page.test.tsx` `3 passed`、`npm run lint` 通过。
- 本轮 fresh 执行 `./init.sh` 时发现当前前端组件测试基线并非全绿：`dashboard/page.test.tsx` 2 条失败、`history/page.test.tsx` 1 条失败、`image-recognition/page.test.tsx` 2 条失败、`museum-vision/page.test.tsx` 3 条失败；这些失败与本次文案分页改动无直接关系，因此未在同一切片里顺手扩修，只把现状记录下来供下一轮单独处理。
- 新增 `scripts/send_mail_via_mail_app.py`，通过 AppleScript 调用本机 macOS `Mail` 发纯文本邮件；脚本默认复用 `QQ` 账户与 `946265043@qq.com` 发送身份，并支持 `stdin` 正文输入与 `--dry-run` 干运行。
- 通过 AppleScript 只读确认了本机 `Mail` 配置：已存在 `QQ` 账户，邮箱地址为 `946265043@qq.com`，IMAP 为 `imap.qq.com:993`，SMTP 为 `smtp.qq.com:587`。
- 重新创建了 Codex app 自动化：删除了原先只在当前线程提醒的 heartbeat 版 `每日 AI 动态速递`，改为本地 cron 版 `每日 AI 邮件速递`，每天 `09:00` 在项目根目录 fresh run，整理 AI 动态后调用新脚本发送到 `946265043@qq.com`。
- 对新邮件脚本完成了定向验证：`--dry-run` 通过、`python3 -m py_compile` 通过、内嵌 Mail AppleScript 也已通过 `osacompile` 语法编译；本轮未主动发送真实测试邮件，避免在未额外确认的情况下触发即时邮件。
- 按用户提供的桌面 Word 交付稿重新核对了课程报告与部署说明书的内容一致性：修正了部署说明书里残留的 `Node 22.x` 说法，并在实验报告中补进了 `图4.6 博物馆图像识别模块运行效果图`。
- 同步更新 `scripts/generate_course_documents.py` 并重新执行 `python scripts/generate_course_documents.py`，让项目内 `generated-output/` 产物也继承这轮文档修正，避免后续重生成把改动回退。
- 建立了项目级 harness 基线，补齐 instructions、state、verification、scope、lifecycle 五个子系统的最小可用版本。
- 将临时目录名 `项目3/` 收束为正式项目根 `multimodal-ai-course-platform/`，并在工作区根目录补齐路由型入口文件。
- 将课程文档生成脚本收回到 `scripts/`，并同步更新了脚本中的项目路径与输出目录。
- 为后续会话固定了启动流程、验证入口、feature 状态文件和进度记录方式。
- 实际运行了 `./init.sh`，确认 `web` 当前 lint/build 均可通过。
- 本轮按“只基于 fresh 输出给结论”的口径重新执行了 `./init.sh`、`./scripts/run_e2e_smoke.sh` 与 `./init.sh e2e`，结果均为完整绿：前端组件测试 `33 passed`、后端 API 测试 `41 passed`、运行时缓存预热通过、Playwright smoke 通过。
- 本轮已真实接入 DeepSeek 文案生成：新增 `backend/app/services/llm_provider.py` provider 层、`backend/app/services/core.py::generate_text` provider-aware 回退逻辑，并把 `httpx` 从 backend 开发依赖提升为运行时依赖。
- 围绕 DeepSeek 接入新增了 3 条 API 回归：远程 provider 成功、远程异常回退、本地缺失密钥回退；在 `backend/` 内执行定向 pytest 为 `3 passed`。
- 本轮还做了一次显式远程 smoke：设置 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek`、`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL=https://api.deepseek.com` 与 `DEEPSEEK_MODEL=deepseek-chat` 后调用 `generate_text(...)`，控制台输出 `provider= deepseek`、`enabled= True`，并成功返回 2 条 DeepSeek 结果。
- DeepSeek 接入后再次执行 `./init.sh e2e` 通过，当前最新整体验收基线为：前端组件测试 `33 passed`、后端 API 测试 `44 passed`、运行时缓存预热通过、Playwright smoke 通过。
- 本轮又做了一次面向展示层的中文化优化：新增 `web/src/shared/copy/display.ts`，把残留在后端或 mock 数据中的英文 / 拼音结果统一格式化为中文；同时后端默认 metadata 与历史输出也改成了中文语义。
- 围绕这轮中文化优化执行了定向验收：`web/` 内相关 5 个测试文件共 `14 passed`，`backend/` 内相关接口用例 `10 passed`，随后项目根目录再次执行 `./init.sh` 通过，基线更新为前端组件测试 `34 passed`、后端测试 `46 passed`。
- 本轮还用 `playwright-cli` 做了人工抽检：首页可正常拉取 `dashboard/runtime-assets/app-shell metadata`，顶栏输入 `flop` 后能展示搜索建议，点击历史记录建议后会跳转到带筛选参数的历史页；首页控制台 warning/error 均为 `0`。
- 首页与共享壳层所用的 5 张核心视觉素材已经替换为新的用户提供版本，覆盖了 Hero 背景、品牌标识、侧栏装饰图和两张统计卡插画。
- `web/src/styles/globals.css` 已调整侧栏装饰图和首页统计卡插画的展示方式，减少图片被裁切或遮挡的问题。
- 本次替换完成后已重新运行 `./init.sh`，确认当前修改没有破坏前端 lint/build 基线。
- 课程报告与项目部署说明书已经按四川大学锦江学院模板重新生成，目录页、三级目录限制、20 磅固定行距和 5 号黑体图片题注都已落盘。
- 报告文档中的 `3.1.3`、`3.3`、`4.2` 已改为前后对应的模块顺序，并通过 Microsoft Word 的 JXA 自动化刷新了目录页码。
- `backend/` 已完成 `FastAPI + Pydantic + SQLite` 脚手架，并新增首页摘要、历史记录、图像识别、情感分析、文案生成、博物馆图像理解接口。
- `web/src/shared/api/` 已新增 typed API client，首页、历史页与 4 个业务页都已经从前端本地逻辑切换到真实后端请求。
- `init.sh` 已升级为完整验证入口，运行时会同时覆盖前端 `lint/build` 与后端 `uv sync + pytest`。
- Playwright 已验证情感分析和文案生成两条关键链路可以把结果写回历史记录；同时修复了联调过程中暴露出的 SQLite 历史 ID 并发冲突问题。
- `backend/app/services/core.py` 已开始接入真实课程文本数据，文案生成模块会读取 `experiment-02` 下的 `poetry.txt` 生成更贴近课程语料的文艺型输出。
- `backend/app/services/core.py` 已继续接入 `experiment-02` 的 IMDb 数据集，情感分析现在会基于 `imdb.npz + imdb_word_index.json` 构建缓存词典，而不是只靠手写规则词表。
- 情感分析结果组装逻辑已经修正，不再把未命中的默认消极词展示到正面样例页面里。
- Playwright 已再次验证“默认正面样例自动分析”“flop 负面样例提交”“历史页关键字检索 flop”三条浏览器级链路。
- `backend/app/schemas/__init__.py` 已新增 `AppShellMetadataResponse`，`backend/app/services/core.py::get_app_shell_metadata()` 与 `backend/app/api/routes.py::GET /api/v1/app-shell/metadata` 已落盘，专门承接 AppShell 残留前端本地语义。
- `backend/scripts/sync_api_contracts.py` 已再次同步合同，`docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts` 都已包含 `app_shell_metadata_api_v1_app_shell_metadata_get`。
- `web/src/shared/api/client.ts::getAppShellMetadata` 与 `web/src/shared/layout/AppShell.tsx` 已接线：壳层挂载后会优先拉取 metadata，并用它驱动搜索区 copy、toolbar copy、账号 pill copy 以及演示报告 fallback title/filename。
- 围绕 `feat-043` 的回归已经补齐并通过：`backend/tests/test_api.py -k app_shell_metadata` 为 `2 passed`，`npm run test -- src/shared/layout/AppShell.test.tsx src/shared/api/client.test.ts` 为 `19 passed`。
- 本轮还重新做了一次真实浏览器确认：在首页输入 `ghost` 会显示空结果提示；输入 `flop` 会显示页面入口和历史记录建议；点击历史记录建议后能跳到 `/history?...`；网络请求中确认命中了 `GET /api/v1/app-shell/metadata` 与 `GET /api/v1/search?...`。
- 本轮最后又重新执行 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e`，完整通过并把全量基线更新为前端组件测试 `33 passed`、后端 API 测试 `41 passed`、Playwright smoke 通过。
- `museum-vision` 前端现在会把本地上传文件转成 data URL 发给后端，`backend/app/services/core.py` 会读取图片内容并与 `experiment-03` 博物馆图像数据集做相似度检索。
- 后端测试已新增真实馆藏图片上传回归，`smithsonian_786.jpg` 会命中 `Smithsonian Institution`。
- Playwright 已验证博物馆页面上传本地 `smithsonian_786.jpg` 后，会显示真实数据集比对说明，并在历史页写入新记录。
- `experiment-01-herbal-image-classification/archives/data.rar` 已经解包，`backend/app/services/core.py` 会基于课程中药样本训练轻量分类器，并按上传图片内容返回 5 类中药材概率。
- `image-recognition` 前端现在会把上传图片转成 data URL 发送给后端，默认样例也切换为课程样本 `dangshen_1.jpg`。
- 后端测试已新增中药真实上传回归，`dangshen_1.jpg` 会命中 `党参 / Dangshen`；Playwright 已验证上传 `huaihua_1.jpg` 后页面显示 `槐花 / Huaihua`，历史页同步写入新记录。
- 历史页新增导出格式选择，前端会优先调用后端 `GET /api/v1/history/export` 导出 `JSON / CSV`；Playwright 已验证 `CSV` 下载成功。
- 浏览器联调时曾发现 `5176` 前端连接到了陈旧的 `:8000` 后端实例，导致新导出接口 `404`；该问题已通过切换到当前 `127.0.0.1:8001` 后端和 `127.0.0.1:5177` 前端确认根因与修复路径。
- `web/package.json` 已新增 `npm run e2e:smoke`，项目根目录也已新增 `scripts/run_e2e_smoke.sh`，会自动准备 Playwright 浏览器、选择空闲端口并拉起临时前后端。
- `scripts/run_e2e_smoke.sh` 的端口探测现已抽成 `scripts/find_free_port.mjs`，并补上 `scripts/find_free_port.test.mjs`；当前只会在 `EADDRINUSE` 时继续尝试下一个端口，若遇到 `EPERM` 这类非可恢复本地绑定错误，会直接给出清晰失败原因，不再递归撞到 `65536`。
- `web/scripts/e2e-smoke.mjs` 当前会真实回归“首页预热、中药上传分类、负面情感分析、文案生成写历史、博物馆上传、历史 CSV 导出”六条主链路。
- 后端 CORS 已显式暴露 `Content-Disposition`，确保 `VITE_API_BASE_URL` 指向独立后端端口时，历史导出仍能拿到真实文件名。
- 中药分类器现在会把训练产物默认缓存到 `backend/var/herbal-classifier.pkl`；`backend/tests/test_api.py` 已验证清空进程内缓存后仍可直接复用磁盘模型，不会再次触发训练函数。
- 博物馆特征索引现在也会把特征产物默认缓存到 `backend/var/museum-feature-index.pkl`；`backend/tests/test_api.py` 已验证清空进程内缓存后仍可直接复用磁盘索引，不会再次重建全量特征。
- 课程文档生成脚本继续补了一轮版式修正：正文页已增加“多模态 AI 课程成果平台”页眉，一级/二级标题样式带 0.78 厘米悬挂缩进，图片段落不再沿用正文固定 20 磅行高。
- 课程文档生成脚本已继续对齐当前真实项目状态：课程报告现已覆盖前端、后端、课程数据、运行时缓存、OpenAPI 合同与交付导出链路，项目部署说明书也已改为覆盖前后端启动、缓存预热、合同校验与 `./init.sh e2e` 验收的完整流程。
- 课程文档页脚页码拼接错误也已修复：`scripts/generate_course_documents.py` 现在会在 Word 刷新字段后再定点清理 footer XML 中残留的字面量 `1 页`，避免生成文档出现 `31 页` 这类错误页码显示。
- 课程文档首页页眉与首页页码也已进一步修复：脚本现在会同时写入首页和默认页的页眉/页脚，并把页眉改成无边框双列表格，确保左侧文档名贴左、右侧“多模态AI课程成果平台”贴右；两份文档已在 Microsoft Word 首页实开确认。
- 后端新增了 `GET /api/v1/runtime-assets` 与 `POST /api/v1/runtime-assets/warmup`，首页总览现在会展示运行时缓存状态，并支持直接触发预热。
- `backend/scripts/warm_runtime_assets.py` 已落地，`uv run python scripts/warm_runtime_assets.py` 可在不依赖首个业务请求的情况下主动生成缓存。
- `init.sh` 现在支持 `warmup` 与 `e2e` 模式，其中 `./init.sh e2e` 已验证可串行跑通前后端检查、缓存预热和浏览器烟雾回归。
- `web/` 已新增 `Vitest + React Testing Library + jsdom` 组件测试基线，`npm run test` 当前会验证首页运行时预热面板和历史页导出兜底逻辑。
- `init.sh` 的默认 full 流程现在也会执行前端 `npm run test`，因此统一入口已覆盖 `lint + component tests + build + backend pytest + warmup/e2e` 的完整组合。
- `web/src/features/sentiment-analysis/page.test.tsx` 与 `web/src/features/text-generation/page.test.tsx` 已新增，当前文本模块的默认加载、后端结果映射、关键词过滤与示例恢复也纳入了组件级回归。
- `web/src/features/image-recognition/page.test.tsx` 与 `web/src/features/museum-vision/page.test.tsx` 已新增，当前图像模块的样例加载、本地上传触发与样例切换也纳入了组件级回归。
- `backend/tests/test_api.py` 已改为在 `httpx.AsyncClient + ASGITransport` 外层显式包裹 FastAPI lifespan，上下文现在会在每次测试客户端创建时执行 `init_db()`，因此临时数据库路径下也能稳定建表。
- 前端依赖审计已经清零，`web/` 下执行 `npm audit --json` 当前返回 0 漏洞；随后重新执行 `./init.sh e2e`，确认整条前后端验收链路没有被依赖升级或测试客户端迁移破坏。
- 两个图片接口的上传合同已经收紧：无效 `imageDataUrl` 不再静默回退到默认演示结果，后端现在会返回明确 `400` 错误，前端图片页也会把错误文案直接显示给用户。
- 当前组件测试总数已增至 8 条，新增覆盖图像识别页与博物馆页在“上传无效图片”时展示后端错误提示的回归场景。
- `web/scripts/e2e-smoke.mjs` 现在也会在真实浏览器里验证图像识别页的无效上传反馈，并确认错误出现后页面仍保留最近一次成功识别结果。
- `web/scripts/e2e-smoke.mjs` 现在还会主动中断历史导出请求，验证历史页会回退到本地 CSV 下载，并显示“历史记录导出接口暂时不可用，已导出当前页面数据。”
- `web/src/test/setup.ts` 现在已补上全局 `afterEach(cleanup)`，避免组件测试之间残留 DOM 导致同名按钮、输入框等选择器误命中。
- `web/src/features/text-generation/page.test.tsx` 已新增并重新验证“文案生成接口失败后保留最近一次成功结果”的组件级回归，`web/scripts/e2e-smoke.mjs` 也已同步提升到真实浏览器失败场景覆盖。
- 后端已新增 `GET /api/v1/history/metadata`，把历史页仍残留在前端的模块筛选项、状态筛选项、导出格式、项目说明与模块导览统一收口到接口合同。
- `web/src/features/history/page.tsx` 现已消费 `getHistoryMetadata()`；当元信息接口不可用时，页面仍会保留本地兜底内容，不会影响历史记录主链路。
- 本轮完整验收已再次通过：`./init.sh e2e` 当前结果为前端组件测试 `10 passed`、后端 API 测试 `20 passed`，并继续覆盖运行时预热与 Playwright 烟雾回归。
- 后端已新增 `backend/scripts/sync_api_contracts.py`，会从 FastAPI OpenAPI 自动生成 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`，避免继续手写维护整份前端 API 类型。
- `web/src/shared/api/types.ts` 现已退化为轻量门面：大部分响应/请求类型来自生成文件，只有 `HistoryQuery` 与 `HistoryExportFormat` 这类前端额外组合类型仍保留手写。
- `backend/app/schemas/__init__.py` 已把 `ModuleCard.icon` 与 `MetricCard.icon` 收紧到字面量联合，确保生成出的前端合同不会把图标字段放宽成普通 `string`。
- `init.sh` 现在会在后端 `uv sync` 之后自动执行 `uv run python scripts/sync_api_contracts.py --check`，如果后端 schema、OpenAPI 快照或前端生成类型不同步，会在统一验收入口里直接失败。
- 本轮在把合同校验接入 `init.sh` 时还修掉了一处真实生成边界：空对象 schema 现在会生成 `Record<string, unknown>`，不再触发前端 ESLint 的 `no-empty-object-type`。
- 生成器现在还会输出 `BackendApiOperationMap`，把每个 operation 的 `method / path / query / pathParams / requestBody / responseBody` 一并落到 `web/src/shared/api/generated-contract.ts`。
- `web/src/shared/api/types.ts` 里的 `HistoryQuery` 与 `HistoryExportFormat` 已不再手写，而是直接从 `history_api_v1_history_get.query` 与 `export_history_api_v1_history_export_get.query.format` 推导。
- 新的 operation 级合同映射也已经过完整验收：`./init.sh e2e` 继续通过，前端组件测试 `10 passed`、后端 API 测试 `20 passed`、缓存预热和 Playwright 烟雾回归均未被破坏。
- 生成器现在还会输出运行时常量 `backendApiOperations`，`web/src/shared/api/client.ts` 已改为通过 `getOperationPath()` / `requestOperation()` 消费这份元信息，不再手写各接口的路径和 method。
- 当前 `getDashboardSummary`、`getRuntimeAssets`、`warmRuntimeAssets`、`getHistoryMetadata`、`classifyImage`、`analyzeSentiment`、`generateText`、`getGenerationHistory`、`analyzeMuseumVision` 等调用都已经切到运行时合同；历史查询与导出则会在 operation path 上继续拼接 query string。
- `backendApiOperations` 现在还会生成 `queryKeys`，`web/src/shared/api/client.ts` 已新增 `buildOperationUrl()`，会按 operation 合同统一序列化 query 参数。
- 原先历史页专用的 `buildHistorySearchParams()` 已删除，历史记录查询与导出都改成走 operation-aware URL 组装逻辑。
- `backend/app/schemas/__init__.py` 已新增 `HistoryExportFilters` 与 `HistoryExportResponse`，`GET /api/v1/history/export` 的 OpenAPI 现在会同时声明 JSON 导出 schema、CSV binary content 和 `Content-Disposition` 下载头。
- `backend/scripts/sync_api_contracts.py` 现已继续生成 `successStatus / responseContentTypes / responseHeaderKeys`；`web/src/shared/api/client.ts` 也新增了通用 `requestDownloadOperation()`，历史导出下载逻辑已切到消费这层响应元信息。
- 本轮完整验收已再次通过：`uv run pytest -q tests/test_api.py -k history_export` 为 `4 passed`，`npm run test -- src/shared/api/client.test.ts` 为 `2 passed`，`./init.sh e2e` 结果已更新为前端组件测试 `12 passed`、后端 API 测试 `21 passed`，并继续覆盖缓存预热与 Playwright 烟雾回归。
- `backend/scripts/sync_api_contracts.py` 现已继续生成 `queryDefaults`，`web/src/shared/api/generated-contract.ts` 会把历史查询与导出接口的默认 query 参数直接落到运行时合同。
- `web/src/features/history/page.tsx` 当前已改为从生成合同读取默认模块、默认状态和默认导出格式；`web/src/shared/api/generated-contract.test.ts` 也已补齐回归，避免默认值再次漂回前端手写常量。
- 本轮完整验收已再次通过：`npm run test -- src/shared/api/generated-contract.test.ts` 为 `1 passed`，`npm run test -- src/features/history/page.test.tsx` 为 `2 passed`，`./init.sh e2e` 结果已更新为前端组件测试 `13 passed`、后端 API 测试 `21 passed`，并继续覆盖缓存预热与 Playwright 烟雾回归。
- `backend/scripts/sync_api_contracts.py` 现已继续生成 `errorResponses / errorResponseSchemas`，`web/src/shared/api/generated-contract.ts` 会把接口级 `400/422` 错误 schema 名直接落到运行时合同。
- `web/src/shared/api/client.ts` 当前已改为按 operation 合同解析错误消息：`ApiErrorResponse` 读取字符串 `detail`，`HTTPValidationError` 则优先展示第一条校验 `msg`；对应回归已补到 `web/src/shared/api/client.test.ts` 与 `web/src/shared/api/generated-contract.test.ts`。
- 本轮完整验收已再次通过：`npm run test -- src/shared/api/generated-contract.test.ts src/shared/api/client.test.ts` 为 `5 passed`，`./init.sh e2e` 结果已更新为前端组件测试 `15 passed`、后端 API 测试 `21 passed`，并继续覆盖缓存预热与 Playwright 烟雾回归。
- 顶栏“导出演示报告”已完成后端化：`backend/app/api/routes.py` 新增 `GET /api/v1/project-report/export`，`backend/app/services/core.py::export_project_report` 会返回包含首页摘要、运行时缓存状态和历史页元信息的实时 JSON 快照下载。
- `backend/scripts/sync_api_contracts.py` 已将该接口同步进 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`；`web/src/shared/api/client.ts::downloadProjectReport` 与 `web/src/shared/layout/AppShell.tsx` 已接线，后端不可用时仍保留本地导出兜底。
- 针对这条新链路的回归现已补齐：`backend/tests/test_api.py::test_project_report_export_*`、`web/src/shared/api/client.test.ts`、`web/src/shared/layout/AppShell.test.tsx` 以及 `web/scripts/e2e-smoke.mjs` 中的真实浏览器下载验证。
- 顶栏全局搜索也已完成后端化：`backend/app/api/routes.py` 新增 `GET /api/v1/search`，`backend/app/services/core.py::search_platform` 会统一返回页面入口与历史记录建议；`web/src/shared/layout/AppShell.tsx` 现已改为实时请求后端搜索结果并展示可点击建议。
- 这条搜索链路同样已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `search_api_v1_search_get`，`web/src/shared/api/client.ts::searchPlatform`、`web/src/shared/api/client.test.ts`、`web/src/shared/api/generated-contract.test.ts`、`web/src/shared/layout/AppShell.test.tsx` 和 `web/scripts/e2e-smoke.mjs` 都已覆盖。
- 博物馆图像理解页的“导出标签”也已完成后端化：`backend/app/api/routes.py` 新增 `POST /api/v1/museum-vision/export-tags`，`backend/app/services/core.py::export_museum_tags` 会返回带文件名头的标签文本下载；`web/src/features/museum-vision/page.tsx` 现已改为优先下载后端生成文件，失败时仍保留本地标签导出兜底。
- 这条下载链路同样已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `museum_vision_export_tags_api_v1_museum_vision_export_tags_post`，`web/src/shared/api/client.ts::downloadMuseumVisionTags`、`web/src/shared/api/client.test.ts`、`web/src/features/museum-vision/page.test.tsx` 和 `web/scripts/e2e-smoke.mjs` 都已覆盖。
- 文案生成页的默认配置也已完成合同化：`backend/app/api/routes.py` 新增 `GET /api/v1/text-generation/metadata`，`backend/app/services/core.py::get_text_generation_metadata` 会返回风格选项、生成类型、默认表单配置、示例输出与恢复示例所需元信息；本轮又继续扩展到页面标题说明、同步反馈、生成状态提示、恢复示例提示、复制按钮文案和生成/重新生成按钮标签，`web/src/features/text-generation/page.tsx` 现已改为统一消费这份 metadata。
- 这条 metadata 链路也已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `text_generation_metadata_api_v1_text_generation_metadata_get`，`web/src/shared/api/client.ts::getTextGenerationMetadata`、`web/src/shared/api/client.test.ts` 和 `web/src/features/text-generation/page.test.tsx` 都已覆盖；重新执行 `./init.sh e2e` 后，整条 Playwright smoke 回归也继续通过。
- 图像识别页的默认元信息也已完成合同化：`backend/app/api/routes.py` 新增 `GET /api/v1/image-recognition/metadata`，`backend/app/services/core.py::get_image_recognition_metadata` 会返回默认样例资产标识、默认识别结果和模型说明；`web/src/features/image-recognition/page.tsx` 现已改为消费后端 metadata 并用它驱动页面启动时的默认样例初始化。
- 这条 metadata 链路同样已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `image_recognition_metadata_api_v1_image_recognition_metadata_get`，`web/src/shared/api/client.ts::getImageRecognitionMetadata`、`web/src/shared/api/client.test.ts` 与 `web/src/features/image-recognition/page.test.tsx` 都已覆盖。
- 博物馆图像理解页的默认元信息也已完成合同化：`backend/app/api/routes.py` 新增 `GET /api/v1/museum-vision/metadata`，`backend/app/services/core.py::get_museum_vision_metadata` 会返回样例资产列表、默认识别结果、描述补充文案和数据来源说明；`web/src/features/museum-vision/page.tsx` 现已改为消费后端 metadata 并用它驱动页面启动时的样例、描述说明和底部数据来源面板初始化。
- 博物馆图像理解页残留在前端本地的页面标题说明、同步反馈、复制/导出标签文案，以及上传/切换样例状态标签现在也已继续收口到 `GET /api/v1/museum-vision/metadata`；本轮还在真实浏览器重新打开 `museum-vision` 页面确认页面标题/说明、复制成功文案和切换样例后的同步提示都会按后端 metadata 驱动更新。
- 首页总览页残留在前端本地的摘要同步中提示、模块入口文案，以及运行时缓存卡片里的“已生成 / 未生成”状态标签现在也已继续收口到 `GET /api/v1/dashboard/metadata`；本轮还在真实浏览器重新打开首页确认模块入口、运行时面板和缓存状态文案都能正常显示，没有引入页面回归。
- 图像识别页残留在前端本地的页面标题说明、同步提示、上传区/结果区标题、按钮文案和状态标签现在也已继续收口到 `GET /api/v1/image-recognition/metadata`；本轮还在真实浏览器重新打开 `image-recognition` 页面确认：
  - 页面会展示后端下发的 image metadata
  - 点击“示例图片”后页面交互仍正常
  - 修正 `runPrediction` 的 metadata 闭包使用后，没有再留下新的 hook 依赖警告
- 这条 metadata 链路同样已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `museum_vision_metadata_api_v1_museum_vision_metadata_get`，`web/src/shared/api/client.ts::getMuseumVisionMetadata`、`web/src/shared/api/client.test.ts` 与 `web/src/features/museum-vision/page.test.tsx` 都已覆盖。
- 情感分析页的默认元信息也已完成合同化：`backend/app/api/routes.py` 新增 `GET /api/v1/sentiment-analysis/metadata`，`backend/app/services/core.py::get_sentiment_analysis_metadata` 会返回示例文本、待分析占位结果、模型标签和分析说明；本轮又继续扩展到页面标题说明、同步/空输入反馈、输入区与分析按钮文案，以及关键词切换按钮标签，`web/src/features/sentiment-analysis/page.tsx` 现已改为统一消费这份 metadata。
- 这条 metadata 链路同样已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `sentiment_analysis_metadata_api_v1_sentiment_analysis_metadata_get`，`web/src/shared/api/client.ts::getSentimentAnalysisMetadata`、`web/src/shared/api/client.test.ts` 与 `web/src/features/sentiment-analysis/page.test.tsx` 都已覆盖；重新执行 `./init.sh e2e` 后，整条 Playwright smoke 回归也继续通过。
- 首页总览页的页面级元信息也已完成合同化：`backend/app/api/routes.py` 新增 `GET /api/v1/dashboard/metadata`，`backend/app/services/core.py::get_dashboard_metadata` 会返回页面标题、页面说明、摘要同步提示文案、Hero 横幅文案和两个 CTA 按钮配置；`web/src/features/dashboard/page.tsx` 现已改为消费后端 metadata 并用它驱动介绍区与 Hero 区域初始化。
- 这条 metadata 链路同样已纳入合同与验收：`backend/scripts/sync_api_contracts.py` 已同步生成 `dashboard_metadata_api_v1_dashboard_metadata_get`，`web/src/shared/api/client.ts::getDashboardMetadata`、`web/src/shared/api/client.test.ts` 与 `web/src/features/dashboard/page.test.tsx` 都已覆盖。
- 首页两个面板的展示语义也已继续后端化：`backend/app/services/core.py::_build_runtime_assets_summary_message` 现在会为 `GET/POST /api/v1/runtime-assets*` 直接生成 `summaryMessage`，而 `GET /api/v1/dashboard/metadata` 也已扩展返回运行时面板与历史面板的标题、动作文案和运行时状态文案键位；`web/src/features/dashboard/page.tsx` 不再自己拼装 runtime summary。
- 顶栏“导出交付包”也已完成后端化：`backend/app/api/routes.py` 新增 `GET /api/v1/project-deliverables/export`，`backend/app/services/core.py::export_project_delivery_bundle` 会生成 ZIP，除 `project-report.json`、`history-records.json/csv`、`runtime-assets.json`、`history-metadata.json` 和 `openapi.json` 外，还会继续附带 `README.md`、`feature_list.json`、`progress.md`、`session-handoff.md` 和关键架构说明 Markdown；当前 `manifest.json` 已升级到 `v1.1`，会按文件输出 `sha256 / contentType / sourceKind / sourcePath` 元信息，`web/src/shared/layout/AppShell.tsx` 现已提供直接下载入口。
- 首页总览页还残留在前端本地的运行时缓存标签与最近实验记录表头，现在也已继续收口到 `GET /api/v1/dashboard/metadata`；`web/src/features/dashboard/page.tsx` 会直接消费后端下发的 `runtimeAssetCacheFileLabel / runtimeAssetCacheSizeLabel / runtimeAssetUpdatedAtLabel / runtimeAssetMissingUpdatedAtLabel / historyTableHeaders`。
- 历史记录与项目说明页的页面级静态语义现在也已继续收口到 `GET /api/v1/history/metadata`；`web/src/features/history/page.tsx` 会直接消费后端下发的 `pageTitle / pageDescription / syncConnectedMessage / syncLoadingMessage / syncReadyMessage / syncFallbackMessage / filterPanelTitle / searchFieldLabel / searchPlaceholder / moduleFilterLabel / statusFilterLabel / exportFormatLabel / clearFiltersLabel / exportButtonLabel / exportButtonBusyLabel / exportSuccessMessageTemplate / exportFallbackMessage / tableTitle / tableLoadingMessage / tableCountTemplate / tableHeaders / rowActionLabel / projectOverviewTitle / moduleSpotlightActionLabel`。
- 围绕这轮 history residual metadata 合同化，`backend/tests/test_api.py`、`web/src/shared/api/client.test.ts` 与 `web/src/features/history/page.test.tsx` 都已补到同步提示、导出反馈、记录计数模板和行操作标签的断言；重新执行 `./init.sh e2e` 后，当前基线仍保持为前端组件测试 `30 passed`、后端 API 测试 `39 passed`、Playwright smoke 通过。
- 这条 ZIP 交付链路也已纳入合同与验收：`docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts` 已同步生成 `project_delivery_bundle_export_api_v1_project_deliverables_export_get`，`web/src/shared/api/client.ts::downloadProjectDeliveryBundle`、`web/src/shared/api/client.test.ts`、`web/src/shared/layout/AppShell.test.tsx` 和 `web/scripts/e2e-smoke.mjs` 都已覆盖。
- 重新执行统一验收后，当前基线为：`uv run pytest -q tests/test_api.py` `39 passed`，`./init.sh e2e` 为前端组件测试 `30 passed`、后端 API 测试 `39 passed`，运行时预热与 Playwright 烟雾回归全部通过。
- 首页总览当前又完成了一次纯资源级更新：`web/src/assets/hero/dashboard-hero.png` 已替换为用户本轮提供的新封面图，页面代码仍继续通过 `web/src/features/dashboard/page.tsx` 的背景图方式引用，不涉及新的布局逻辑改动。

## Open Decisions

- 是否要在下一轮显式发送一封真实测试邮件到 `946265043@qq.com`，确认 Mail 自动化在用户当前桌面环境下不仅语法可用，而且实际投递也正常。
- 是否要继续沿现有 `Vitest + RTL` 基线，把复制失败、导出失败、上传异常和接口异常保底等失败分支也纳入组件级测试。
- 课程报告封面中的“专    业 / 学生姓名 / 学号 / 指导教师”等待补字段，是否需要在最终提交前替换为真实信息。
- 是否要把当前运行时训练的中药分类器沉淀为离线模型文件，还是继续保持“首次请求时缓存训练”的轻量方案。
- 历史记录和总览页是否还需要进一步扩展成“导出课程报告 JSON / ZIP”等更正式的交付物接口。
- 是否要把当前运行时生成的缓存产物进一步前移到更正式的构建、部署或课程交付流程里，而不是只依赖本地 `warmup/e2e` 命令。
- 是否要继续把当前 OpenAPI 生成链路向前推进，例如补 typed operation helper、更细的错误策略或 contract diff。
- 是否要把当前新的“演示报告”导出继续升级为更正式的课程交付物，例如结构化 ZIP、附图报告或和课程文档生成流程联动。
- 是否要继续把顶栏全局搜索扩展成更完整的搜索体验，例如分类分组、相关度排序、键盘导航或更多后端索引字段。
- 是否要把当前新的博物馆标签导出继续升级为更完整的分析导出，例如结构化 JSON、摘要报告或与课程答辩材料联动。
- 是否要继续把首页更多空状态提示与其它局部语义进一步合同化，还是把重心转向 ZIP 交付包的下一轮扩展，例如纳入更多附件类型或更正式的交付清单分组。

## Blockers And Risks

- 当前 `每日 AI 邮件速递` 自动化已经完成创建，但本轮没有发送真实测试邮件；如果后续要百分百确认投递链路，需要额外做一次实际发送验证。
- 如果后续页面开发跨度过大，容易再次回到“多个模块同时进行但没有完成证据”的状态，需要严格遵守单 feature 规则。
- 当前 Git 基线已经建立，但像 `backend/var/`、`output/`、实验压缩包和重复原图这类本地资产现在是有意不入库的；如果后续有人需要完整原始素材，必须从本机工作区或外部备份恢复，而不是指望 GitHub 仓库自带这些文件。
- 课程文档目录页码的自动落盘依赖本机安装的 Microsoft Word；若换机器重生成，需要重新验证目录字段刷新步骤。
- 当前图像识别虽然已经接入真实课程图片内容，但模型仍是轻量特征 + `scikit-learn` 运行时训练版本，还不是原实验深度学习权重。
- 自动化测试虽然已覆盖 API 层、6 个页面的组件级关键闭环和项目内浏览器烟雾回归，但组件测试目前仍偏主路径，失败分支覆盖不够深。
- 当前没有活跃 blocker；最新一轮 `./init.sh e2e` 已完整通过，说明组件测试、后端测试、运行时缓存预热与 Playwright smoke 已重新回到统一绿基线。
- 手工开发时如果继续直接复用固定端口，仍可能命中旧接口版本；当前 `scripts/run_e2e_smoke.sh` 已具备更稳的自动选端口与非可恢复绑定错误快速失败逻辑，但这条策略还没有扩展到所有开发入口。
- 当前缓存产物虽然已经支持首页按钮、脚本和 `init.sh e2e` 主动生成，但如果正式部署时没有执行预热流程，首个请求仍可能承担一次明显的初始化成本。
- 当前生成合同已经覆盖 component schema、operation 元信息、运行时路径/method、queryKeys、query 默认值、导出响应元信息与错误响应 schema，但 `web/src/shared/api/client.ts` 里的部分 helper 行为仍是手写维护，例如导出兜底和更细的错误映射策略。
- 当前没有活跃 blocker；最新一轮 `env UV_CACHE_DIR=/private/tmp/codex-uv-cache ./init.sh e2e` 已重新完整通过，且其中已包含 `global search suggestions flow` 的 Playwright smoke 验证。

## First Good Next Tasks

1. 如果用户希望立即确认邮件链路，优先执行一次真实测试发送到 `946265043@qq.com`，只验证单封测试信，不改动自动化逻辑。
2. 如果继续做产品功能，再转 `text-generation` 或 `sentiment-analysis` 的下一条单一切片，不要同时跨两个页面。
3. 如果继续推进工程质量，优先沿现有基线补更多失败分支测试，例如复制失败、导出失败、上传异常和接口异常保底。

## Before Ending The Next Session

- 更新 `feature_list.json` 中对应 feature 的状态和 evidence。
- 更新 `progress.md` 里的验证结果与下一步。
- 把本文件中的恢复步骤和阻塞项同步到最新状态。
