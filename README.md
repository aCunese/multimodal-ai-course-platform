# 多模态 AI 课程成果平台

一个面向课程实验展示的全栈 Web 应用，把图像识别、情感分析、文案生成和博物馆图像理解整合到同一个可运行平台里。项目重点不只是把页面搭出来，而是把 6 个页面、真实 API、运行时缓存、历史记录和自动化验证串成一条完整演示链路。

## 项目亮点

- 单仓库全栈实现：前端使用 `React + TypeScript + Vite`，后端使用 `FastAPI + Pydantic + SQLite`。
- 六个页面共享统一壳层和 typed API contract，避免前后端接口漂移。
- 图像识别、情感分析、文案生成、博物馆图像理解都支持真实交互，不只是静态原型。
- 后端提供运行时缓存预热、历史记录导出和 OpenAPI 合同同步，适合演示和回归验证。
- 项目内置 `Vitest`、`pytest` 和 Playwright smoke 脚本，能直接验证关键用户流程。

## 功能概览

| 页面 | 路由 | 说明 |
|---|---|---|
| 首页总览 | `/` | 聚合模块入口、运行时资源状态和最近记录 |
| 图像识别 | `/image-recognition` | 上传中药图片并查看分类结果与概率分布 |
| 情感分析 | `/sentiment-analysis` | 分析文本情绪倾向并展示关键词线索 |
| 文案生成 | `/text-generation` | 根据主题、风格和类型生成多种文案 |
| 博物馆图像理解 | `/museum-vision` | 识别馆藏来源、描述内容并导出标签 |
| 历史记录 | `/history` | 查看各模块运行记录，按条件筛选并导出 |

## 技术栈

- 前端：`React 19`、`TypeScript`、`Vite`、`React Router`
- 后端：`FastAPI`、`Pydantic`、`SQLite`
- 测试：`Vitest`、`React Testing Library`、`pytest`、`Playwright`
- 工程化：`OpenAPI` 合同同步、运行时缓存预热、`Docker Compose`

## 本地运行

### 一键验证

```bash
./init.sh
```

这条命令会依次执行前端 `lint + test + build`、后端依赖同步、API 合同校验和 `pytest`。

### 启动前后端

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

```bash
cd web
npm install
npm run dev
```

前端默认通过 Vite 代理把 `/api/*` 请求转发到本地后端。

### 浏览器烟雾回归

```bash
./scripts/run_e2e_smoke.sh
```

## 目录结构

```text
multimodal-ai-course-platform/
├── backend/        # FastAPI 服务、数据处理和测试
├── data/           # 课程实验数据集
├── deploy/         # Docker / Nginx 部署配置
├── docs/           # 技术说明、OpenAPI 快照和界面参考图
├── scripts/        # 自动化脚本与本地验证工具
├── web/            # React 前端应用
└── README.md
```

## 界面参考

- [首页总览](docs/ui-reference/high-fidelity/dashboard-overview.png)
- [图像识别](docs/ui-reference/high-fidelity/image-recognition.png)
- [情感分析](docs/ui-reference/high-fidelity/sentiment-analysis.png)
- [文案生成](docs/ui-reference/high-fidelity/text-generation.png)
- [博物馆图像理解](docs/ui-reference/high-fidelity/museum-vision.png)
- [历史记录](docs/ui-reference/high-fidelity/history-and-project.png)

## 相关文档

- [技术总览](docs/architecture/technical-overview.md)
- [后端说明](backend/README.md)
- [OpenAPI 快照](docs/api/openapi.json)

## 可选能力

- 如果配置 `DEEPSEEK_API_KEY`，文本生成和情感分析可以自动优先走 DeepSeek，再在异常时回退到本地逻辑。
- 如果需要容器化运行，可以直接使用根目录的 `docker-compose.yml` 与 `deploy/docker/`。
