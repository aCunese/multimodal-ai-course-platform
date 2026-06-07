import { useCallback, useEffect, useRef, useState } from "react";

import { classifyImage, getImageRecognitionMetadata } from "../../shared/api/client";
import type { ImageRecognitionMetadataResponse, ImageRecognitionResponse } from "../../shared/api/types";
import { formatHerbalLabel } from "../../shared/copy/display";
import { ConfidenceRing } from "../../shared/charts/ConfidenceRing";
import { Button, Panel, StatusBadge } from "../../shared/ui/Surface";
import { Icon } from "../../shared/ui/Icon";

type UploadedAsset = {
  sampleId?: string;
  name: string;
  sizeLabel: string;
  dimensionsLabel: string;
  previewUrl?: string;
  imageDataUrl?: string;
  objectUrl?: string;
};

const samplePreviewUrls: Record<string, string> = {
  dangshen_1: new URL(
  "../../../../data/experiments/experiment-01-herbal-image-classification/dataset/data/dangshen/dangshen_1.jpg",
  import.meta.url,
  ).href,
};

const initialMetadata: ImageRecognitionMetadataResponse = {
  pageTitle: "图像识别",
  pageDescription: "上传图片后，系统将基于课程图像分类模型识别图片所属类别，并展示预测结果与置信度。",
  syncLoadingMessage: "正在同步识别结果...",
  syncAnalyzingMessage: "正在调用后端识别接口...",
  syncReadyMessage: "图片识别结果已接入后端接口。",
  syncFallbackMessage: "后端识别接口暂时不可用，当前展示最近一次结果。",
  uploadPanelTitle: "图片上传区",
  uploadDropzoneTitle: "拖拽图片到此处或点击上传",
  uploadHint: "支持 JPG / PNG",
  uploadButtonLabel: "上传图片",
  exampleButtonLabel: "示例图片",
  uploadedPreviewTitle: "已上传图片",
  reuploadButtonLabel: "重新上传",
  previewLoadedStatusLabel: "已加载",
  previewAnalyzingStatusLabel: "识别中",
  resultPanelTitle: "识别结果",
  resultReadyStatusLabel: "识别完成",
  resultAnalyzingStatusLabel: "识别中",
  predictedCategoryLabel: "预测类别",
  confidenceLabel: "置信度",
  resultExplanationTitle: "结果解释",
  probabilityPanelTitle: "分类概率分布",
  modelInfoPanelTitle: "模型信息",
  sampleAsset: {
    sampleId: "dangshen_1",
    name: "dangshen_1.jpg",
    sizeLabel: "139 KB",
    dimensionsLabel: "700 × 466",
  },
  initialResult: {
    label: "党参",
    confidence: 90.5,
    explanation: "图像的条状根茎结构、褐黄色纹理和表面纤维细节与课程样本中的党参特征更接近。",
    probabilities: [
      { label: "党参", value: 90.5 },
      { label: "百合", value: 4.1 },
      { label: "金银花", value: 2.3 },
      { label: "槐花", value: 1.9 },
      { label: "枸杞", value: 1.2 },
    ],
    historyRecord: {
      id: "#1024",
      date: "2026-06-05",
      time: "14:25",
      module: "图像识别",
      inputType: "图片",
      inputContent: "dangshen_1.jpg",
      output: "党参",
      confidence: "90.5%",
      status: "成功",
      route: "/image-recognition",
    },
  },
  modelInfo: [
    { label: "模型类型", value: "课程中药样本分类器" },
    { label: "输入格式", value: "上传图片内容 + 颜色 / 纹理特征" },
    { label: "输出类型", value: "5 类中药材概率" },
    { label: "应用场景", value: "课程中药图像分类实验演示" },
  ],
};

