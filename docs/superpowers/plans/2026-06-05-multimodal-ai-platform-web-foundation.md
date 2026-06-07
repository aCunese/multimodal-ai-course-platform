# Multimodal AI Course Platform Web Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a normalized `web/` application that turns six scattered prototype screens into one runnable React frontend with shared layout, clear routing, and mock-driven module pages.

**Architecture:** The implementation uses a single Vite-based React + TypeScript app under `web/`, organized by feature folders and shared layout primitives. The six Chinese high-fidelity screens in `docs/ui-reference/high-fidelity/` remain the visual source of truth, while the HTML files in `docs/source-assets/stitch-2/` are used only as structural references during the rebuild.

**Tech Stack:** React, TypeScript, Vite, React Router, Tailwind CSS, CSS variables, Vitest, React Testing Library

---

## File Structure

### New application structure

```text
web/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── assets/
│   │   ├── icons/
│   │   ├── illustrations/
│   │   └── logos/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── image-recognition/
│   │   ├── sentiment-analysis/
│   │   ├── text-generation/
│   │   ├── museum-vision/
│   │   └── history/
│   ├── mocks/
│   ├── shared/
│   │   ├── charts/
│   │   ├── constants/
│   │   ├── layout/
│   │   ├── lib/
│   │   ├── types/
│   │   └── ui/
│   └── styles/
│       ├── globals.css
│       └── tokens.css
└── src/**/*.test.tsx
```

### Responsibility map

- `web/src/app/`
  - Application bootstrap, providers, and router assembly.
- `web/src/shared/layout/`
  - Sidebar, topbar, app shell, and page container.
- `web/src/shared/ui/`
  - Reusable card, button, badge, table, and dropzone primitives.
- `web/src/shared/charts/`
  - Confidence ring, probability bars, sentiment meter, and sparklines.
- `web/src/features/*`
  - One folder per page-level feature.
- `web/src/mocks/`
  - Transitional mock data and fake service results before backend integration.

---

### Task 1: Scaffold The `web/` Application

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/app/main.tsx`
- Create: `web/src/app/App.tsx`
- Create: `web/src/app/providers.tsx`
- Create: `web/src/app/router.tsx`
- Test: `web/src/app/router.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { appRoutes } from "./router";

test("renders the dashboard route at root", async () => {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: ["/"],
  });

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "首页总览" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- --runInBand src/app/router.test.tsx`
Expected: FAIL with module resolution errors because `router.tsx`, `DashboardPage`, or test setup is not created yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
// web/src/app/App.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// web/src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../shared/layout/AppLayout";
import { DashboardPage } from "../features/dashboard/page";

export const appRoutes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
];

export const router = createBrowserRouter(appRoutes);
```

```tsx
// web/src/app/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "../styles/tokens.css";
import "../styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- --runInBand src/app/router.test.tsx`
Expected: PASS and the test finds the `首页总览` heading.

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/tsconfig.json web/vite.config.ts web/index.html web/src/app
git commit -m "feat: scaffold web application shell"
```

### Task 2: Build Shared Layout And Design Tokens

**Files:**
- Create: `web/src/styles/tokens.css`
- Create: `web/src/styles/globals.css`
- Create: `web/src/shared/constants/navigation.ts`
- Create: `web/src/shared/layout/AppLayout.tsx`
- Create: `web/src/shared/layout/Sidebar.tsx`
- Create: `web/src/shared/layout/Topbar.tsx`
- Create: `web/src/shared/ui/BaseCard.tsx`
- Test: `web/src/shared/layout/AppLayout.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "./AppLayout";

