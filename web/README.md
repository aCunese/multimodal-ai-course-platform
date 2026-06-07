# 多模态 AI 课程成果平台 Web

当前前端已经从“仅有原型与 Stitch 静态稿”的状态，整理成一个可运行的 `React + TypeScript + Vite` 应用。

## 当前目录

```text
web/
├── public/
├── src/
│   ├── app/
│   ├── assets/
│   │   ├── branding/
│   │   ├── hero/
│   │   └── illustrations/
│   ├── features/
│   ├── mocks/
│   ├── shared/
│   └── styles/
├── package.json
└── vite.config.ts
```

## 已完成内容

- 建立 6 个页面路由：
  - `/`
  - `/image-recognition`
  - `/sentiment-analysis`
  - `/text-generation`
  - `/museum-vision`
  - `/history`
- 把根目录散落的运行时素材归档到 `src/assets/`。
- 统一左侧导航、顶部工具条、卡片样式、状态标签和 mock 数据结构。
- 以 `../docs/ui-reference/high-fidelity/` 为主要视觉基准重建页面结构。

## 启动方式

```bash
npm install
npm run dev
```

## 构建与检查

```bash
npm run build
npm run lint
```

## 说明

- `docs/ui-reference/high-fidelity/` 是最终视觉基准。
- `docs/ui-reference/html-reference/` 中的 HTML 只作为结构参考，不作为生产代码直接继承。
- 当前页面仍以演示级 mock 数据为主，后续可继续接入真实上传、模型推理和历史记录接口。
