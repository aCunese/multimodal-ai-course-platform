import { useEffect, useRef, useState } from "react";

import museumDetail from "../../assets/illustrations/museum-detail.jpg";
import museumSample from "../../assets/illustrations/museum-sample.jpg";
import {
  analyzeMuseumVision,
  downloadMuseumVisionTags,
  getMuseumVisionMetadata,
} from "../../shared/api/client";
import { formatMuseumCopy, formatMuseumInstitution } from "../../shared/copy/display";
import type { MuseumVisionMetadataResponse, MuseumVisionResponse } from "../../shared/api/types";
import { ConfidenceRing } from "../../shared/charts/ConfidenceRing";
import { Icon } from "../../shared/ui/Icon";
import { Button, Panel, StatusBadge } from "../../shared/ui/Surface";

type MuseumAsset = {
  id: string;
  name: string;
  previewUrl: string;
  format: string;
  dimensions: string;
  sizeLabel: string;
  imageDataUrl?: string;
  objectUrl?: string;
};

const portraitPreviewUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280">
      <defs>
        <linearGradient id="bg" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#3c2b22"/>
          <stop offset="100%" stop-color="#19120f"/>
        </linearGradient>
        <linearGradient id="dress" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#f3e6cf"/>
          <stop offset="100%" stop-color="#ceb388"/>
        </linearGradient>
      </defs>
      <rect width="960" height="1280" fill="url(#bg)"/>
      <rect x="104" y="112" width="752" height="1056" rx="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
      <ellipse cx="498" cy="598" rx="200" ry="316" fill="#715440"/>
      <ellipse cx="498" cy="472" rx="118" ry="152" fill="#f2d7bf"/>
      <ellipse cx="420" cy="446" rx="28" ry="18" fill="#2e2017"/>
      <ellipse cx="572" cy="446" rx="28" ry="18" fill="#2e2017"/>
      <ellipse cx="445" cy="494" rx="16" ry="12" fill="#d38b88"/>
      <ellipse cx="547" cy="494" rx="16" ry="12" fill="#d38b88"/>
      <path d="M448 556c24 24 76 24 100 0" stroke="#7a4c46" stroke-width="10" stroke-linecap="round"/>
      <path d="M378 352c42-92 172-122 256-24-8-118-180-162-280-56Z" fill="#2f2119"/>
      <path d="M328 730c108-122 244-154 362-66 32 24 48 58 62 108-146 44-296 54-450 34-8-34 0-54 26-76Z" fill="url(#dress)"/>
      <path d="M694 612c54 88 78 200 74 336-72-20-124-52-164-98 4-112 18-188 90-238Z" fill="#b08a4e"/>
      <circle cx="520" cy="318" r="18" fill="#b88456"/>
      <rect x="156" y="960" width="640" height="116" rx="18" fill="rgba(255,255,255,0.05)"/>
      <text x="190" y="1026" fill="#f4eadb" font-family="Georgia, serif" font-size="42">Portrait Study</text>
    </svg>
  `);

const samplePreviewUrls: Record<string, string> = {
  portrait: portraitPreviewUrl,
  landscape: museumSample,
};

const initialMetadata: MuseumVisionMetadataResponse = {
  pageTitle: "博物馆图像识别 / 描述",
  pageDescription: "上传博物馆图像后，系统将识别图像来源，生成内容描述，并提取艺术品相关标签。",
  syncConnectingMessage: "正在连接博物馆图像理解接口...",
  syncAnalyzingMessage: "正在请求博物馆图像理解接口...",
  syncReadyMessage: "博物馆图像理解结果已由后端接口提供。",
  syncUpdateMessage: "博物馆图像理解结果已更新并写入历史记录。",
  syncFallbackMessage: "博物馆图像接口暂时不可用，当前展示本地演示数据。",
  copyActionLabel: "复制描述",
  copySuccessLabel: "已复制",
  copyFailureMessage: "复制失败，请检查浏览器剪贴板权限。",
  exportTagsActionLabel: "导出标签",
  exportTagsSuccessLabel: "已导出",
  exportTagsSuccessMessage: "标签导出文件已由后端接口生成。",
  exportTagsFallbackMessage: "标签导出接口暂时不可用，已导出当前页面标签。",
  uploadButtonLabel: "上传图像",
  switchSampleButtonLabel: "切换样例",
  sampleLoadedStatusLabel: "已载入样例",
  uploadSuccessStatusLabel: "上传成功",
  sampleSourceBadgeLabel: "课程样例",
  uploadSourceBadgeLabel: "本地文件",
  openPreviewAriaLabel: "打开预览大图",
  downloadPreviewAriaLabel: "下载当前图片",
  switchPreviewAriaLabel: "切换样例图片",
  sampleAssets: [
    {
      id: "portrait",
      name: "portrait_classical.jpg",
      format: "JPG",
      dimensions: "960 × 1280",
      sizeLabel: "1.82 MB",
    },
    {
      id: "landscape",
      name: "museum_sample.jpg",
      format: "JPG",
      dimensions: "768 × 768",
      sizeLabel: "0.68 MB",
    },
  ],
  initialAssetId: "portrait",
  initialAnalysis: {
    name: "portrait_classical.jpg",
    format: "JPG",
    dimensions: "960 × 1280",
    sizeLabel: "1.82 MB",
    sourceNote: "来源样例：大都会肖像馆藏样例",
    uploadedAt: "2026-06-06 12:00:00",
    institution: "大都会艺术博物馆",
    confidence: 89.6,
    description: "这是一幅具有古典风格的人物绘画作品，画面主体位于中央，背景色调柔和，整体呈现典型的博物馆藏品图像特征。",
    artworkClue: {
      title: "古典人物肖像",
      era: "古典风格",
      category: "人物肖像",
      museumHint: "大都会艺术博物馆",
      basis: "该线索根据课程样例名称与人物构图特征生成，用于帮助说明作品题材。",
    },
    tags: ["人物肖像", "古典绘画", "博物馆藏品", "暖色调", "历史艺术", "服饰细节", "构图分析"],
    matches: [
      { institution: "大都会艺术博物馆", score: 89.6 },
      { institution: "哈佛艺术博物馆", score: 6.2 },
      { institution: "普林斯顿大学艺术博物馆", score: 2.8 },
      { institution: "史密森学会", score: 1.4 },
    ],
    historyRecord: {
      id: "#1021",
      date: "2026-06-05",
      time: "13:35",
      module: "博物馆图像理解",
      inputType: "图片",
      inputContent: "museum_01.jpg",
      output: "古代青铜器",
      confidence: "90.1%",
      status: "成功",
      route: "/museum-vision",
    },
  },
  sampleDescriptionNote: "当前描述结合样例图像的主体内容、构图风格与课程实验设定生成。",
  uploadDescriptionNote: "当前描述会同时参考上传文件名中的作品线索，以及图像颜色、纹理与构图特征，再结合课程数据集中的相似样本生成。",
  dataSourceItems: [
    {
      title: "数据来源",
      body: "本模块基于课程中的图像理解 / 跨模态实验设计，数据来源包括哈佛艺术博物馆、大都会艺术博物馆、普林斯顿大学艺术博物馆、史密森学会等馆藏图像数据。",
    },
    {
      title: "当前状态",
      body: "当前页面已具备样例切换、本地上传、课程数据集相似度比对、来源匹配和描述生成的联调链路。",
    },
  ],
};

function resolveMuseumAsset(
  asset: MuseumVisionMetadataResponse["sampleAssets"][number],
): MuseumAsset {
  return {
    ...asset,
    previewUrl: samplePreviewUrls[asset.id] ?? museumSample,
    imageDataUrl: asset.id === "portrait" ? portraitPreviewUrl : undefined,
  };
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function loadImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 960, height: 1280 });
    image.src = url;
  });
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取图片数据失败。"));
    reader.readAsDataURL(blob);
  });
}

async function ensureAssetDataUrl(asset: MuseumAsset) {
  if (asset.imageDataUrl) {
    return asset.imageDataUrl;
  }

  if (asset.previewUrl.startsWith("data:")) {
    return asset.previewUrl;
  }

  const response = await fetch(asset.previewUrl);
  const blob = await response.blob();
  return readBlobAsDataUrl(blob);
}

export function MuseumVisionPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [sampleAssets, setSampleAssets] = useState<MuseumAsset[]>(() =>
    initialMetadata.sampleAssets.map(resolveMuseumAsset),
  );
  const [presetIndex, setPresetIndex] = useState(() =>
    Math.max(0, initialMetadata.sampleAssets.findIndex((asset) => asset.id === initialMetadata.initialAssetId)),
  );
  const [currentAsset, setCurrentAsset] = useState<MuseumAsset>(() =>
    resolveMuseumAsset(
      initialMetadata.sampleAssets.find((asset) => asset.id === initialMetadata.initialAssetId) ??
        initialMetadata.sampleAssets[0],
    ),
  );
  const [analysis, setAnalysis] = useState<MuseumVisionResponse>(initialMetadata.initialAnalysis);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sourceMode, setSourceMode] = useState<"sample" | "upload">("sample");
  const [copyState, setCopyState] = useState<"idle" | "done">("idle");
  const [tagExportState, setTagExportState] = useState<"idle" | "done">("idle");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(initialMetadata.syncConnectingMessage);
  const visibleSyncMessage = isAnalyzing ? metadata.syncAnalyzingMessage : syncMessage;

  useEffect(() => {
    return () => {
      if (generatedPreviewUrl) {
        URL.revokeObjectURL(generatedPreviewUrl);
      }
    };
  }, [generatedPreviewUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialAnalysis() {
      let nextMetadata = initialMetadata;
      let initialAsset = resolveMuseumAsset(
        initialMetadata.sampleAssets.find((asset) => asset.id === initialMetadata.initialAssetId) ??
          initialMetadata.sampleAssets[0],
      );

      try {
        const metadataResponse = await getMuseumVisionMetadata();

        if (cancelled) {
          return;
        }

        nextMetadata = metadataResponse;

        const nextAssets = metadataResponse.sampleAssets.map(resolveMuseumAsset);
        const nextIndex = Math.max(
          0,
          metadataResponse.sampleAssets.findIndex((asset) => asset.id === metadataResponse.initialAssetId),
        );
        initialAsset = nextAssets[nextIndex] ?? nextAssets[0] ?? initialAsset;

        setMetadata(metadataResponse);
        setSampleAssets(nextAssets);
        setPresetIndex(nextIndex);
        applyAsset(initialAsset, "sample");
        setAnalysis(metadataResponse.initialAnalysis);
      } catch {
        if (cancelled) {
          return;
        }
      }

      setIsAnalyzing(true);

      try {
        const imageDataUrl = await ensureAssetDataUrl(initialAsset);
        const response = await analyzeMuseumVision({
          fileName: initialAsset.name,
          format: initialAsset.format,
          dimensions: initialAsset.dimensions,
          sizeLabel: initialAsset.sizeLabel,
          sourceMode: "sample",
          imageDataUrl,
        });

        if (cancelled) {
          return;
        }

        setAnalysis(response);
        setSyncMessage("");
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(error instanceof Error ? error.message : nextMetadata.syncFallbackMessage);
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    void loadInitialAnalysis();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runAnalysis(nextAsset: MuseumAsset, nextSourceMode: "sample" | "upload") {
    setIsAnalyzing(true);

    try {
      const imageDataUrl = await ensureAssetDataUrl(nextAsset);
      const response = await analyzeMuseumVision({
        fileName: nextAsset.name,
        format: nextAsset.format,
        dimensions: nextAsset.dimensions,
        sizeLabel: nextAsset.sizeLabel,
        sourceMode: nextSourceMode,
        imageDataUrl,
      });

      setAnalysis(response);
      setSyncMessage(metadata.syncUpdateMessage);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : metadata.syncFallbackMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function applyAsset(nextAsset: MuseumAsset, nextSourceMode: "sample" | "upload") {
    setCurrentAsset((current) => {
      if (current.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }

      return nextAsset;
    });
    setSourceMode(nextSourceMode);
    setCopyState("idle");
    setTagExportState("idle");
  }

  async function handleSwitchPreset() {
    if (generatedPreviewUrl) {
      URL.revokeObjectURL(generatedPreviewUrl);
      setGeneratedPreviewUrl(null);
    }

    const nextIndex = (presetIndex + 1) % sampleAssets.length;
    const nextAsset = sampleAssets[nextIndex];
    setPresetIndex(nextIndex);
    applyAsset(nextAsset, "sample");
    await runAnalysis(nextAsset, "sample");
  }

  async function handleFileSelected(file: File) {
    if (generatedPreviewUrl) {
      URL.revokeObjectURL(generatedPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setGeneratedPreviewUrl(objectUrl);
    const { width, height } = await loadImageDimensions(objectUrl);
    const imageDataUrl = await readBlobAsDataUrl(file);
    const nextAsset: MuseumAsset = {
      id: "upload",
      name: file.name,
      previewUrl: objectUrl,
      format: file.name.split(".").pop()?.toUpperCase() ?? "JPG",
      dimensions: `${width} × ${height}`,
      sizeLabel: formatFileSize(file.size),
      imageDataUrl,
      objectUrl,
    };

    applyAsset(nextAsset, "upload");
    await runAnalysis(nextAsset, "upload");
  }

  function triggerDownload(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  function downloadTextFile(fileName: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, fileName);
  }

  async function handleCopyDescription() {
    try {
      await navigator.clipboard.writeText(analysis.description);
      setCopyState("done");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setSyncMessage(metadata.copyFailureMessage);
    }
  }

  async function handleExportTags() {
    try {
      const { blob, filename } = await downloadMuseumVisionTags({
        fileName: currentAsset.name,
        institution: analysis.institution,
        tags: analysis.tags,
      });
      triggerDownload(blob, filename);
      setSyncMessage(metadata.exportTagsSuccessMessage);
    } catch {
      const fallbackName = `${currentAsset.id}-tags.txt`;
      downloadTextFile(fallbackName, analysis.tags.join("\n"));
      setSyncMessage(metadata.exportTagsFallbackMessage);
    }

    setTagExportState("done");
    window.setTimeout(() => setTagExportState("idle"), 1800);
  }

  function handleDownloadPreview() {
    const link = document.createElement("a");
    link.href = currentAsset.previewUrl;
    link.download = currentAsset.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleOpenPreview() {
    window.open(currentAsset.previewUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="page">
      <div className="sr-only">
        <h1>{metadata.pageTitle}</h1>
        <p>{metadata.pageDescription}</p>
      </div>
      {visibleSyncMessage ? (
        <section className="page-meta-bar" aria-live="polite">
          <p className="field-caption page-meta-bar__message">{visibleSyncMessage}</p>
        </section>
      ) : null}

      <section className="page-grid page-grid--museum">
        <Panel title="博物馆图片上传与预览" icon="museum" className="museum-panel">
          <div className="museum-upload-layout">
            <div
              className={`museum-dropzone ${isDragging ? "museum-dropzone--active" : ""}`.trim()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  void handleFileSelected(file);
                }
              }}
            >
              <div className="museum-dropzone__icon">☁</div>
              <strong>拖拽图片到此处</strong>
              <span>或</span>
              <Button onClick={() => fileInputRef.current?.click()}>选择文件上传</Button>
              <p>支持 JPG / PNG / WEBP，单张图片大小不超过 20MB</p>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFileSelected(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </div>

            <div className="museum-preview-card">
              <div className="museum-preview-stage">
                <img
                  src={currentAsset.previewUrl}
                  alt={currentAsset.name}
                  className="museum-preview-stage__image"
                />
              </div>
              <div className="museum-preview-meta">
                <div>
                  <dt>文件名</dt>
                  <dd>{currentAsset.name}</dd>
                </div>
                <div>
                  <dt>格式</dt>
                  <dd>{currentAsset.format}</dd>
                </div>
                <div>
                  <dt>分辨率</dt>
                  <dd>{currentAsset.dimensions}</dd>
                </div>
                <div>
                  <dt>大小</dt>
                  <dd>{currentAsset.sizeLabel}</dd>
                </div>
                <div>
                  <dt>上传时间</dt>
                  <dd>{analysis.uploadedAt}</dd>
                </div>
              </div>

              <div className="museum-preview-toolbar">
                <button
                  className="icon-button"
                  type="button"
                  aria-label={metadata.openPreviewAriaLabel}
                  onClick={handleOpenPreview}
                >
                  <Icon name="search" size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={metadata.downloadPreviewAriaLabel}
                  onClick={handleDownloadPreview}
                >
                  <Icon name="download" size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={metadata.switchPreviewAriaLabel}
                  onClick={() => void handleSwitchPreset()}
                >
                  <Icon name="refresh" size={16} />
                </button>
                <StatusBadge tone={isAnalyzing ? "accent" : "success"}>
                  {sourceMode === "upload" ? metadata.uploadSuccessStatusLabel : metadata.sampleLoadedStatusLabel}
                </StatusBadge>
              </div>
            </div>
          </div>

          <div className="museum-upload-actions">
            <Button icon="upload" onClick={() => fileInputRef.current?.click()}>
              {metadata.uploadButtonLabel}
            </Button>
            <Button variant="secondary" onClick={() => void handleSwitchPreset()}>
              {metadata.switchSampleButtonLabel}
            </Button>
            <StatusBadge tone="accent">
              {sourceMode === "upload" ? metadata.uploadSourceBadgeLabel : metadata.sampleSourceBadgeLabel}
            </StatusBadge>
          </div>
        </Panel>

        <Panel title="来源识别结果" icon="light" className="museum-panel">
          <div className="museum-result-layout">
            <div className="museum-result-brand">
              <div className="museum-result-brand__icon">🏛</div>
              <div>
                <p className="result-summary__label">预测来源</p>
                <h2>{formatMuseumInstitution(analysis.institution)}</h2>
                <p className="analysis-copy">{formatMuseumCopy(analysis.sourceNote)}</p>
                <div className="museum-artwork-clue">
                  <p className="result-summary__label">作品线索</p>
                  <h3>{analysis.artworkClue.title}</h3>
                  <div className="museum-artwork-clue__meta">
                    {analysis.artworkClue.era ? <span>时代：{analysis.artworkClue.era}</span> : null}
                    {analysis.artworkClue.category ? <span>类型：{analysis.artworkClue.category}</span> : null}
                    {analysis.artworkClue.museumHint ? <span>馆藏线索：{analysis.artworkClue.museumHint}</span> : null}
                  </div>
                  <p className="analysis-copy">{formatMuseumCopy(analysis.artworkClue.basis)}</p>
                </div>
              </div>
            </div>
            <ConfidenceRing value={analysis.confidence} label="置信度" />
          </div>

          <div className="progress-list museum-probability-list">
            {analysis.matches.map((item) => (
              <div key={item.institution} className="progress-list__item">
                <div className="progress-list__label">
                  <span>{formatMuseumInstitution(item.institution)}</span>
                  <strong>{item.score}%</strong>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title="图像描述"
        icon="pen"
        action={
          <Button
            variant="secondary"
            icon="copy"
            onClick={() => void handleCopyDescription()}
          >
            {copyState === "done" ? metadata.copySuccessLabel : metadata.copyActionLabel}
          </Button>
        }
      >
        <div className="museum-description-box">
          <p>{analysis.description}</p>
          <p>
            {sourceMode === "upload" ? metadata.uploadDescriptionNote : metadata.sampleDescriptionNote}
          </p>
        </div>
      </Panel>

      <Panel
        title="标签提取"
        icon="tag"
        action={
          <Button variant="secondary" icon="download" onClick={() => void handleExportTags()}>
            {tagExportState === "done" ? metadata.exportTagsSuccessLabel : metadata.exportTagsActionLabel}
          </Button>
        }
      >
        <div className="tag-group">
          {analysis.tags.map((tag) => (
            <span key={tag} className="chip chip--accent museum-tag">
              {tag}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="数据来源说明" icon="cube">
        <div className="museum-data-source">
          <div className="check-list">
            {metadata.dataSourceItems.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{formatMuseumCopy(item.body)}</p>
              </div>
            ))}
            <div>
              <strong>历史记录 ID</strong>
              <p>{analysis.historyRecord.id}</p>
            </div>
          </div>
          <img src={museumDetail} alt="数据来源说明插图" className="museum-data-source__art" />
        </div>
      </Panel>
    </div>
  );
}
