# Backend

这里放课程平台的后端服务。当前已经落下 `FastAPI + Pydantic + SQLite` 基线，用于承接前端 6 个页面中的摘要、推理演示、导出与历史记录能力。

## 当前职责

- 首页摘要与最近历史记录接口
- 图像识别推理接口
- 情感分析接口
- 文案生成接口
- 博物馆图像识别 / 描述接口
- 历史记录与文案生成历史接口

其中，文本类模块已经开始直接读取课程真实数据：

- 情感分析会基于 `../data/experiments/experiment-02-text-analysis-generation/datasets/imdb.npz` 与 `imdb_word_index.json` 构建 IMDb 词典。
- 文案生成会基于 `../data/experiments/experiment-02-text-analysis-generation/datasets/poetry.txt` 选取诗词语料；当启用 DeepSeek provider 时，会优先调用远程大模型生成结果，并在远程接口不可用时回退到本地模板与诗词语料生成逻辑。

图像类模块中，博物馆页面也已经开始读取真实上传内容：

- 图像识别接口支持接收前端传来的图片 data URL。
- 后端会自动准备 `../data/experiments/experiment-01-herbal-image-classification/` 下的中药样本，并基于颜色 / 纹理特征训练轻量分类器，输出 5 类中药材概率。
- 训练完成后的模型会默认缓存到 `backend/var/herbal-classifier.pkl`；如需改路径，可设置 `MULTIMODAL_HERBAL_MODEL_CACHE_PATH`。
- 博物馆图像理解接口支持接收前端传来的图片 data URL。
- 后端会读取上传图片内容，并与 `../data/experiments/experiment-03-museum-multimodal/images/` 下的课程图像数据集做相似度比对。
- 馆藏特征索引会默认缓存到 `backend/var/museum-feature-index.pkl`；如需改路径，可设置 `MULTIMODAL_MUSEUM_INDEX_CACHE_PATH`。
- 后端还提供运行时资源状态与预热接口，可直接查看上述两个缓存是否就绪，并在正式验收前主动生成。

历史记录相关能力也已经接入真实后端链路：

- 历史记录列表支持按关键字、模块和状态筛选。
- 历史记录导出接口支持输出 `JSON / CSV` 文件，便于课程答辩和过程留档。
- 后端 OpenAPI 合同可以一键导出到 `../docs/api/openapi.json`，并同步生成前端 `../web/src/shared/api/generated-contract.ts` 类型文件。
- 生成文件当前还包含 `BackendApiOperationMap`，可为前端提供 operation 级 `method / path / query / requestBody / responseBody` 映射。
- 前端 `web/src/shared/api/client.ts` 现在也会直接消费生成出的 `backendApiOperations` 运行时元信息，减少手写接口路径与 method 的维护量。

## 当前结构

```text
backend/
├── app/
│   ├── api/
│   │   └── routes.py
│   ├── services/
│   │   ├── core.py
│   │   └── llm_provider.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── db.py
│   └── main.py
├── scripts/
│   ├── sync_api_contracts.py
│   └── warm_runtime_assets.py
├── tests/
│   └── test_api.py
├── var/
│   └── history.db
├── pyproject.toml
└── README.md
```

## 启动与验证

```bash
cd backend
uv sync
uv run pytest
uv run python scripts/sync_api_contracts.py
uv run python scripts/warm_runtime_assets.py
uv run uvicorn app.main:app --reload --port 8000
```

开发环境下，前端 `web/` 已通过 Vite 代理把 `/api/*` 请求转发到 `http://127.0.0.1:8000`。

如果需要跑真实浏览器烟雾回归，优先使用项目根目录的 `./scripts/run_e2e_smoke.sh`。
这个脚本会自动选择空闲端口、设置 `VITE_API_BASE_URL`、启动临时前后端并执行 Playwright 验证。

如果希望一条命令执行“验证 + 预热 + 浏览器烟雾回归”，可以在项目根目录运行：

```bash
./init.sh e2e
```

## DeepSeek 文案生成接入

`POST /api/v1/text-generation/generate` 和 `POST /api/v1/sentiment-analysis/analyze` 现在都支持通过环境变量切换到 DeepSeek：

- `MULTIMODAL_TEXT_GENERATION_PROVIDER=auto|local|deepseek`
- `MULTIMODAL_SENTIMENT_PROVIDER=auto|local|deepseek`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`，默认 `https://api.deepseek.com`
- `DEEPSEEK_MODEL`，默认 `deepseek-chat`
- `DEEPSEEK_TIMEOUT_SECONDS`，默认 `30`

安全约束：

- 不要把真实 `DEEPSEEK_API_KEY` 写入仓库文件、测试文件或文档示例。
- 本地调试通过 shell `export` 注入；CI 或部署环境通过 secret 管理。

回退策略：

- 当 provider 为 `auto` 时，只要检测到 `DEEPSEEK_API_KEY`，文本生成和情感分析都会自动优先使用 DeepSeek。
- 当 provider 为 `local` 时，继续使用现有本地模板 / 本地分析逻辑。
- 当 provider 为 `deepseek` 且接口调用失败、返回非法 JSON 或未配置密钥时，自动回退到本地生成逻辑。

## 已提供接口

- `GET /api/v1/health`
- `GET /api/v1/dashboard`
- `GET /api/v1/runtime-assets`
- `POST /api/v1/runtime-assets/warmup`
- `GET /api/v1/history`
- `GET /api/v1/history/metadata`
- `GET /api/v1/history/export`
- `POST /api/v1/image-recognition/predict`
- `POST /api/v1/sentiment-analysis/analyze`
- `GET /api/v1/text-generation/history`
- `POST /api/v1/text-generation/generate`
- `POST /api/v1/museum-vision/analyze`

## 维护原则

- 原始课程数据仍然只从 `../data/` 读取，不在这里复制一份。
- 新增或调整接口后，优先同步更新 `app/schemas/`、`app/services/`、`tests/`，然后运行 `uv run python scripts/sync_api_contracts.py` 生成最新合同产物。
- 项目根目录的 `./init.sh` 现在会自动执行 `sync_api_contracts.py --check`，防止后端 schema 与前端 API 类型静默漂移。
- 当前文本模块、图像识别模块和博物馆模块都已开始接入真实课程数据；后续如果替换为正式模型权重，优先保持现有响应结构稳定。
