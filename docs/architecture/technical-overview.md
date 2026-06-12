# 技术总览

## 项目定位

多模态 AI 课程成果平台是一个可运行的全栈演示项目，用统一的 Web 界面承载多种 AI 实验能力，而不是把每个实验分散成独立脚本或孤立页面。

当前实现重点有三类：

- 用统一壳层承载 6 个页面和共享导航体验
- 用真实后端接口替代纯前端 mock
- 用自动化验证确保演示链路可以稳定复现

## 架构结构

```text
web (React + TypeScript + Vite)
  -> request typed client
  -> FastAPI backend
  -> SQLite history storage
  -> local datasets / runtime caches
```

### 前端

- `web/` 采用按功能拆分的结构，页面与共享能力分离。
- `web/src/shared/api/` 通过生成的 OpenAPI 合同消费后端接口，减少手写路径和类型漂移。
- 共享壳层负责导航、页面上下文和全局搜索，各页面只处理自身业务逻辑。

### 后端

- `backend/app/api/` 提供页面所需的 HTTP 接口。
- `backend/app/services/` 负责推理、数据整形、导出和运行时缓存逻辑。
- `backend/app/schemas/` 统一定义请求与响应模型，作为前后端合同基础。
- `backend/app/db.py` 使用 SQLite 持久化历史记录。

## 主要业务链路

### 图像识别

- 前端上传图片
- 后端读取课程图像样本
- 训练或复用轻量分类器
- 返回类别、概率和说明信息

### 情感分析

- 前端提交文本
- 后端优先走 DeepSeek 或本地词典分析
- 返回情绪标签、置信度、关键词和解释信息

### 文案生成

- 前端提交主题、风格和类型
- 后端按 provider 选择 DeepSeek 或本地模板生成
- 返回多条可展示结果并写入历史记录

### 博物馆图像理解

- 前端上传图像
- 后端做特征匹配和文本信息整合
- 返回来源识别、描述与标签结果

## 运行时优化

- 中药分类器缓存到 `backend/var/herbal-classifier.pkl`
- 博物馆特征索引缓存到 `backend/var/museum-feature-index.pkl`
- 通过 `/api/v1/runtime-assets` 和 `/api/v1/runtime-assets/warmup` 提供状态查询与主动预热

这让本地首次演示之后的后续请求更稳定，也更接近真实产品的运行体验。

## 验证方式

项目默认提供三层验证：

- `web`：`lint`、组件测试、生产构建
- `backend`：`pytest` 与合同同步校验
- 浏览器级：Playwright smoke 流程

推荐入口：

```bash
./init.sh
```

如果需要继续执行浏览器级回归：

```bash
./init.sh e2e
```

## 对外阅读建议

- 想先看产品能力：阅读根目录 `README.md`
- 想先看接口：打开 `docs/api/openapi.json`
- 想先看页面效果：浏览 `docs/ui-reference/high-fidelity/`
