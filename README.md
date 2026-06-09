# 多模态 AI 课程成果平台

`multimodal-ai-course-platform/` 是这个项目唯一的正式工程根目录。工作区父目录只保留路由说明和本地工具痕迹，不再承载业务代码或第二套项目入口。

当前目录已经从“课程数据 + 原型参考资料”的散装状态，推进到“数据、文档、前后端工程可并行维护”的结构。现在不仅保留了 6 个高保真 UI 页面和 3 组实训数据，也已经在 `web/` 中落下可运行的前端应用骨架，并在 `backend/` 中补齐了可测试的 API 服务。

## 当前范围

- `docs/ui-reference/`
  - 收纳当前开发直接对照的高保真参考图和 HTML 参考稿整理版。
- `docs/source-assets/`
  - 收纳原始导入素材，包括最初的高保真出图与 `stitch 2` 历史稿，作为溯源存档。
- `docs/course-materials/`
  - 收纳课程提交模板等交付资料。
- `docs/api/`
  - 收纳由后端 OpenAPI 导出的接口合同快照，作为前后端共享契约的落盘产物。
- `data/experiments/`
  - 收纳 3 个实训方向的数据集与压缩包。
- `web/`
  - 已初始化 `React + TypeScript + Vite` 前端工程，并实现 6 个页面的统一演示壳层与 API client。
- `backend/`
  - 已初始化 `FastAPI + Pydantic + SQLite` 后端服务，负责推理演示接口、历史记录与课程答辩所需的数据汇总。
- `scripts/`
  - 收纳项目内部工具脚本，例如课程文档生成器。

## 目录结构

```text
multimodal-ai-course-platform/
├── backend/
├── data/
│   └── experiments/
│       ├── experiment-01-herbal-image-classification/
│       ├── experiment-02-text-analysis-generation/
│       └── experiment-03-museum-multimodal/
├── deploy/
│   └── docker/
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── course-materials/
│   ├── source-assets/
│   ├── superpowers/
│   └── ui-reference/
├── scripts/
├── web/
└── README.md
```

## 6 个页面与业务数据的对应关系

| 页面 | 路由建议 | 主要数据来源 | 说明 |
|---|---|---|---|
| 首页总览 | `/` | 各模块汇总 | 聚合 4 个实验模块、历史记录和统计卡片 |
| 图像识别 | `/image-recognition` | `experiment-01` | 展示中药或分类图像的识别结果与概率分布 |
| 情感分析 | `/sentiment-analysis` | `experiment-02` | 使用影评/文本数据做情绪判断和关键词可视化 |
| 文案生成 | `/text-generation` | `experiment-02` | 使用文本数据与生成模板做标题、宣传语、短文案输出 |
| 博物馆图像识别 / 描述 | `/museum-vision` | `experiment-03` | 对博物馆图像做来源识别、描述与标签抽取 |
| 历史记录与项目说明 | `/history` | 全部模块 | 承接任务记录、项目说明、模块介绍与答辩说明 |

## 当前进展

