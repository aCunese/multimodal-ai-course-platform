import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const projectRoot = path.resolve(webRoot, "..");
const baseUrl = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:5177").replace(/\/$/, "");
const outputDir = process.env.OUTPUT_DIR
  ? path.resolve(process.env.OUTPUT_DIR)
  : path.resolve(projectRoot, "output", "playwright");

const herbalSamplePath = path.resolve(
  projectRoot,
  "data/experiments/experiment-01-herbal-image-classification/dataset/data/huaihua/huaihua_1.jpg",
);
const museumSamplePath = path.resolve(
  projectRoot,
  "data/experiments/experiment-03-museum-multimodal/images/smithsonian/smithsonian_786.jpg",
);
const invalidUploadPath = path.resolve(outputDir, "invalid-upload.txt");
const negativeSentimentText = "This sequel is a flop and feels copied.";
const generatedTheme = `课程答辩展示自动化回归-${Date.now()}`;

function logStep(message) {
  console.log(`[smoke] ${message}`);
}

async function expectVisible(locator, message, timeout = 60000) {
  await locator.waitFor({ state: "visible", timeout });
  const text = (await locator.textContent())?.trim() ?? "";
  assert.ok(text.length > 0, message);
  return text;
}

async function expectHistoryEntry(page, keyword, expectedText) {
  await page.goto(`${baseUrl}/history?keyword=${encodeURIComponent(keyword)}`, {
    waitUntil: "networkidle",
  });
  const row = page.locator("tbody tr").filter({ hasText: keyword }).first();
  await row.waitFor({ state: "visible", timeout: 60000 });
  const rowText = await row.textContent();
  assert.match(rowText ?? "", new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

async function saveDownload(download) {
  const suggestedFilename = download.suggestedFilename();
  const targetPath = path.resolve(outputDir, suggestedFilename);
  await download.saveAs(targetPath);
  return targetPath;
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(invalidUploadPath, "this is not a valid image upload", "utf8");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

try {
  logStep("Verifying dashboard runtime asset warmup");
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await expectVisible(
    page.getByRole("heading", { name: "运行时资源状态" }),
    "Expected dashboard runtime assets panel to render",
  );
  await page.locator(".runtime-asset-card").first().waitFor({ state: "visible", timeout: 60000 });
  await page.getByRole("button", { name: /执行预热|重新预热/ }).click();
  await expectVisible(
    page.locator(".runtime-asset-card").filter({ hasText: "中药分类器缓存" }).getByText("就绪"),
    "Expected herbal runtime cache to become ready after warmup",
  );
  await expectVisible(
    page.locator(".runtime-asset-card").filter({ hasText: "博物馆特征索引缓存" }).getByText("就绪"),
    "Expected museum runtime cache to become ready after warmup",
  );

  logStep("Verifying project report export flow");
  const [reportDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出演示报告" }).click(),
  ]);
  const reportDownloadPath = await saveDownload(reportDownload);
  const reportContent = await fs.readFile(reportDownloadPath, "utf8");
  const reportPayload = JSON.parse(reportContent);
  assert.match(reportDownload.suggestedFilename(), /^multimodal-ai-demo-report-.*\.json$/);
  assert.equal(reportPayload.title, "多模态 AI 课程成果平台演示报告");
  assert.equal(reportPayload.reportVersion, "v1.0");
  assert.equal(reportPayload.pages[0].path, "/");
  assert.equal(reportPayload.dashboard.modules[0].route, "/image-recognition");
  assert.equal(reportPayload.runtimeAssets.assets[0].key, "herbal-classifier");

  logStep("Verifying project delivery bundle export flow");
  const [bundleDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出交付包" }).click(),
  ]);
  const bundleDownloadPath = await saveDownload(bundleDownload);
  assert.match(bundleDownload.suggestedFilename(), /^multimodal-ai-delivery-bundle-.*\.zip$/);
  const bundleListing = execFileSync("unzip", ["-l", bundleDownloadPath], { encoding: "utf8" });
  assert.match(bundleListing, /manifest\.json/);
  assert.match(bundleListing, /project-report\.json/);
  assert.match(bundleListing, /history-records\.csv/);
  assert.match(bundleListing, /runtime-assets\.json/);
  assert.match(bundleListing, /openapi\.json/);
  assert.match(bundleListing, /README\.md/);
  assert.match(bundleListing, /feature_list\.json/);
  assert.match(bundleListing, /progress\.md/);
  assert.match(bundleListing, /session-handoff\.md/);
  assert.match(bundleListing, /architecture\/web-architecture-spec\.md/);
  const manifestContent = execFileSync("unzip", ["-p", bundleDownloadPath, "manifest.json"], {
    encoding: "utf8",
  });
  const manifestPayload = JSON.parse(manifestContent);
  assert.equal(manifestPayload.bundleVersion, "v1.1");
  const manifestFiles = new Map(manifestPayload.files.map((entry) => [entry.path, entry]));
  assert.deepEqual(
    {
      contentType: manifestFiles.get("project-report.json")?.contentType,
      sourceKind: manifestFiles.get("project-report.json")?.sourceKind,
      sourcePath: manifestFiles.get("project-report.json")?.sourcePath,
    },
    {
      contentType: "application/json; charset=utf-8",
      sourceKind: "generated",
      sourcePath: "/api/v1/project-report/export",
    },
  );
  assert.equal(manifestFiles.get("README.md")?.sourceKind, "static");
  assert.equal(manifestFiles.get("README.md")?.sourcePath, "README.md");
  assert.match(manifestFiles.get("README.md")?.sha256 ?? "", /^[0-9a-f]{64}$/);

  logStep("Verifying herbal image recognition upload");
  await page.goto(`${baseUrl}/image-recognition`, { waitUntil: "networkidle" });
  await expectVisible(
    page.getByRole("heading", { name: "党参" }),
    "Expected default herbal classification to load",
  );
  await page.setInputFiles('input[type="file"]', herbalSamplePath);
  await expectVisible(
    page.getByRole("heading", { name: "槐花" }),
    "Expected uploaded herbal image to classify as Huaihua",
  );

  logStep("Verifying invalid herbal upload feedback");
  await page.setInputFiles('input[type="file"]', invalidUploadPath);
  await expectVisible(
    page.getByText("上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。"),
    "Expected invalid upload error message to be shown for non-image payloads",
  );
  await expectVisible(
    page.getByRole("heading", { name: "槐花" }),
    "Expected last successful herbal result to remain visible after invalid upload",
  );
  await expectHistoryEntry(page, "huaihua_1", "槐花");

  logStep("Verifying negative sentiment analysis flow");
  await page.goto(`${baseUrl}/sentiment-analysis`, { waitUntil: "networkidle" });
  await page.locator("textarea").fill(negativeSentimentText);
  await page.getByRole("button", { name: "开始分析" }).click();
  await expectVisible(page.getByText("负面判断", { exact: true }), "Expected negative sentiment label");
  await expectHistoryEntry(page, "flop", "负面");

  logStep("Verifying global search suggestions flow");
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.getByRole("searchbox", { name: "全局搜索" }).fill("flop");
  const firstSearchSuggestion = page.getByRole("button", { name: /情感分析 · 负面/ }).first();
  await expectVisible(
    firstSearchSuggestion,
    "Expected global search to surface the matching history suggestion",
  );
  await firstSearchSuggestion.click();
  await page.waitForURL(/\/history\?keyword=%23/);
  await expectVisible(
    page.locator("tbody tr").filter({ hasText: "负面" }).first(),
    "Expected global search suggestion to navigate to the matching history record",
  );

  logStep("Verifying text generation flow");
  await page.goto(`${baseUrl}/text-generation`, { waitUntil: "networkidle" });
  await page.locator("textarea").fill(generatedTheme);
  await page.getByRole("button", { name: "开始生成" }).click();
  await page.getByRole("cell", { name: generatedTheme, exact: true }).waitFor({
    state: "visible",
    timeout: 60000,
  });
  const generatedResultTitle = await expectVisible(
    page.locator(".generation-result h3").first(),
    "Expected at least one generated text result after successful generation",
  );
  await expectVisible(
    page.getByText("生成结果已来自后端接口，并已写入历史记录。"),
    "Expected successful generation message after text generation request",
  );
  await page.getByRole("cell", { name: generatedTheme, exact: true }).waitFor({
    state: "visible",
    timeout: 60000,
  });

  logStep("Verifying text generation fallback when backend generation fails");
  const generationRoutePattern = /\/api\/v1\/text-generation\/generate$/;
  await page.route(generationRoutePattern, async (route) => {
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "开始生成" }).click();
  await expectVisible(
    page.getByText("文案生成接口暂时不可用，当前保留最近一次生成结果。"),
    "Expected text generation fallback message after aborting backend generation request",
  );
  await expectVisible(
    page.getByRole("heading", { name: generatedResultTitle }),
    "Expected the last successful generated result to remain visible after generation failure",
  );
  await page.unroute(generationRoutePattern);
  await expectHistoryEntry(page, generatedTheme, "已生成 3 条");

  logStep("Verifying museum upload flow");
  await page.goto(`${baseUrl}/museum-vision`, { waitUntil: "networkidle" });
  await page.setInputFiles('input[type="file"]', museumSamplePath);
  await expectVisible(
    page.getByRole("heading", { name: "史密森学会" }),
    "Expected museum upload to match Smithsonian Institution",
  );

  logStep("Verifying museum tag export flow");
  const [museumTagDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出标签" }).click(),
  ]);
  const museumTagDownloadPath = await saveDownload(museumTagDownload);
  const museumTagContent = await fs.readFile(museumTagDownloadPath, "utf8");
  assert.match(museumTagDownload.suggestedFilename(), /^smithsonian_786-tags-.*\.txt$/);
  assert.match(museumTagContent, /史密森学会/);
  assert.match(museumTagContent, /课程数据集比对/);
  await expectHistoryEntry(page, "smithsonian_786", "史密森学会");

  logStep("Verifying CSV export flow");
  await page.goto(`${baseUrl}/history?keyword=${encodeURIComponent("huaihua_1")}`, {
    waitUntil: "networkidle",
  });
  await page.getByLabel("导出格式").selectOption("csv");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出", exact: true }).click(),
  ]);
  const downloadPath = await saveDownload(download);
  const csvContent = await fs.readFile(downloadPath, "utf8");
  assert.match(download.suggestedFilename(), /^history-records-.*\.csv$/);
  assert.match(csvContent, /huaihua_1\.jpg/);
  assert.match(csvContent, /Huaihua/);

  logStep("Verifying CSV export fallback when backend export fails");
  const exportRoutePattern = /\/api\/v1\/history\/export\?/;
  await page.route(exportRoutePattern, async (route) => {
    await route.abort("failed");
  });
  const [fallbackDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出", exact: true }).click(),
  ]);
  const fallbackDownloadPath = await saveDownload(fallbackDownload);
  const fallbackCsvContent = await fs.readFile(fallbackDownloadPath, "utf8");
  assert.equal(fallbackDownload.suggestedFilename(), "history-records.csv");
  assert.match(fallbackCsvContent, /huaihua_1\.jpg/);
  assert.match(fallbackCsvContent, /Huaihua/);
  await expectVisible(
    page.getByText("历史记录导出接口暂时不可用，已导出当前页面数据。"),
    "Expected history export fallback message after aborting backend export request",
  );
  await page.unroute(exportRoutePattern);

  await page.screenshot({
    path: path.resolve(outputDir, "e2e-smoke-history.png"),
    fullPage: true,
  });

  logStep("Smoke flow passed");
} finally {
  await context.close();
  await browser.close();
}
