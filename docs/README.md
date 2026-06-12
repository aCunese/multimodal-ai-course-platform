# 文档总览

`docs/` 只保留这个公开仓库里真正有长期价值的说明材料，重点是帮助阅读者快速理解项目结构、接口和界面设计。

## 目录职责

- `api/`
  - 后端导出的 OpenAPI 快照，方便快速浏览接口合同。
- `architecture/`
  - 对外可读的技术总览，说明前后端结构、数据流和验证方式。
- `ui-reference/`
  - 六个页面的高保真界面参考图，帮助快速建立产品印象。

## 阅读顺序

1. 先看根目录 `README.md`，快速了解项目范围和运行方式。
2. 再看 `architecture/technical-overview.md`，理解实现结构。
3. 如果想看接口边界，打开 `api/openapi.json`。
4. 如果想先看视觉效果，直接浏览 `ui-reference/high-fidelity/`。