test("renders the shared navigation labels", () => {
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );

  expect(screen.getByText("首页总览")).toBeInTheDocument();
  expect(screen.getByText("图像识别")).toBeInTheDocument();
  expect(screen.getByText("情感分析")).toBeInTheDocument();
  expect(screen.getByText("文案生成")).toBeInTheDocument();
  expect(screen.getByText("博物馆图像识别 / 描述")).toBeInTheDocument();
  expect(screen.getByText("历史记录与项目说明")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- --runInBand src/shared/layout/AppLayout.test.tsx`
Expected: FAIL because `AppLayout` and its child layout components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// web/src/shared/constants/navigation.ts
export const navigationItems = [
  { to: "/", label: "首页总览" },
  { to: "/image-recognition", label: "图像识别" },
  { to: "/sentiment-analysis", label: "情感分析" },
  { to: "/text-generation", label: "文案生成" },
  { to: "/museum-vision", label: "博物馆图像识别 / 描述" },
  { to: "/history", label: "历史记录与项目说明" },
];
```

```tsx
// web/src/shared/layout/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

```css
/* web/src/styles/tokens.css */
:root {
  --bg: #f6f8fc;
  --surface: #ffffff;
  --border: #e5e7eb;
  --text: #111827;
  --text-muted: #64748b;
  --primary: #2563eb;
  --primary-deep: #4f46e5;
  --accent: #7c3aed;
  --success: #16a34a;
  --warning: #f59e0b;
  --danger: #ef4444;
  --sidebar-width: 240px;
  --radius-card: 20px;
  --shadow-card: 0 12px 32px rgba(15, 23, 42, 0.06);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- --runInBand src/shared/layout/AppLayout.test.tsx`
Expected: PASS and all six navigation labels are rendered.

- [ ] **Step 5: Commit**

```bash
git add web/src/styles web/src/shared/constants web/src/shared/layout web/src/shared/ui
git commit -m "feat: add shared layout and visual tokens"
```

### Task 3: Add Shared Types And Mock Service Layer

**Files:**
- Create: `web/src/shared/types/history.ts`
- Create: `web/src/shared/types/module.ts`
- Create: `web/src/mocks/dashboard.ts`
- Create: `web/src/mocks/image-recognition.ts`
- Create: `web/src/mocks/sentiment-analysis.ts`
- Create: `web/src/mocks/text-generation.ts`
- Create: `web/src/mocks/museum-vision.ts`
- Create: `web/src/mocks/history.ts`
- Create: `web/src/features/*/service.ts`
- Test: `web/src/mocks/history.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { historyRecords } from "./history";

test("exposes unified history records for all four AI modules", () => {
  const modules = new Set(historyRecords.map((item) => item.module));

  expect(modules.has("image-recognition")).toBe(true);
  expect(modules.has("sentiment-analysis")).toBe(true);
  expect(modules.has("text-generation")).toBe(true);
  expect(modules.has("museum-vision")).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- --runInBand src/mocks/history.test.ts`
Expected: FAIL because the mock files and shared type definitions do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// web/src/shared/types/history.ts
export type HistoryModule =
  | "image-recognition"
  | "sentiment-analysis"
  | "text-generation"
  | "museum-vision";

export interface HistoryRecord {
  id: string;
  createdAt: string;
  module: HistoryModule;
  inputLabel: string;
  outputLabel: string;
  scoreText: string;
  status: "success" | "warning" | "error";
}
```

```ts
// web/src/mocks/history.ts
import type { HistoryRecord } from "../shared/types/history";

export const historyRecords: HistoryRecord[] = [
  {
    id: "#1024",
    createdAt: "2026-06-05 14:25",
    module: "image-recognition",
    inputLabel: "cat.jpg",
    outputLabel: "Cat",
    scoreText: "92.8%",
    status: "success",
  },
  {
    id: "#1023",
    createdAt: "2026-06-05 14:18",
    module: "sentiment-analysis",
    inputLabel: "IMDB 评论",
    outputLabel: "Positive",
    scoreText: "88.4%",
    status: "success",
  },
  {
    id: "#1022",
    createdAt: "2026-06-05 13:55",
    module: "text-generation",
    inputLabel: "AI 课程展示",
    outputLabel: "已生成 3 条",
    scoreText: "92%",
    status: "success",
  },
  {
    id: "#1021",
    createdAt: "2026-06-05 13:35",
    module: "museum-vision",
    inputLabel: "museum_01.jpg",
    outputLabel: "古代青铜器",
    scoreText: "90.1%",
    status: "success",
  },
];
```

```ts
// example: web/src/features/image-recognition/service.ts
import { imageRecognitionMock } from "../../mocks/image-recognition";

export async function getImageRecognitionResult() {
  return imageRecognitionMock;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- --runInBand src/mocks/history.test.ts`
Expected: PASS and the mock history includes all required module types.

- [ ] **Step 5: Commit**

```bash
git add web/src/shared/types web/src/mocks web/src/features/*/service.ts
git commit -m "feat: add shared mock data contracts"
```

### Task 4: Implement Dashboard Page

**Files:**
- Create: `web/src/features/dashboard/page.tsx`
- Create: `web/src/features/dashboard/components/HeroBanner.tsx`
- Create: `web/src/features/dashboard/components/FeatureGrid.tsx`
- Create: `web/src/features/dashboard/components/StatsGrid.tsx`
- Create: `web/src/features/dashboard/components/RecentRunsTable.tsx`
- Test: `web/src/features/dashboard/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./page";

test("renders the dashboard hero and four feature cards", () => {
  render(<DashboardPage />);

  expect(screen.getByRole("heading", { name: "首页总览" })).toBeInTheDocument();
  expect(screen.getByText("图像识别")).toBeInTheDocument();
  expect(screen.getByText("情感分析")).toBeInTheDocument();
  expect(screen.getByText("文案生成")).toBeInTheDocument();
  expect(screen.getByText("博物馆图像理解")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- --runInBand src/features/dashboard/page.test.tsx`
Expected: FAIL because the dashboard page and its components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
// web/src/features/dashboard/page.tsx
import { HeroBanner } from "./components/HeroBanner";
import { FeatureGrid } from "./components/FeatureGrid";
import { StatsGrid } from "./components/StatsGrid";
import { RecentRunsTable } from "./components/RecentRunsTable";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">首页总览</h1>
        <p className="text-slate-500">探索多模态 AI 能力，体验前沿技术与课程成果展示。</p>
      </header>
      <HeroBanner />
      <FeatureGrid />
      <StatsGrid />
      <RecentRunsTable />
    </div>
  );
}
```

```tsx
// web/src/features/dashboard/components/FeatureGrid.tsx
const items = ["图像识别", "情感分析", "文案生成", "博物馆图像理解"];

export function FeatureGrid() {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item} className="rounded-[20px] border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">{item}</h2>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- --runInBand src/features/dashboard/page.test.tsx`
Expected: PASS and the hero heading plus four feature cards render.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/dashboard
git commit -m "feat: implement dashboard page"
```

### Task 5: Implement Image Recognition And Sentiment Analysis Pages

**Files:**
- Create: `web/src/features/image-recognition/page.tsx`
- Create: `web/src/features/image-recognition/components/*.tsx`
- Create: `web/src/features/sentiment-analysis/page.tsx`
- Create: `web/src/features/sentiment-analysis/components/*.tsx`
- Modify: `web/src/app/router.tsx`
- Test: `web/src/features/image-recognition/page.test.tsx`
- Test: `web/src/features/sentiment-analysis/page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { ImageRecognitionPage } from "./page";

test("renders image recognition result summary", () => {
  render(<ImageRecognitionPage />);

  expect(screen.getByRole("heading", { name: "图像识别" })).toBeInTheDocument();
  expect(screen.getByText("识别结果")).toBeInTheDocument();
  expect(screen.getByText("分类概率分布")).toBeInTheDocument();
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { SentimentAnalysisPage } from "./page";

test("renders sentiment result and keyword analysis", () => {
  render(<SentimentAnalysisPage />);

  expect(screen.getByRole("heading", { name: "情感分析" })).toBeInTheDocument();
  expect(screen.getByText("情感结果")).toBeInTheDocument();
  expect(screen.getByText("关键词分析")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npm test -- --runInBand src/features/image-recognition/page.test.tsx src/features/sentiment-analysis/page.test.tsx`
Expected: FAIL because the feature pages are not created yet and the routes are incomplete.

- [ ] **Step 3: Write minimal implementation**

```tsx
// web/src/features/image-recognition/page.tsx
export function ImageRecognitionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">图像识别</h1>
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[20px] border bg-white p-6">图片上传区</article>
        <article className="rounded-[20px] border bg-white p-6">识别结果</article>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[20px] border bg-white p-6">分类概率分布</article>
        <article className="rounded-[20px] border bg-white p-6">模型信息</article>
      </section>
    </div>
  );
}
```

```tsx
// web/src/features/sentiment-analysis/page.tsx
export function SentimentAnalysisPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">情感分析</h1>
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[20px] border bg-white p-6">文本输入区</article>
        <article className="rounded-[20px] border bg-white p-6">情感结果</article>
      </section>
      <article className="rounded-[20px] border bg-white p-6">关键词分析</article>
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-[20px] border bg-white p-6">情感强度可视化</article>
        <article className="rounded-[20px] border bg-white p-6">分析状态</article>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npm test -- --runInBand src/features/image-recognition/page.test.tsx src/features/sentiment-analysis/page.test.tsx`
Expected: PASS and both pages render their core sections.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/image-recognition web/src/features/sentiment-analysis web/src/app/router.tsx
git commit -m "feat: implement image and sentiment pages"
```

### Task 6: Implement Text Generation And Museum Vision Pages

**Files:**
- Create: `web/src/features/text-generation/page.tsx`
- Create: `web/src/features/text-generation/components/*.tsx`
- Create: `web/src/features/museum-vision/page.tsx`
- Create: `web/src/features/museum-vision/components/*.tsx`
- Modify: `web/src/app/router.tsx`
- Test: `web/src/features/text-generation/page.test.tsx`
- Test: `web/src/features/museum-vision/page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { TextGenerationPage } from "./page";

test("renders generation controls and result area", () => {
  render(<TextGenerationPage />);

  expect(screen.getByRole("heading", { name: "文案生成" })).toBeInTheDocument();
  expect(screen.getByText("生成参数区")).toBeInTheDocument();
  expect(screen.getByText("生成结果区")).toBeInTheDocument();
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { MuseumVisionPage } from "./page";

test("renders museum upload, source result, and description", () => {
  render(<MuseumVisionPage />);

  expect(screen.getByRole("heading", { name: "博物馆图像识别 / 描述" })).toBeInTheDocument();
  expect(screen.getByText("博物馆图片上传与预览")).toBeInTheDocument();
  expect(screen.getByText("来源识别结果")).toBeInTheDocument();
  expect(screen.getByText("图像描述")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npm test -- --runInBand src/features/text-generation/page.test.tsx src/features/museum-vision/page.test.tsx`
Expected: FAIL because those feature modules do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
// web/src/features/text-generation/page.tsx
export function TextGenerationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">文案生成</h1>
      <article className="rounded-[20px] border bg-white p-6">生成参数区</article>
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-[20px] border bg-white p-6">生成结果区</article>
        <article className="rounded-[20px] border bg-white p-6">生成质量提示</article>
      </section>
      <article className="rounded-[20px] border bg-white p-6">历史生成记录</article>
    </div>
  );
}
```

```tsx
// web/src/features/museum-vision/page.tsx
export function MuseumVisionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">博物馆图像识别 / 描述</h1>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-[20px] border bg-white p-6">博物馆图片上传与预览</article>
        <article className="rounded-[20px] border bg-white p-6">来源识别结果</article>
      </section>
      <article className="rounded-[20px] border bg-white p-6">图像描述</article>
      <article className="rounded-[20px] border bg-white p-6">标签提取</article>
      <article className="rounded-[20px] border bg-white p-6">数据来源说明</article>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npm test -- --runInBand src/features/text-generation/page.test.tsx src/features/museum-vision/page.test.tsx`
Expected: PASS and the sections for both pages render in the right order.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/text-generation web/src/features/museum-vision web/src/app/router.tsx
git commit -m "feat: implement text generation and museum pages"
```

### Task 7: Implement History Page And Project Summary Blocks

**Files:**
- Create: `web/src/features/history/page.tsx`
- Create: `web/src/features/history/components/HistoryFilterBar.tsx`
- Create: `web/src/features/history/components/HistoryTable.tsx`
- Create: `web/src/features/history/components/ProjectSummaryCard.tsx`
- Create: `web/src/features/history/components/TechModuleCards.tsx`
- Create: `web/src/features/history/components/ProjectValueTimeline.tsx`
- Modify: `web/src/app/router.tsx`
- Test: `web/src/features/history/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { HistoryPage } from "./page";

test("renders filters, history table, and project summary", () => {
  render(<HistoryPage />);

  expect(screen.getByRole("heading", { name: "历史记录与项目说明" })).toBeInTheDocument();
  expect(screen.getByText("历史记录筛选区")).toBeInTheDocument();
  expect(screen.getByText("历史记录表格")).toBeInTheDocument();
  expect(screen.getByText("项目说明")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- --runInBand src/features/history/page.test.tsx`
Expected: FAIL because the history feature page and supporting components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
// web/src/features/history/page.tsx
export function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">历史记录与项目说明</h1>
      <article className="rounded-[20px] border bg-white p-6">历史记录筛选区</article>
      <article className="rounded-[20px] border bg-white p-6">历史记录表格</article>
      <article className="rounded-[20px] border bg-white p-6">项目说明</article>
      <section className="grid gap-6 xl:grid-cols-4">
        <article className="rounded-[20px] border bg-white p-6">图像分类模块</article>
        <article className="rounded-[20px] border bg-white p-6">情感分析模块</article>
        <article className="rounded-[20px] border bg-white p-6">文本生成模块</article>
        <article className="rounded-[20px] border bg-white p-6">跨模态图像理解模块</article>
      </section>
      <article className="rounded-[20px] border bg-white p-6">项目价值展示</article>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- --runInBand src/features/history/page.test.tsx`
Expected: PASS and the history page shows filters, table, summary, and module blocks.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/history web/src/app/router.tsx
git commit -m "feat: implement history and project summary page"
```

### Task 8: Final Verification And Documentation Sync

**Files:**
- Modify: `docs/architecture/2026-06-05-multimodal-ai-platform-web-architecture-spec.md`
- Create: `docs/ui-reference/README.md`
- Test: `web/src/app/router.test.tsx`
- Test: `web/src/features/**/*.test.tsx`

- [ ] **Step 1: Write a smoke verification command list**

```txt
1. Dashboard route renders
2. Six navigation labels render
3. Six page headings render
4. Mock history contains all four module types
5. Layout remains stable at desktop width
```

- [ ] **Step 2: Run the verification suite**

Run: `cd web && npm test -- --runInBand`
Expected: PASS across router, layout, mock, and page tests.

- [ ] **Step 3: Write the documentation sync file**

```md
# UI Reference Intake

- Final visual source: `docs/ui-reference/high-fidelity/*.png`
- Chinese design rules: `docs/ui-reference/README.md`
- Intermediate HTML reference: `docs/source-assets/stitch-2/_*/code.html`
- Do not copy raw screenshots into runtime code unless explicitly needed for the UI.
```

- [ ] **Step 4: Run one manual dev check**

Run: `cd web && npm run dev`
Expected: Local development server starts and each route is reachable from the shared sidebar.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture/2026-06-05-multimodal-ai-platform-web-architecture-spec.md docs/ui-reference/README.md
git commit -m "docs: finalize web foundation references"
```

## Self-Review

- Spec coverage: This plan covers the shared layout, routing, six UI pages, mock data normalization, and documentation handoff needed to turn the scattered prototypes into a real frontend project.
- Placeholder scan: No `TODO`, `TBD`, or unresolved file-path placeholders remain in the tasks.
- Type consistency: Route keys, feature folder names, and module identifiers are aligned as `dashboard`, `image-recognition`, `sentiment-analysis`, `text-generation`, `museum-vision`, and `history`.
