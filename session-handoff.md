# Session Handoff

Last updated: 2026-06-09

## Resume Checklist

1. 进入项目目录：`cd multimodal-ai-course-platform`
2. 阅读：`AGENTS.md`
3. 阅读：`feature_list.json`、`progress.md`
4. 运行：`./init.sh`
5. 只选择一个 feature 继续推进

## Current Focus

- 工作区根目录现在也有一个轻量 Git 外壳，用来让 Codex 在当前目录直接识别 Git 状态；根级 `.gitignore` 已明确忽略 `.playwright-mcp/`、根目录截图资产、废弃 `项目3/` 路径以及内层正式项目仓库 `multimodal-ai-course-platform/`，因此后续如果要查看业务代码状态，仍应进入正式项目根目录再执行 `git status`。
- 本轮还顺手核对了旧 `项目3/` 目录，确认里面只有空白残留文档占位文件；这批占位文件已从工作区入口层清理，避免误把废弃路径当成正式项目根继续操作。
- 首页顶栏全局搜索本轮又补了一次共享样式热修：`web/src/styles/globals.css` 现在把 `.topbar` 的 `overflow` 放开为 `visible`，并给 `.search-box__results` 增加更高的层级和滚动上限，因此搜索 `大都会艺术博物馆` 这类会返回多条历史建议的关键词时，建议面板不会再被首页 Hero 或下方模块卡片遮挡。
- 围绕这次搜索建议遮挡修复已经完成定向验证与真实浏览器复核：`web` 内 `npm run test -- src/shared/layout/AppShell.test.tsx` 为 `6 passed`，`npm run build` 通过，并用 Playwright 在 `http://127.0.0.1:5173/` 输入 `大都会艺术博物馆` 做实际检查，确认建议层可完整浮出顶栏且截图已保存到 `output/search-overlay-check.png`。
- `feat-049 课程容器化交付包` 已完成：项目根新增 `docker-compose.yml`、`.dockerignore` 与 `deploy/docker/`，前端采用 `Nginx` 托管静态构建产物并反代后端，后端镜像则会携带课程数据、文档与运行所需代码，当前可以用容器化运行包替代“虚拟机压缩包”提交。
- `docs/course-materials/container-delivery.md` 已落成课程语境下的提交说明，明确建议采用“源码压缩包 + 容器化运行压缩包”的双包提交方式；`scripts/package_submission_bundles.sh` 已能一键生成这两份压缩包。
- 本轮已实际生成交付物：`output/submission/源码压缩包.zip` 与 `output/submission/容器化运行压缩包.zip` 均已落盘，可直接作为本次课程提交候选产物。
- 这条交付链路已经完成静态验证：`bash -n scripts/package_submission_bundles.sh` 通过，`docker-compose.yml` 已用 Ruby YAML 成功解析出 `backend`、`web` 两个服务；但当前机器没有可用的 `docker` 命令，所以本轮无法本地继续做 `docker compose up --build` 或导出预构建镜像 tar。
- 启动阶段按规则执行的 `./init.sh` 现已重新全绿：本轮已修复 `web/src/features/image-recognition/page.test.tsx` 与 `web/src/features/museum-vision/page.test.tsx` 中 4 条已漂移断言，并补上稳定的 `FileReader` mock 以覆盖当前样例图 data-url 转换链路；fresh 验收结果为前端组件测试 `9 passed files / 39 passed tests`、前端 build 通过、后端 `pytest 53 passed`。
- 当前本地服务也已经直接启动可用：后端位于 `http://127.0.0.1:8000`，前端位于 `http://127.0.0.1:5173/`，并已通过首页与 `GET /api/v1/dashboard` 探活。
- `feat-048 共享壳层视觉精修与首页总览 UI 升级` 本轮又补了一次更精确的遮挡修复：`web/src/styles/globals.css` 现在把 `.workspace` 设为 `inline-size` 容器，并用 container query 按真实内容区宽度而不是整窗宽度来切换顶栏排布；因此在左侧边栏占宽的真实桌面场景里，`history` 和 `museum-vision` 的长标题不会再被右侧按钮区挤住。
- 围绕这次遮挡修复已经完成 fresh 验收：项目根目录 `./init.sh` 通过，当前结果为前端组件测试 `9 passed files / 39 passed tests`、前端 build 通过、后端 `pytest 53 passed`。
- 这次共享壳层热修也已经做了真实浏览器截图复核：重新抓取了 `/history` 与 `/museum-vision` 的桌面端页面，确认顶栏会自动退成“标题 / 操作 / 搜索”三行结构，标题完整可见且不再和按钮重叠。
- `feat-048 共享壳层视觉精修与首页总览 UI 升级` 本轮又补了一次更贴近参考图的顶部局部精修：`AppShell` 共享顶栏现在改成“标题左、操作右、搜索框下沉第二行”的稳定两行结构，按钮在桌面端保持横排，账号区也强化成独立信息卡。
- 围绕这次顶部精修已经完成定向验证：`web` 内 `npm run test -- src/shared/layout/AppShell.test.tsx` 为 `6 passed`，`npm run build` 通过，并已用 Playwright 对 `http://127.0.0.1:5173/` 抽取桌面端截图确认最新视觉结果。
- `feat-006 图像识别模块页面` 本轮已修复一个真实误判：用户上传的真实枸杞场景图此前会被整图背景、碗沿和绿叶干扰带偏成 `党参 50.1% / 枸杞 38.0%`；当前后端会在“高亮红色主体明显、且整图把枸杞排在第二名并接近第一名”的模糊场景下，自动补跑一次下半主体裁剪推理，把这类真实桌面枸杞图纠正为 `枸杞`。
- 这次图像识别修复已经固化为真实回归：`backend/tests/fixtures/gouqi-realistic-scene.jpg` 保存了用户这张枸杞图，`backend/tests/test_api.py::test_image_recognition_prefers_gouqi_for_realistic_red_fruit_scene` 会持续锁定“真实枸杞场景不再误判党参”。
- 围绕这次图像识别修复的后端验收已经通过：`backend` 内图像识别定向回归为 `5 passed`，完整 `pytest` 为 `53 passed`；当前项目根目录最新 `./init.sh` 也已经重新回到全绿。
- `feat-009 博物馆图像识别与描述模块页面` 本轮已补上“作品线索识别”层：后端会在保留机构相似度检索的同时，优先从上传文件名提取作品名、时代、类型和馆藏线索；前端 `museum-vision` 结果区也已经新增对应展示卡，不再只显示机构名和置信度。
- 围绕这次博物馆增强的定向验收已经通过：`backend` 相关馆藏接口回归为 `5 passed`，`web` 侧 `museum-vision + client` 定向组件测试为 `17 passed`，并且前端 build 已通过。
- `feat-007 情感分析模块页面` 本轮已继续增强：后端本地情感分析新增中文情绪词、程度副词和更稳的强度评分逻辑，前端离线兜底也同步支持中文输入；最新浏览器复核里，`我真的很讨厌你，这句话让我特别崩溃。` 已能稳定得到 `负面 / 96% / -0.98 / 强烈负面`。
- 围绕这次情感分析增强的最新统一验收已经 fresh 通过：项目根目录 `./init.sh` 当前结果为 `web 9 passed files / 39 passed tests`、前端 build 通过、后端 `pytest 53 passed`。
- `feat-048 共享壳层视觉精修与首页总览 UI 升级` 已完成：共享 design tokens、全局背景/卡片/表单/表格样式、AppShell 侧栏与顶栏信息层次，以及首页总览 Hero 都已统一做完第二轮美化，且没有改动既有交互链路。
- 这轮 UI 美化已经做过真实浏览器桌面端与移动端复核；共享顶栏中文摘要被挤压成异常换行的问题已修正，当前桌面端首页、`museum-vision` 和 `history` 的顶栏信息都能稳定横向阅读。
- 项目根 `multimodal-ai-course-platform/` 现已初始化为正式 Git 仓库，并已接入 GitHub 私有远端 `origin`：`https://github.com/aCunese/multimodal-ai-course-platform`。
- 项目级 `.gitignore` 已明确排除本地构建产物、运行时缓存、调试输出、实验原始压缩包，以及 `experiment-01` 与 `dataset/` 重复的 `raw/` 原图目录；后续默认只围绕受控源码、文档与实际运行依赖数据推进。
- 文本模块本轮已补回共享 fallback helper 的真实接线：`web/src/features/sentiment-analysis/page.tsx` 现在会在分析失败时按当前输入生成本地情感判断，并同时展示命中的原词与中文语义；`web/src/features/text-generation/page.tsx` 现在会在生成失败时按当前配置生成新的本地兜底文案，而不是只停留在顶部提示。
- 最新统一验收已重新通过：`cd web && npm run test` 为 `9 passed files / 39 passed tests`，项目根目录 `./init.sh` 通过，后端 `pytest` 为 `51 passed`。
- `feat-046 DeepSeek 可观测化、情感分析 provider 接入与共享顶栏整理` 已完成：6 个页面默认首屏 success 胶囊提示已经统一收口；`text-generation` 与 `sentiment-analysis` 都已补齐 provider 可观测状态；`sentiment-analysis` 现已升级为 `MULTIMODAL_SENTIMENT_PROVIDER=local|deepseek` 的 DeepSeek 主分析 + 本地词典回退；`AppShell` 顶栏桌面端布局与图片页/博物馆页反馈状态也已整理完成。
- `feat-044 DeepSeek 文案生成接入` 保持完成态：`text-generation` 当前可通过 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek`、`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` 与 `DEEPSEEK_TIMEOUT_SECONDS` 启用远程大模型生成；远程不可用时继续自动回退到本地模板与诗词语料逻辑。
- `web/scripts/e2e-smoke.mjs` 已按当前中文展示结果完成断言更新：图像识别改为 `党参 / 槐花`，情感分析与搜索建议改为 `负面判断 / 负面`，博物馆馆名与标签导出改为 `史密森学会`。
- 当前继续往下做时，不需要再重复大范围联调排查；更合适的下一条单一切片是继续深化文本模块质量，例如补情感分析 DeepSeek explanation 质量回归，或继续细化文案生成的分类型风格词典。
- 课程提交文档已经形成可重复生成链路；如果还要继续润色报告或部署说明书，优先修改 `scripts/generate_course_documents.py` 后再统一重生成。
- 当前课程文档生成链路已经显式补齐 `default + first-page` 两套页眉页脚；如果后续还要微调页眉位置，优先继续在 `scripts/generate_course_documents.py` 中调整无边框双列表格锚点，而不是手工在 Word 中逐页拖动。
- 项目内现已补齐 `docs/course-materials/templates/` 模板归档；后续若继续修改课程报告或部署说明书，直接以项目内模板与 `generated-output/` 产物为准，不再以工作区外层的散落 Word 文件作为正式来源。

## What Changed In This Session

- `web/src/styles/globals.css` 本轮又补了一次首页搜索浮层热修：把共享顶栏 `.topbar` 从 `overflow: hidden` 调整为 `overflow: visible`，并给 `.search-box__results` 增加 `z-index`、`max-height`、`overflow-y: auto` 与 `overscroll-behavior: contain`，解决搜索建议被下方内容遮挡且长结果列表无法自收口的问题。
- 这次热修已做真实页面复核：本地临时拉起 `uvicorn` 与 `vite` 后，用 Playwright 在首页输入 `大都会艺术博物馆`，确认建议面板可跨出顶栏显示在 Hero 上层，且 8 条结果会在面板内滚动；复核截图落盘为 `output/search-overlay-check.png`。
- `web/src/styles/globals.css` 本轮继续补了一次共享顶栏热修：把 `.workspace` 升级为 `container-type: inline-size`，并新增两个 workspace 级 container query，让顶栏根据真实内容区宽度自适应切成两行或三行，而不是继续依赖会被侧栏干扰的 viewport 断点。
- 这次样式修复还顺手把中等宽度下的标题字号、按钮高度和账号卡最小宽度收紧了一档，因此 `history`、`museum-vision` 这类长标题页面在桌面浏览器里不会再出现“标题被按钮区盖住”的问题。
- 针对这次热修重新执行了完整验收：项目根目录 `./init.sh` 通过，结果为前端 `9 passed files / 39 passed tests`、前端 build 通过、后端 `pytest 53 passed`；同时用 Playwright 重抓 `/history` 与 `/museum-vision` 截图确认视觉修复成立。
- `web/src/shared/layout/AppShell.tsx` 已把共享顶栏重排成更稳定的两行式结构：右上操作按钮与账号卡保持第一行，搜索框独立沉到第二行，避免桌面宽度下被挤成右侧竖列。
- `web/src/styles/globals.css` 已针对 `.topbar`、`.topbar__controls`、`.topbar__toolbar`、`.search-box`、`.toolbar-button` 与 `.account-pill` 做了新一轮视觉和布局精修，加入更接近参考图的浅蓝高光背景、卡片层次和宽搜索框。
- `backend/app/services/core.py` 已为图像识别补上一次以证据驱动的二次判别：常规仍先走整图分类；只有当整图结果把 `gouqi` 排在第二、红色主体覆盖明显且分差接近时，才会补跑下半主体裁剪推理，避免真实枸杞桌面图被背景和道具稀释。
- `backend/tests/fixtures/gouqi-realistic-scene.jpg` 已新增到项目内，作为这次图像识别误判的真实回归样本。
- `backend/tests/test_api.py` 已新增 `test_image_recognition_prefers_gouqi_for_realistic_red_fruit_scene`，并先经历过一次明确的红测，再在修复后转绿。
- `backend/app/schemas/__init__.py` 与 `backend/app/services/core.py` 已为 `museum-vision` 补上新的 `artworkClue` 响应字段，当前会输出 `title / era / category / museumHint / basis`，并把上传文件名中的中文线索融入描述生成。
- `web/src/features/museum-vision/page.tsx` 与 `web/src/styles/globals.css` 已新增“作品线索”展示卡；上传 `明清缂丝挂画_苏州博物馆馆藏_...jpg` 这类文件时，页面会直接展示“明清缂丝挂画 / 明清 / 缂丝挂画 / 苏州博物馆”这类更贴近用户问题的结果。
- `backend/tests/test_api.py`、`web/src/features/museum-vision/page.test.tsx` 与 `web/src/shared/api/client.test.ts` 已补齐回归，专门锁定“文件名线索可被提取”和“前端会把作品线索渲染出来”两条链路；同时已重新同步 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`。
- `backend/app/services/core.py` 已补上中文情绪增强：在 IMDb 英文词典之外继续增加 `讨厌 / 崩溃 / 开心 / 喜欢` 等中文情绪词、程度副词和否定词语境判断，本地分析不再把明显中文情绪误判成 `中性 / 0.00`。
- `web/src/shared/fallbacks/local-text-tools.ts` 已同步升级中文兜底分析规则，断网或后端异常时，情感页仍能对中文输入做出合理判断，不会退回“听不懂中文”的本地兜底状态。
- `web/src/features/sentiment-analysis/page.tsx` 与 `web/src/styles/globals.css` 已重做强度条展示：当前会按分值方向绘制响应式填充，并展示 `强烈负面 / 明显正面 / 接近中性` 等语气等级，同时补上积极/消极线索计数。
- `backend/tests/test_api.py::test_sentiment_analysis_understands_strong_chinese_negative_emotion` 与 `web/src/features/sentiment-analysis/page.test.tsx` 已新增回归，专门锁定“中文强负面句子不再误判中性”和“强度可视化不再停在 0.00”的问题。
- 本轮除了 fresh `./init.sh` 外，还额外拉起了临时后端 `127.0.0.1:8003` 与临时前端 `127.0.0.1:4273` 做浏览器自动复核，并确认中文输入 `我真的很讨厌你，这句话让我特别崩溃。` 在最新代码里实际呈现为 `负面 / 96% / -0.98 / 强烈负面`，且请求链路与控制台都干净。
- 在真正改 UI 之前先用 `product-design:get-context` 明确了边界：保留现有中文产品结构、功能入口和所有交互，只提升视觉质感与信息层次，不做信息架构重排。
- `web/src/styles/tokens.css` 已统一升级共享设计 token：主色、强调色、表面层、阴影、圆角和字体栈都已更新，视觉语言从偏平的浅蓝玻璃感收束为更完整的 editorial-tech 风格。
- `web/src/styles/globals.css` 已对背景层、卡片、按钮、输入框、上传区、表格、导航 hover、过渡动效和 `prefers-reduced-motion` 做整体美化；后续浏览器复核后又补了一次 `.topbar`、`.topbar__controls` 与 `.topbar__context` 的桌面端宽度修正。
- `web/src/shared/layout/AppShell.tsx` 已补上侧栏眉题、分组标签、导航摘要、环境信息眉题和顶栏当前页面 kicker，让共享壳层在不加新功能的情况下拥有更完整的展示层次。
- `web/src/features/dashboard/page.tsx` 已对首页总览 Hero 做二次提升，新增“课程项目总览”眉题和事实条，直接展示模块数、最近记录数与运行时资源数。
- `web/src/features/text-generation/page.test.tsx` 与 `web/src/features/sentiment-analysis/page.test.tsx` 已同步更新为容纳当前 fallback UI 与情感强度增强的断言，避免这轮文本/UI 改动反向把回归测挂掉。
- 本轮通过真实浏览器做了桌面端与移动端抽检，并确认顶栏修正后的展示结果可接受；最终 fresh 运行 `./init.sh` 继续保持完整绿，结果为前端 `39 passed`、后端 `51 passed`。
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

