# 容器化交付说明

当课程提交清单要求提供“项目源代码压缩包、虚拟机压缩包”时，如果当前机器没有现成虚拟机环境，可以改为提交：

1. `项目源代码压缩包`
2. `容器化运行压缩包`

本项目已经补齐 Docker Compose 交付链路，容器包用于替代传统虚拟机镜像，便于老师或验收方在任意装有 Docker Desktop 的机器上直接复现运行环境。

## 交付物组成

- `docker-compose.yml`
- `deploy/docker/backend.Dockerfile`
- `deploy/docker/frontend.Dockerfile`
- `deploy/docker/nginx.conf`
- `.dockerignore`
- `scripts/package_submission_bundles.sh`

## 运行前提

- 已安装 Docker Desktop，且 `docker compose` 命令可用。
- 如果只使用本地算法演示，不需要额外配置 API Key。
- 如果希望文案生成或情感分析优先接入 DeepSeek，可在启动前设置环境变量：

```bash
export DEEPSEEK_API_KEY="你的密钥"
export MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek
export MULTIMODAL_SENTIMENT_PROVIDER=deepseek
```

## 本地启动步骤

在项目根目录执行：

```bash
docker compose up --build
```

启动完成后访问：

- 前端页面：[http://localhost:8080](http://localhost:8080)
- 后端接口文档：[http://localhost:8000/docs](http://localhost:8000/docs)

## 停止与清理

停止容器：

```bash
docker compose down
```

如果需要连同历史数据库和运行时缓存一起清理：

```bash
docker compose down -v
```

## 建议提交方式

如果老师或答辩组明确写了“虚拟机压缩包”，但实际只需要一个可复现实验环境，可以附上简短说明：

> 由于当前提交环境未提供独立虚拟机镜像，本项目改为提供 Docker Compose 容器化运行包。解压后执行 `docker compose up --build` 即可复现与本地演示一致的前后端环境。

## 一键生成压缩包

项目根目录已经提供脚本：

```bash
./scripts/package_submission_bundles.sh
```

执行后会在 `output/submission/` 下生成：

- `源码压缩包.zip`
- `容器化运行压缩包.zip`

其中容器化运行压缩包默认只包含容器交付所需文件，适合作为“虚拟机压缩包”的替代提交件。
