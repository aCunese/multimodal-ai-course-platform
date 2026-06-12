import { useEffect, useMemo, useState } from "react";

import { analyzeSentiment, getSentimentAnalysisMetadata } from "../../shared/api/client";
import { formatSentimentKeyword, formatSentimentResultLabel } from "../../shared/copy/display";
import { buildLocalSentimentAnalysis } from "../../shared/fallbacks/local-text-tools";
import type { SentimentAnalysisMetadataResponse, SentimentAnalysisResponse } from "../../shared/api/types";
import { Button, Panel, StatusBadge } from "../../shared/ui/Surface";

const initialMetadata: SentimentAnalysisMetadataResponse = {
  pageTitle: "情感分析",
  pageDescription: "输入评论文本，系统将判断文本情绪倾向，并展示情感类别、置信度和关键词分析。",
  syncLoadingMessage: "正在同步情感分析结果...",
  syncAnalyzingMessage: "正在调用情感分析接口...",
  syncReadyMessage: "情感分析结果已接入后端接口。",
  syncFallbackMessage: "情感分析接口暂时不可用，当前保留最近一次分析结果。",
  emptyInputMessage: "请输入文本后再调用分析接口。",
  textInputLabel: "请输入需要分析的文本（支持中英文）",
  clearButtonLabel: "清空",
  sampleButtonLabel: "示例文本",
  analyzeButtonLabel: "开始分析",
  analyzeButtonBusyLabel: "分析中...",
  positiveOnlyButtonLabel: "仅积极",
  showAllButtonLabel: "显示全部",
  sampleText: "This movie is wonderful, visually stunning and emotionally moving.",
  pendingResult: {
    label: "中性",
    englishLabel: "Neutral",
    confidence: 50,
    score: 0,
    tags: ["待分析"],
    positiveMatches: [
      { label: "精彩", score: 0.94 },
      { label: "出色", score: 0.89 },
      { label: "感人", score: 0.83 },
      { label: "动人", score: 0.82 },
      { label: "推荐", score: 0.78 },
    ],
    negativeMatches: [
      { label: "拖沓", score: 0.21 },
      { label: "节奏慢", score: 0.18 },
      { label: "无聊", score: 0.16 },
    ],
    explanation: "请输入文本并点击“开始分析”，系统会根据关键词和语义倾向给出情感判断。",
    status: "待分析",
    processingTime: "--",
    taskId: "SA-PENDING",
    completedAt: "--",
    providerUsed: "local",
    usedFallback: false,
    providerStatusMessage: "当前分析引擎：本地词典",
    historyRecord: {
      id: "#1023",
      date: "2026-06-05",
      time: "14:18",
      module: "情感分析",
      inputType: "文本",
      inputContent: "IMDB 评论",
      output: "正面",
      confidence: "88.4%",
      status: "成功",
      route: "/sentiment-analysis",
    },
  },
  providerStatus: {
    configuredProvider: "local",
    activeProvider: "local",
    enabled: true,
    statusLabel: "当前分析引擎：本地词典",
    detailMessage: "当前未启用 DeepSeek 情感分析，系统使用本地 IMDb 词典规则完成判断。",
  },
  modelLabel: "IMDB 评论情感分析",
  analysisNote:
    "本模型基于 IMDb 电影评论数据集训练，能够识别文本情感倾向，并提供置信度评分与关键词重要性分析，帮助用户快速理解文本的情绪表达。",
};

const localSentimentFallbackMessage = "情感分析接口暂时不可用，当前已根据输入内容执行本地兜底分析。";

function renderSentimentKeywordLabel(label: string, usedFallback: boolean) {
  const translatedLabel = formatSentimentKeyword(label);

  if (!usedFallback || translatedLabel === label) {
    return <span>{translatedLabel}</span>;
  }

  return (
    <span className="keyword-chip-copy">
      <span>{label}</span>
      <span>{translatedLabel}</span>
    </span>
  );
}

