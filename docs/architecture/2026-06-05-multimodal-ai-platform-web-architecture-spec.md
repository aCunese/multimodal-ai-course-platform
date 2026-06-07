# 多模态 AI 课程成果平台 Web 架构与目录规范

## 1. 文档目的

这份文档用于确定当前项目后续 Web 开发的统一基线，解决两个问题：

1. 当前项目同时存在“面向开发的整理版参考资产”和“面向存档的原始素材”，需要明确唯一的开发基准。
2. 历史 `stitch 2` 页面是 6 个相互独立的静态 HTML，不适合直接当作后续开发工程继续堆叠。

结论先写在前面：

- 最终视觉基准以 `docs/ui-reference/high-fidelity/` 的 6 张中文高保真页面为准。
- 页面结构说明以 `docs/ui-reference/README.md` 为主文档。
- `docs/source-assets/stitch-2/_1` 到 `docs/source-assets/stitch-2/_6` 的 `code.html` 只作为结构参考和局部样式参考，不作为生产代码直接继承。
- 后续应新建并维护一个真正可运行的 `web/` 前端工程，再把 6 个页面按模块化方式重建进去。

---

## 2. 当前资产分析

### 2.1 当前项目目录现状

当前仓库中的正式工程目录是 `multimodal-ai-course-platform`，主要包含以下几类内容：

- `data/experiments/`
  - 课程实验数据，已按 3 个实验方向归档。
- `docs/ui-reference/`
  - 当前开发直接对照的高保真参考图与 HTML 整理稿。
- `docs/source-assets/`
  - 根目录旧素材迁入后的原始存档区。
- `web/`
  - 已初始化的前端工程。
- `backend/`
  - 预留的后端接口目录。

当前状态说明：

- 现在已经有统一的 `web/` 应用目录和基础文档结构。
- 但设计参考、原始素材、正式代码仍需要明确分层使用边界。
- 因此本文档的重点从“是否要建工程”调整为“如何长期保持工程、文档和素材职责清晰”。

### 2.2 `docs/source-assets/stitch-2/` 现状

`docs/source-assets/stitch-2/` 包含以下素材：

- `docs/source-assets/stitch-2/_1/code.html`
- `docs/source-assets/stitch-2/_2/code.html`
- `docs/source-assets/stitch-2/_3/code.html`
- `docs/source-assets/stitch-2/_4/code.html`
- `docs/source-assets/stitch-2/_5/code.html`
- `docs/source-assets/stitch-2/_6/code.html`
- `docs/source-assets/stitch-2/luminous_ai_intelligence/DESIGN.md`

它的优点：

- 已经把 6 个页面的视觉方向做出了初步探索。
- 使用了统一的 Tailwind 风格 token。
- 部分布局结构和卡片层级有参考价值。

它的主要问题：

- 6 个页面是彼此独立的静态 HTML 文件，代码大量重复。
- 使用 Tailwind CDN 和内联 `tailwind.config`，不适合持续开发。
- 页面中英文混杂，品牌名仍是 `Luminous AI`，与最终中文平台定位不一致。
- 没有真正的路由、状态管理、数据层、组件拆分。
- 没有统一资源管理方式，难以维护。

因此它应当被视为“中间过程稿”，不能直接当作最终工程。

### 2.3 高保真原型现状

当前高保真原型分为两层：

- `docs/ui-reference/high-fidelity/*.png`
  - 当前开发直接使用的整理版参考图。
- `docs/source-assets/high-fidelity-originals/*.png`
  - 原始导入文件，保留原命名用于溯源。
- `docs/ui-reference/README.md`
  - 当前维护的页面结构、组件建议与参考优先级说明。

这套稿的价值最高，原因有三个：

- 已经切换为中文产品语境，符合课程答辩展示。
- 六个页面的导航、标题、视觉语言已经统一。
- `docs/ui-reference/README.md` 已经补充了路由、组件建议与统一设计规则。

---

## 3. 最终设计基准优先级

后续所有前端开发按以下优先级执行：

1. `docs/ui-reference/high-fidelity/*.png`
2. `docs/ui-reference/README.md`
3. 本文档
4. `docs/source-assets/stitch-2/luminous_ai_intelligence/DESIGN.md`
5. `docs/source-assets/stitch-2/_*/code.html`

换句话说：

- 页面最终长相看 `docs/ui-reference/high-fidelity/`。
- 结构和模块边界看 `docs/ui-reference/README.md` 与本文档。
- `docs/source-assets/stitch-2/` 只用于复用局部 spacing、卡片层次、按钮样式思路。

