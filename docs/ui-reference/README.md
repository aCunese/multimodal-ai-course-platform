# UI 融合说明

这里收纳“多模态 AI 课程成果平台”的统一 UI 参考资产，作用是把 6 个独立页面整理成一个可开发、可维护的单一产品界面体系。

## 视觉基准优先级

1. `high-fidelity/` 中的中文高保真页面
2. 本文档中的页面关系与组件归纳
3. `html-reference/` 中的静态 HTML 结构稿

## 页面映射

| 页面名称 | 最终参考图 | 路由建议 | 页面职责 |
|---|---|---|---|
| 首页总览 | `high-fidelity/dashboard-overview.png` | `/` | 展示平台总览、模块入口、实验统计、最近记录 |
| 图像识别 | `high-fidelity/image-recognition.png` | `/image-recognition` | 图片上传、分类结果、概率分布、模型信息 |
| 情感分析 | `high-fidelity/sentiment-analysis.png` | `/sentiment-analysis` | 文本输入、情感倾向、关键词分析、强度可视化 |
| 文案生成 | `high-fidelity/text-generation.png` | `/text-generation` | 主题输入、风格筛选、类型切换、结果复用 |
| 博物馆图像识别 / 描述 | `high-fidelity/museum-vision.png` | `/museum-vision` | 来源识别、图像描述、标签提取、数据来源说明 |
| 历史记录与项目说明 | `high-fidelity/history-and-project.png` | `/history` | 历史表格、筛选、模块介绍、项目价值展示 |

## 融合后的统一设计规则

- 左侧导航固定为 6 个一级页面，顺序保持一致。
- 顶部区域统一包含搜索、导出、项目说明和用户信息。
- 页面内容统一采用“大卡片 + 柔和阴影 + 蓝紫渐变按钮”的组件体系。
- 所有模块的状态信息统一使用标签或圆点状态表达，如 `成功`、`警告`、`失败`、`可演示`。
- 历史记录页作为所有模块的公共归档出口，避免每个模块单独维护一套记录展示逻辑。

## 共享组件建议

- `AppSidebar`
- `AppTopbar`
- `PageHeader`
- `MetricCard`
- `ModuleEntryCard`
- `StatusBadge`
- `DataTable`
- `UploadPanel`
- `ResultCard`
- `ProgressBar`
- `ConfidenceRing`
- `KeywordChip`

## 数据层建议

6 个页面虽然看起来独立，但应共用同一套任务记录模型：

```ts
type ModuleType =
  | "dashboard"
  | "image-recognition"
  | "sentiment-analysis"
  | "text-generation"
  | "museum-vision";

type HistoryRecord = {
  id: string;
  module: ModuleType;
  inputSummary: string;
  outputSummary: string;
  confidence?: number;
  status: "success" | "warning" | "error";
  createdAt: string;
};
```

这样首页、模块页、历史页都可以从同一组 mock 数据或接口结果派生。

## 参考稿说明

- `high-fidelity/`
  - 6 张最终中文高保真页面，后续开发直接对齐这里。
- `html-reference/reference-01` 到 `reference-06`
  - 从历史 `stitch 2` 稿件中整理出来的静态页面结构，仅作布局和样式拆解参考。
- `../source-assets/`
  - 保留原始导入素材与历史稿，当前目录则只保留面向开发的整理版参考文件。