1. `web/` 已完成工程初始化，并按 `app / features / shared / mocks / assets / styles` 分层。
2. 根目录散落运行时图片已迁入 `web/src/assets/`，按品牌、Hero、插图三类归档。
3. 根目录原始参考素材已经统一收纳到 `docs/source-assets/`，避免正式工程和平级参考目录继续混放。
4. 6 个页面都已有可运行的前端演示版，并与 `docs/ui-reference/high-fidelity/` 的版式进行对照。
5. `backend/` 已提供首页摘要、历史记录、图像识别、情感分析、文案生成与博物馆图像理解等接口，并使用 SQLite 保存任务记录。
6. `experiment-02` 的两条文本链路已经开始接入真实课程数据：情感分析会从 IMDb 数据集构建词典，文案生成会从 `poetry.txt` 读取诗词语料。
7. `experiment-01` 的图像识别模块已经支持真实本地上传，后端会基于课程中药样本训练轻量分类器，并按图片内容输出 5 类中药材概率。
8. `experiment-03` 的博物馆模块已经支持真实本地上传，后端会根据图片内容与课程博物馆图像数据集做相似度比对。
9. 图像识别后端现在会把训练好的轻量中药分类器缓存到 `backend/var/herbal-classifier.pkl`，避免每个新进程首次请求都重训整套样本。
10. 博物馆图像理解后端现在也会把特征索引缓存到 `backend/var/museum-feature-index.pkl`，减少新进程首次馆藏检索时的索引构建成本。
11. 首页总览现在已经接入运行时资源状态面板，可直接查看中药分类器缓存与博物馆特征索引的就绪状态，并可一键触发预热。
12. 后端新增 `GET /api/v1/runtime-assets` 与 `POST /api/v1/runtime-assets/warmup`，同时提供 `backend/scripts/warm_runtime_assets.py`，便于在不启动前端的情况下预构建缓存。
13. 历史记录页已经支持通过后端接口按筛选条件导出 `JSON / CSV` 文件。
14. `web/` 现在已经补上 `Vitest + React Testing Library` 组件级测试，6 个页面都已经有组件级回归锚点，当前覆盖首页运行时预热、历史页导出兜底、图像识别本地上传、博物馆样例切换、情感分析重分析与文案生成示例恢复等关键前端交互。
15. `scripts/run_e2e_smoke.sh` 已经把真实浏览器烟雾回归固化进项目，当前会自动验证首页预热、中药上传、情感分析、文案生成、博物馆上传与历史导出链路。
16. 浏览器烟雾回归脚本的端口探测现在也已抽成 `scripts/find_free_port.mjs` 并补上回归测试；当前只会在端口占用时继续递增，若遇到 `EPERM` 等非可恢复绑定错误会直接清晰失败，不再递归撞到非法端口。
17. `init.sh` 现在支持 `warmup` 与 `e2e` 扩展模式，且默认会执行前端 `lint + test + build`；`e2e` 模式会继续串行执行缓存预热和真实浏览器烟雾回归。
18. 后端 OpenAPI 合同现在会同步生成 `docs/api/openapi.json` 与 `web/src/shared/api/generated-contract.ts`，并由 `init.sh` 自动校验，减少前后端接口漂移。
19. 生成的前端 API 合同已经继续推进到 operation 级，当前会额外输出 `BackendApiOperationMap`，可直接承载 `method / path / query / requestBody / responseBody` 映射。
20. 前端 `web/src/shared/api/client.ts` 也已开始消费运行时 `backendApiOperations` 元信息，不再手写各接口的路径和 method 字符串。
21. 项目根目录命名已经统一为 `multimodal-ai-course-platform/`，后续文档、脚本和交接流程都以这个路径为准。
22. 课程文档生成脚本已经收回到 `scripts/`，工作区根目录不再保留业务脚本。
23. 顶栏现在还支持通过后端 `GET /api/v1/project-deliverables/export` 一次下载 ZIP 交付包，统一包含项目报告、历史记录、运行时状态、历史页元信息、OpenAPI 合同，以及 `README / feature_list / progress / session-handoff / architecture` 等项目状态文档；包内 `manifest.json` 还会继续提供 `category / sizeBytes / sha256 / contentType / sourceKind / sourcePath` 等结构化元信息，便于课程提交、验收复核与项目交接。
24. 项目现在还补齐了 Docker Compose 容器化交付链路：可用 `docker-compose.yml + deploy/docker/` 直接拉起前后端，并通过 `scripts/package_submission_bundles.sh` 一键生成“源码压缩包 + 容器化运行压缩包”，用于替代课程清单中的“虚拟机压缩包”。

## 下一步建议

1. 继续扩展 `backend/tests/`，把缓存失效、异常恢复和模型产物兼容性场景补得更完整。
2. 如果继续深化前端质量，优先沿现有 `Vitest + RTL` 基线补测更多关键模块，而不是回到只靠 smoke 的状态。
3. 如果准备接入 CI 或正式部署流程，优先复用现有 `./init.sh e2e` 和 `backend/scripts/warm_runtime_assets.py`，避免另起一套验收命令。
4. 如果准备课程提交或答辩归档，优先使用 `./scripts/package_submission_bundles.sh` 生成容器替代交付物，并在提交说明中注明“Docker Compose 容器包用于替代虚拟机镜像”。
5. 如果继续深化后端能力，可以考虑把当前轻量运行时模型进一步沉淀为更接近课程原实验的离线权重或构建产物。