---

## 4. 推荐技术框架

## 4.1 前端框架

推荐：

- `React`
- `TypeScript`
- `Vite`
- `React Router`
- `Tailwind CSS`
- `Vitest + React Testing Library`

选择理由：

- `stitch 2` 的现有 HTML 很容易拆成 React 组件。
- `TypeScript` 适合把六个模块的数据结构一次性规范好。
- `Vite` 足够轻，适合课程项目和原型快速迭代。
- `React Router` 能自然承接 6 个页面。
- `Tailwind CSS` 能把当前卡片式、渐变、边框、间距体系快速落地。
- `Vitest` 足够轻量，适合做页面级冒烟测试。

不建议当前阶段直接上：

- `Next.js`
  - 当前项目没有 SSR 需求，也没有内容站和 SEO 优先级。
- 重型 UI 库
  - 会削弱你这套页面已经形成的定制化风格。
- 图表大库
  - 现有图表主要是进度条、仪表环、强度条、小型统计卡，优先用 SVG/CSS 自绘即可。

## 4.2 后端框架

推荐：

- `FastAPI`
- `Pydantic`
- `SQLite`

选择理由：

- 课程实验数据和模型脚本大概率都在 Python 生态里更容易接起来。
- `FastAPI` 适合快速封装图片上传、文本分析、生成结果和历史记录接口。
- `SQLite` 足以支撑答辩演示版的历史记录与任务日志。

## 4.3 前后端协作策略

推荐使用“前端先 mock，后端再接入”的模式：

1. 先把 `web/` 页面全部跑通，所有结果先使用本地 mock 数据。
2. 再为每个模块定义 API contract。
3. 后续再把真实模型推理或课程实验脚本接到 FastAPI。

这样可以避免一开始就被模型接入和环境问题拖慢界面开发。

---

## 5. 页面与路由规范

建议统一采用以下 6 个页面：

| 页面 | 路由 | feature 目录名 | 设计基准 |
|---|---|---|---|
| 首页总览 | `/` | `dashboard` | `docs/ui-reference/high-fidelity/dashboard-overview.png` |
| 图像识别 | `/image-recognition` | `image-recognition` | `docs/ui-reference/high-fidelity/image-recognition.png` |
| 情感分析 | `/sentiment-analysis` | `sentiment-analysis` | `docs/ui-reference/high-fidelity/sentiment-analysis.png` |
| 文案生成 | `/text-generation` | `text-generation` | `docs/ui-reference/high-fidelity/text-generation.png` |
| 博物馆图像识别 / 描述 | `/museum-vision` | `museum-vision` | `docs/ui-reference/high-fidelity/museum-vision.png` |
| 历史记录与项目说明 | `/history` | `history` | `docs/ui-reference/high-fidelity/history-and-project.png` |

命名约束：

- UI 展示文案可以是中文。
- 路由、文件夹、类型名统一用英文 kebab-case 或 camelCase。
- 平台品牌统一使用 `多模态 AI 课程成果平台`，不再继续使用 `Luminous AI`。

---

## 6. 目录规范

## 6.1 仓库层级规范

建议最终把整个项目整理成下面这套结构：

```text
multimodal-ai-course-platform/
├── backend/
├── data/
│   └── experiments/
├── docs/
│   ├── architecture/
│   ├── course-materials/
│   ├── source-assets/
│   ├── superpowers/
│   │   └── plans/
│   └── ui-reference/
├── scripts/
├── web/
└── README.md
```

说明：

- `docs/architecture/`
  - 放当前这类架构规范文档。
- `docs/source-assets/`
  - 放原始导入素材和历史参考稿，供追溯与查阅。
- `docs/ui-reference/`
  - 放开发直接对照的截图说明、页面对照图与参考整理稿，不进入运行时代码。
- `docs/course-materials/`
  - 放课程模板、提交说明等交付资料。
- `scripts/`
  - 放项目内部工具脚本，例如课程文档生成器。
- `web/`
  - 真正的前端工程目录。
- `backend/`
  - 后续统一封装模型接口。

## 6.2 `web/` 工程目录规范

推荐目录：