- 当前没有活跃 blocker 卡住图像识别修复本身；后端 `pytest` 已重新完整转绿。
- 但项目级 `./init.sh` 本轮没有全绿，失败点落在用户工作树里已存在的 `museum-vision` 前端组件测试断言漂移上；如果下一轮要恢复整仓统一绿基线，优先处理 `web/src/features/museum-vision/page.test.tsx` 与对应页面 metadata/文案变更，而不是回头改这次图像识别逻辑。
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

1. 如果需要把项目基线重新拉回 `./init.sh` 全绿，优先修复 `web/src/features/museum-vision/page.test.tsx` 中 3 条已经漂移的断言，再复跑统一验收。
2. 如果要继续强化图像识别稳健性，优先补更多“真实桌面拍摄/电商场景/带背景器皿”的中药图片回归，而不是立刻大改模型结构。
1. 如果用户希望立即确认邮件链路，优先执行一次真实测试发送到 `946265043@qq.com`，只验证单封测试信，不改动自动化逻辑。
2. 如果继续做产品功能，再转 `text-generation` 或 `sentiment-analysis` 的下一条单一切片，不要同时跨两个页面。
3. 如果继续推进工程质量，优先沿现有基线补更多失败分支测试，例如复制失败、导出失败、上传异常和接口异常保底。

## Before Ending The Next Session

- 更新 `feature_list.json` 中对应 feature 的状态和 evidence。
- 更新 `progress.md` 里的验证结果与下一步。
- 把本文件中的恢复步骤和阻塞项同步到最新状态。