export function SentimentAnalysisPage() {
  const [metadata, setMetadata] = useState<SentimentAnalysisMetadataResponse>(initialMetadata);
  const [text, setText] = useState(initialMetadata.sampleText);
  const [positiveOnly, setPositiveOnly] = useState(false);
  const [result, setResult] = useState<SentimentAnalysisResponse>(initialMetadata.pendingResult);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(initialMetadata.syncLoadingMessage);
  const [providerStatusLabel, setProviderStatusLabel] = useState(initialMetadata.providerStatus.statusLabel);
  const [hasTriggeredManualAnalysis, setHasTriggeredManualAnalysis] = useState(false);

  const visibleNegativeKeywords = positiveOnly ? [] : result.negativeMatches;
  const confidenceTone =
    result.status === "待分析" ? "neutral" : result.label === "负面" ? "warning" : "success";
  const visibleSyncMessage =
    isAnalyzing
      ? metadata.syncAnalyzingMessage
      : syncMessage === metadata.syncReadyMessage && !hasTriggeredManualAnalysis
        ? ""
        : syncMessage;

  const summaryCopy = useMemo(() => {
    if (result.status === "待分析") {
      return "等待输入文本后启动分析。";
    }

    return result.explanation;
  }, [result]);

  useEffect(() => {
    let cancelled = false;

    async function syncMetadataAndAnalyze() {
      let nextMetadata = initialMetadata;
      let nextSampleText = initialMetadata.sampleText;
      let nextPendingResult = initialMetadata.pendingResult;

      try {
        const response = await getSentimentAnalysisMetadata();

        if (cancelled) {
          return;
        }

        nextMetadata = response;
        nextSampleText = response.sampleText;
        nextPendingResult = response.pendingResult;
        setMetadata(response);
        setText(response.sampleText);
        setResult(response.pendingResult);
        setProviderStatusLabel(response.providerStatus.statusLabel);
      } catch {
        if (cancelled) {
          return;
        }
      }

      if (!nextSampleText.trim()) {
        if (!cancelled) {
          setResult(nextPendingResult);
          setSyncMessage(nextMetadata.emptyInputMessage);
        }
        return;
      }

      if (!cancelled) {
        setIsAnalyzing(true);
      }

      try {
        const response = await analyzeSentiment(nextSampleText.trim());

        if (cancelled) {
          return;
        }

        setResult(response);
        setSyncMessage(nextMetadata.syncReadyMessage);
        setProviderStatusLabel(response.providerStatusMessage);
      } catch {
        if (!cancelled) {
          const fallbackResponse = buildLocalSentimentAnalysis(nextSampleText.trim());
          setResult(fallbackResponse);
          setSyncMessage(localSentimentFallbackMessage);
          setProviderStatusLabel(fallbackResponse.providerStatusMessage);
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    void syncMetadataAndAnalyze();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnalyze(nextText = text) {
    if (!nextText.trim()) {
      setResult(metadata.pendingResult);
      setSyncMessage(metadata.emptyInputMessage);
      return;
    }

    setHasTriggeredManualAnalysis(true);
    setIsAnalyzing(true);

    try {
      const response = await analyzeSentiment(nextText.trim());
      setResult(response);
      setSyncMessage(metadata.syncReadyMessage);
      setProviderStatusLabel(response.providerStatusMessage);
    } catch {
      const fallbackResponse = buildLocalSentimentAnalysis(nextText.trim());
      setResult(fallbackResponse);
      setSyncMessage(localSentimentFallbackMessage);
      setProviderStatusLabel(fallbackResponse.providerStatusMessage);
    } finally {
      setIsAnalyzing(false);
    }
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

      <section className="page-grid page-grid--two">
        <Panel title="文本输入区" icon="file">
          <div className="form-stack">
            <label className="field">
              <span>{metadata.textInputLabel}</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} />
            </label>
            <div className="field-caption">{text.length} / 5000 字符</div>
            <div className="button-row">
              <Button variant="secondary" onClick={() => setText("")}>
                {metadata.clearButtonLabel}
              </Button>
              <Button variant="secondary" onClick={() => setText(metadata.sampleText)}>
                {metadata.sampleButtonLabel}
              </Button>
              <Button onClick={() => void handleAnalyze()}>
                {isAnalyzing ? metadata.analyzeButtonBusyLabel : metadata.analyzeButtonLabel}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="情感结果" icon="chart" action={<StatusBadge tone={confidenceTone}>{providerStatusLabel}</StatusBadge>}>
          <div className="result-card-grid">
            <div className="result-mini-card">
              <p>情感倾向</p>
              <strong>{result.label}</strong>
              <span>{formatSentimentResultLabel(result.englishLabel)}</span>
            </div>
            <div className="result-mini-card">
              <p>置信度</p>
              <strong>{result.confidence}%</strong>
              <span>{result.confidence >= 75 ? "高置信度" : "中等置信度"}</span>
            </div>
          </div>

          <div className="tag-group">
            {result.tags.map((tag) => (
              <span key={tag} className={`chip ${result.label === "负面" ? "chip--danger" : "chip--success"}`}>
                {tag}
              </span>
            ))}
          </div>

          <p className="analysis-copy">{summaryCopy}</p>
        </Panel>
      </section>

      <Panel
        title="关键词分析"
        icon="tag"
        action={
          <Button variant="secondary" onClick={() => setPositiveOnly((current) => !current)}>
            {positiveOnly ? metadata.showAllButtonLabel : metadata.positiveOnlyButtonLabel}
          </Button>
        }
      >
        <div className="keyword-section">
          <div>
            <p className="keyword-section__label">积极关键词（Top 5）</p>
            <div className="chip-row">
              {result.positiveMatches.map((item) => (
                <span key={item.label} className="chip chip--success chip--wide">
                  {renderSentimentKeywordLabel(item.label, result.usedFallback)}
                  <strong>{item.score}</strong>
                </span>
              ))}
            </div>
          </div>

          {!positiveOnly ? (
            <div>
              <p className="keyword-section__label">消极关键词（Top 3）</p>
              <div className="chip-row">
                {visibleNegativeKeywords.map((item) => (
                  <span key={item.label} className="chip chip--danger chip--wide">
                    {renderSentimentKeywordLabel(item.label, result.usedFallback)}
                    <strong>{item.score}</strong>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