```text
web/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── assets/
│   │   ├── icons/
│   │   ├── logos/
│   │   └── illustrations/
│   ├── shared/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── lib/
│   │   ├── constants/
│   │   └── types/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── image-recognition/
│   │   ├── sentiment-analysis/
│   │   ├── text-generation/
│   │   ├── museum-vision/
│   │   └── history/
│   ├── mocks/
│   └── styles/
│       ├── globals.css
│       └── tokens.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 6.2.1 `shared/` 的责任

- `layout/`
  - `AppLayout`
  - `Sidebar`
  - `Topbar`
  - `ContentShell`
- `ui/`
  - `BaseCard`
  - `SectionTitle`
  - `PrimaryButton`
  - `SecondaryButton`
  - `StatusBadge`
  - `UploadDropzone`
  - `DataTable`
  - `TagChip`
- `charts/`
  - `ConfidenceRing`
  - `ProbabilityBars`
  - `SentimentMeter`
  - `Sparkline`
- `constants/`
  - 菜单、状态色、模块映射、顶部按钮配置
- `types/`
  - 跨 feature 共享类型

### 6.2.2 `features/` 的责任

每个业务模块都按同样结构组织，避免以后越来越乱：

```text
features/image-recognition/
├── components/
├── page.tsx
├── mock.ts
├── service.ts
└── types.ts
```

说明：

- `page.tsx`
  - 页面入口，负责装配。
- `components/`
  - 只放该模块自己使用的卡片和子组件。
- `mock.ts`
  - 当前阶段演示数据。
- `service.ts`
  - 后续替换为真实 API 调用的位置。
- `types.ts`
  - 只定义该模块自己的类型。

---

## 7. 组件拆分建议

## 7.1 全局组件

必须复用的组件：

- `AppLayout`
- `Sidebar`
- `Topbar`
- `BaseCard`
- `PageHeader`
- `PrimaryButton`
- `SecondaryButton`
- `GhostButton`
- `StatusBadge`
- `MetricCard`
- `SectionTitle`
- `TagChip`
- `UploadDropzone`
- `EmptyPlaceholder`

## 7.2 图表类组件

建议做成独立组件：

- `ConfidenceRing`
  - 图像识别右侧圆环置信度
- `ProbabilityBars`
  - 图像识别和博物馆来源概率条
- `SentimentMeter`
  - 情感强度滑尺
- `QualityBars`
  - 文案生成质量评分
- `Sparkline`
  - 首页小趋势图

## 7.3 页面专属组件

### 首页总览

- `HeroBanner`
- `FeatureModuleCard`
- `StatsOverviewGrid`
- `RecentRunsTable`

### 图像识别

- `ImageUploadPanel`
- `RecognitionSummaryCard`
- `RecognitionExplanationCard`
- `ModelInfoCard`

### 情感分析

- `SentimentInputPanel`
- `SentimentSummaryCard`
- `KeywordAnalysisPanel`
- `AnalysisStatusCard`

### 文案生成

- `GenerationFormPanel`
- `GenerationResultCard`
- `GenerationQualityPanel`
- `GenerationHistoryTable`

### 博物馆图像识别 / 描述

- `MuseumUploadPanel`
- `MuseumSourceRankingCard`
- `MuseumDescriptionCard`
- `MuseumTagPanel`
- `DatasetSourceCard`

### 历史记录与项目说明

- `HistoryFilterBar`
- `HistoryTable`
- `ProjectSummaryCard`
- `TechModuleCards`
- `ProjectValueTimeline`

---

## 8. 数据层规范

## 8.1 当前阶段策略

第一阶段不要直接从真实模型取数，而是先用 `mock.ts` 数据。

推荐每个 feature 都有一个 `service.ts`，即使里面暂时只是：

```ts
export async function getImageRecognitionResult() {
  return imageRecognitionMock;
}
```

这样后面接 FastAPI 时，只改 `service.ts`，不改页面组件。

## 8.2 推荐接口边界

后续后端接口可以按下面拆：

- `POST /api/image-recognition/predict`
- `POST /api/sentiment-analysis/predict`
- `POST /api/text-generation/generate`
- `POST /api/museum-vision/analyze`
- `GET /api/history`
- `GET /api/project-summary`

## 8.3 历史记录统一类型

建议用统一结构，避免每个页面各写一套：

```ts
type HistoryModule =
  | "image-recognition"
  | "sentiment-analysis"
  | "text-generation"
  | "museum-vision";

