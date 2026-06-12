# Backend

后端负责把 6 个前端页面接到真实服务上，包括摘要数据、推理演示、历史记录、导出能力和运行时缓存预热。

## 主要职责

- 首页总览摘要与最近记录接口
- 图像识别、情感分析、文案生成、博物馆图像理解接口
- 历史记录查询与 `JSON / CSV` 导出
- 运行时资源状态检查与预热
- OpenAPI 合同导出与前端类型同步

## 数据与推理来源

- 图像识别会读取 `../data/experiments/experiment-01-herbal-image-classification/` 的样本数据，训练轻量分类器并缓存到 `backend/var/herbal-classifier.pkl`。
- 情感分析会基于 `../data/experiments/experiment-02-text-analysis-generation/` 的 IMDb 词典数据构建本地分析能力。
- 文案生成会读取 `poetry.txt` 作为本地语料，并支持在配置密钥后优先使用 DeepSeek。
- 博物馆图像理解会读取 `../data/experiments/experiment-03-museum-multimodal/images/`，构建特征索引并缓存到 `backend/var/museum-feature-index.pkl`。

## 目录结构

```text
backend/
├── app/
│   ├── api/
│   ├── schemas/
│   ├── services/
│   ├── db.py
│   └── main.py
├── scripts/
│   ├── sync_api_contracts.py
│   └── warm_runtime_assets.py
├── tests/
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

如果希望从项目根目录一次跑完前后端验证，可使用：

```bash
./init.sh
```

如果希望继续执行浏览器级 smoke 回归，可使用：

```bash
./init.sh e2e
```

## DeepSeek 可选接入

文本生成与情感分析支持以下环境变量：

- `MULTIMODAL_TEXT_GENERATION_PROVIDER=auto|local|deepseek`
- `MULTIMODAL_SENTIMENT_PROVIDER=auto|local|deepseek`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_TIMEOUT_SECONDS`

策略说明：

- `auto`：检测到 `DEEPSEEK_API_KEY` 时自动优先使用 DeepSeek。
- `local`：始终使用本地逻辑。
- `deepseek`：强制尝试 DeepSeek，失败时回退到本地逻辑，保证演示可用性。

## 维护要点

- 新增或修改接口时，优先同步更新 `app/schemas/`、`app/services/` 和 `tests/`。
- 修改后运行 `uv run python scripts/sync_api_contracts.py`，让 `../docs/api/openapi.json` 与 `../web/src/shared/api/generated-contract.ts` 保持一致。
- `./init.sh` 已内置合同一致性检查，可用于防止前后端接口漂移。