function resolveSampleAsset(
  sampleAsset: ImageRecognitionMetadataResponse["sampleAsset"],
): UploadedAsset {
  return {
    sampleId: sampleAsset.sampleId,
    name: sampleAsset.name,
    sizeLabel: sampleAsset.sizeLabel,
    dimensionsLabel: sampleAsset.dimensionsLabel,
    previewUrl: samplePreviewUrls[sampleAsset.sampleId] ?? samplePreviewUrls.dangshen_1,
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
    image.onerror = () => resolve({ width: 512, height: 512 });
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

async function ensureAssetDataUrl(asset: UploadedAsset) {
  if (asset.imageDataUrl) {
    return asset.imageDataUrl;
  }

  if (asset.previewUrl?.startsWith("data:")) {
    return asset.previewUrl;
  }

  if (!asset.previewUrl) {
    return undefined;
  }

  const response = await fetch(asset.previewUrl);
  if (!response.ok) {
    throw new Error("加载课程样例图片失败。");
  }
  const blob = await response.blob();
  return readBlobAsDataUrl(blob);
}

function parseDimensions(dimensionsLabel: string) {
  const parts = dimensionsLabel.split("×").map((item) => Number(item.trim()));
  return {
    width: Number.isFinite(parts[0]) ? parts[0] : undefined,
    height: Number.isFinite(parts[1]) ? parts[1] : undefined,
  };
}

export function ImageRecognitionPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [sampleAsset, setSampleAsset] = useState<UploadedAsset>(() => resolveSampleAsset(initialMetadata.sampleAsset));
  const [asset, setAsset] = useState<UploadedAsset>(() => resolveSampleAsset(initialMetadata.sampleAsset));
  const [result, setResult] = useState<ImageRecognitionResponse>(initialMetadata.initialResult);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(initialMetadata.syncLoadingMessage);

  useEffect(() => {
    return () => {
      if (asset.objectUrl) {
        URL.revokeObjectURL(asset.objectUrl);
      }
    };
  }, [asset]);

  const runPrediction = useCallback(async (
    nextAsset: UploadedAsset,
    messageMetadata: ImageRecognitionMetadataResponse,
    showSuccessMessage = true,
  ) => {
    setIsAnalyzing(true);

    try {
      const { width, height } = parseDimensions(nextAsset.dimensionsLabel);
      const imageDataUrl = await ensureAssetDataUrl(nextAsset);
      const response = await classifyImage({
        fileName: nextAsset.name,
        width,
        height,
        sizeLabel: nextAsset.sizeLabel,
        imageDataUrl,
      });
      setResult(response);
      setSyncMessage(showSuccessMessage ? messageMetadata.syncReadyMessage : "");
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : messageMetadata.syncFallbackMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncMetadataAndPrediction() {
      let nextMetadata = initialMetadata;
      let nextSampleAsset = resolveSampleAsset(initialMetadata.sampleAsset);

      try {
        const response = await getImageRecognitionMetadata();

        if (cancelled) {
          return;
        }

        nextMetadata = response;
        setMetadata(response);
        nextSampleAsset = resolveSampleAsset(response.sampleAsset);
        setSampleAsset(nextSampleAsset);
        replaceAsset(nextSampleAsset);
        setResult(response.initialResult);
      } catch {
        if (cancelled) {
          return;
        }
      }

      await runPrediction(nextSampleAsset, nextMetadata, false);
    }

    void syncMetadataAndPrediction();

    return () => {
      cancelled = true;
    };
  }, [runPrediction]);

  function replaceAsset(nextAsset: UploadedAsset) {
    setAsset((current) => {
      if (current.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }

      return nextAsset;
    });
  }

  async function handleSelectedFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    const { width, height } = await loadImageDimensions(objectUrl);
    const imageDataUrl = await readBlobAsDataUrl(file);
    const nextAsset = {
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      dimensionsLabel: `${width} × ${height}`,
      previewUrl: objectUrl,
      imageDataUrl,
      objectUrl,
    };

    replaceAsset(nextAsset);
    await runPrediction(nextAsset, metadata);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleExampleLoad() {
    replaceAsset(sampleAsset);
    await runPrediction(sampleAsset, metadata);
  }

  const visibleSyncMessage = isAnalyzing ? metadata.syncAnalyzingMessage : syncMessage;

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

      <section className="page-grid page-grid--two">
        <Panel title={metadata.uploadPanelTitle} icon="image">
          <div className="upload-zone">
            <div className="upload-zone__box">
              <Icon name="image" size={56} />
              <h3>{metadata.uploadDropzoneTitle}</h3>
              <p>{metadata.uploadHint}</p>
              <div className="button-row">
                <Button icon="upload" onClick={handleUploadClick}>
                  {metadata.uploadButtonLabel}
                </Button>
                <Button variant="secondary" icon="image" onClick={() => void handleExampleLoad()}>
                  {metadata.exampleButtonLabel}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];

                  if (selectedFile) {
                    void handleSelectedFile(selectedFile);
                  }

                  event.currentTarget.value = "";
                }}
              />
            </div>

            <div className="preview-block">
              <div className="preview-block__header">
                <strong>{metadata.uploadedPreviewTitle}</strong>
                <button
                  type="button"
                  className="inline-link inline-link--button"
                  onClick={handleUploadClick}
                >
                  <Icon name="refresh" size={16} />
                  <span>{metadata.reuploadButtonLabel}</span>
                </button>
              </div>
              <div className="sample-card sample-card--image">
                <div className="sample-card__badge">
                  <StatusBadge tone={isAnalyzing ? "accent" : "success"}>
                    {isAnalyzing ? metadata.previewAnalyzingStatusLabel : metadata.previewLoadedStatusLabel}
                  </StatusBadge>
                </div>
                <img src={asset.previewUrl} alt={asset.name} className="sample-card__photo" />
                <div className="sample-card__meta">
                  <strong>{asset.name}</strong>
                  <p>
                    {asset.dimensionsLabel} · JPG / PNG · {asset.sizeLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title={metadata.resultPanelTitle}
          icon="file"
          action={
            <StatusBadge tone={isAnalyzing ? "accent" : "success"}>
              {isAnalyzing ? metadata.resultAnalyzingStatusLabel : metadata.resultReadyStatusLabel}
            </StatusBadge>
          }
        >
          <div className="result-stack">
            <div className="result-summary">
              <div>
                <p className="result-summary__label">{metadata.predictedCategoryLabel}</p>
                <h2>{formatHerbalLabel(result.label)}</h2>
                <div className="status-line">
                  <span className="status-dot status-dot--success" />
                  <span>{result.historyRecord.id}</span>
                </div>
              </div>
              <ConfidenceRing value={result.confidence} label={metadata.confidenceLabel} />
            </div>

            <div className="explanation-box">
              <h3>{metadata.resultExplanationTitle}</h3>
              <p>{result.explanation}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="page-grid page-grid--two">
        <Panel title={metadata.probabilityPanelTitle} icon="chart">
          <div className="progress-list">
            {result.probabilities.map((item) => (
              <div key={item.label} className="progress-list__item">
                <div className="progress-list__label">
                  <span>{formatHerbalLabel(item.label)}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={metadata.modelInfoPanelTitle} icon="database">
          <dl className="info-list">
            {metadata.modelInfo.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
            <div>
              <dt>最近记录</dt>
              <dd>{result.historyRecord.id}</dd>
            </div>
          </dl>
        </Panel>
      </section>
    </div>
  );
}