interface HistoryRecord {
  id: string;
  createdAt: string;
  module: HistoryModule;
  inputLabel: string;
  outputLabel: string;
  scoreText: string;
  status: "success" | "warning" | "error";
}
```

---

## 9. 样式与视觉规则

## 9.1 视觉方向

最终界面采用：

- 浅色科技风
- 蓝紫渐变作为主交互色
- 大圆角白卡片
- 柔和阴影
- 以中文产品语境为主

### 保留内容

- 首页深色 Hero 区
- 卡片式模块结构
- 左侧固定导航
- 顶部搜索与操作栏
- 各模块的轻量数据可视化

### 必须统一的内容

- 品牌名统一为中文平台名
- 页面标题、导航标题、按钮文案统一中文
- 所有模块统一 240px 左侧导航宽度
- 卡片圆角、边框色、阴影强度统一

## 9.2 Token 规范

可以把 `docs/ui-reference/README.md` 与 `docs/source-assets/stitch-2/luminous_ai_intelligence/DESIGN.md` 中提炼出的颜色体系合并成 CSS variables：

```css
:root {
  --bg: #f6f8fc;
  --surface: #ffffff;
  --surface-muted: #f8faff;
  --border: #e5e7eb;
  --text: #111827;
  --text-muted: #64748b;
  --primary: #2563eb;
  --primary-deep: #4f46e5;
  --accent: #7c3aed;
  --success: #16a34a;
  --warning: #f59e0b;
  --danger: #ef4444;
  --radius-card: 20px;
  --shadow-card: 0 12px 32px rgba(15, 23, 42, 0.06);
}
```

---

## 10. 资产管理规范

## 10.1 设计参考图放哪里

不要把高保真原型原图直接塞进 `web/src/assets/` 里长期使用。

建议：

- 设计参考图保留在仓库文档目录：
  - `docs/ui-reference/`
- 真正页面里要运行的插图、logo、按钮图标再放到：
  - `web/src/assets/illustrations/`
  - `web/src/assets/logos/`

## 10.2 关于你后续补充的图片

你后面继续发图时，按下面规则放置：

- 最终上屏素材
  - 放 `web/src/assets/illustrations/`
- 仅用于对照的原型图
  - 放 `docs/ui-reference/`
- 一时还没有图的位置
  - 页面先保留留白卡片或占位插画，不要为了填满而硬加无关素材

建议新增一个占位组件：

- `IllustrationPlaceholder`

它专门处理“这里之后还要塞图”的情况。

---

## 11. `docs/source-assets/stitch-2` 到正式工程的迁移规则

后续融合时按下面原则处理：

### 直接保留

- 页面大区块划分思路
- 局部卡片层次
- 某些 spacing 和 button 交互风格

### 必须重写

- 所有导航结构
- 顶栏结构
- 重复出现的内联 Tailwind 配置
- 所有静态 HTML 页面壳
- 中英文不统一的品牌和文案

### 禁止做法

- 禁止把 6 个 `code.html` 生硬拼到一个项目里
- 禁止继续使用 CDN Tailwind 当正式工程方案
- 禁止每个页面重复写一套侧边栏和顶栏

---

## 12. 推荐开发阶段

推荐按 4 个阶段推进：

### 阶段 1：工程底座

- 创建 `web/`
- 配好路由
- 配好 layout
- 配好共享 token
- 用 mock 数据跑通 6 个空页面

### 阶段 2：页面复刻

- 先做首页总览
- 再做图像识别
- 再做情感分析
- 再做文案生成
- 再做博物馆图像识别 / 描述
- 最后做历史记录与项目说明

### 阶段 3：假数据到真接口

- 把 `service.ts` 从 mock 改为 FastAPI 调用
- 接图片上传
- 接文本分析
- 接文案生成
- 接历史记录落库

### 阶段 4：答辩打磨

- 调整细节动画
- 替换正式插图
- 增加加载态和错误态
- 检查投屏展示效果

---

## 13. 最终结论

从当前资产来看，最合理的路线不是继续在历史 `stitch 2` 稿件上修补，而是：

1. 以 `docs/ui-reference/high-fidelity/` 为最终设计基准。
2. 以 `docs/source-assets/stitch-2/` 为中间结构参考。
3. 在 `multimodal-ai-course-platform/` 内持续维护规范的 `web/` 工程。
4. 先用 React + TypeScript + Vite + Tailwind CSS 把 6 个页面模块化跑通。
5. 再把课程实验和模型能力通过 FastAPI 接进来。

这样做的好处是：

- 页面结构不会越做越乱。
- 后面你继续给图、补图、换图时，改动会集中在 feature 和 assets 层。
- 后续我再接你给的 `web` 文件夹时，也能直接按这个规范融合，不需要推倒重来。
