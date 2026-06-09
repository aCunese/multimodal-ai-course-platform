import { startTransition, useEffect, useState } from "react";

import { generateText, getGenerationHistory, getTextGenerationMetadata } from "../../shared/api/client";
import { generationHistory, generationOutputs } from "../../mocks/platformData";
import { buildLocalTextGeneration } from "../../shared/fallbacks/local-text-tools";
import type {
  GenerationHistoryItem,
  GenerationOutput,
  GenerationTone,
  GenerationType,
} from "../../shared/types/platform";
import type { GenerationQualityMetric, TextGenerationMetadataResponse } from "../../shared/api/types";
import { Button, Panel, StatusBadge } from "../../shared/ui/Surface";

const defaultQualityMetrics: GenerationQualityMetric[] = [
  { label: "主题相关度", value: 92 },
  { label: "语言流畅度", value: 92 },
  { label: "创意表达", value: 86 },
];
const historyPageSize = 8;

const initialMetadata: TextGenerationMetadataResponse = {
  pageTitle: "文案生成",
  pageDescription: "输入主题、语气和输出类型，生成适合课程答辩、海报展示和项目说明的演示文案。",
  syncConnectingMessage: "正在连接文案生成接口...",
  syncHistoryReadyMessage: "文案生成历史记录已由后端接口提供。",
  syncFallbackMessage: "文案生成接口暂时不可用，当前展示本地演示数据。",
  generateLoadingMessage: "正在请求文案生成接口...",
  generateSuccessMessage: "生成结果已来自后端接口，并已写入历史记录。",
  generateFallbackMessage: "文案生成接口暂时不可用，当前保留最近一次生成结果。",
  restoreExampleMessage: "已恢复到后端默认示例配置，可继续发起后端生成。",
  copyActionLabel: "复制",
  copySuccessLabel: "已复制",
  copyFailureMessage: "复制失败，请检查浏览器剪贴板权限。",
  restoreExampleButtonLabel: "恢复示例",
  generateButtonLabel: "开始生成",
  generateButtonBusyLabel: "生成中...",
  regenerateButtonLabel: "重新生成",
  providerStatus: {
    configuredProvider: "local",
    activeProvider: "local",
    enabled: true,
    statusLabel: "当前生成引擎：本地模板",
    detailMessage: "当前未启用 DeepSeek 文案生成，系统将使用本地模板与诗词语料生成结果。",
  },
  toneOptions: ["正式", "活泼", "科技感", "文艺"],
  generationTypes: ["标题", "宣传语", "短文案", "诗意表达"],
  defaultConfig: {
    theme: "人工智能课程展示",
    tone: "科技感",
    type: "标题",
    quantity: 3,
  },
  sampleOutputs: generationOutputs,
  defaultQualityMetrics,
  defaultQualityTip: "推荐用于产品化展示、模块介绍和平台价值主张区域。",
  defaultToneKeywords: ["技术气质", "未来感强", "适合产品页"],
};

type TextGenerationSyncState =
  | "connecting"
  | "history-ready"
  | "fallback"
  | "generate-success"
  | "generate-fallback"
  | "generate-local-fallback"
  | "restore-example"
  | "copy-failure";

const localTextGenerationFallbackMessage = "文案生成接口暂时不可用，当前已根据输入主题生成本地兜底结果。";

function resolveSyncMessage(metadata: TextGenerationMetadataResponse, syncState: TextGenerationSyncState) {
  switch (syncState) {
    case "history-ready":
      return "";
    case "fallback":
      return metadata.syncFallbackMessage;
    case "generate-success":
      return metadata.generateSuccessMessage;
    case "generate-fallback":
      return metadata.generateFallbackMessage;
    case "generate-local-fallback":
      return localTextGenerationFallbackMessage;
    case "restore-example":
      return metadata.restoreExampleMessage;
    case "copy-failure":
      return metadata.copyFailureMessage;
    case "connecting":
    default:
      return metadata.syncConnectingMessage;
  }
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages] as const;
}

export function TextGenerationPage() {
  const [metadata, setMetadata] = useState<TextGenerationMetadataResponse>(initialMetadata);
  const [theme, setTheme] = useState(initialMetadata.defaultConfig.theme);
  const [tone, setTone] = useState<GenerationTone>(initialMetadata.defaultConfig.tone);
  const [type, setType] = useState<GenerationType>(initialMetadata.defaultConfig.type);
  const [quantity, setQuantity] = useState(initialMetadata.defaultConfig.quantity);
  const [outputs, setOutputs] = useState<GenerationOutput[]>(generationOutputs);
  const [history, setHistory] = useState<GenerationHistoryItem[]>(generationHistory);
  const [qualityMetrics, setQualityMetrics] = useState(defaultQualityMetrics);
  const [qualityTip, setQualityTip] = useState(initialMetadata.defaultQualityTip);
  const [toneKeywords, setToneKeywords] = useState(initialMetadata.defaultToneKeywords);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState("14:32:18");
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncState, setSyncState] = useState<TextGenerationSyncState>("connecting");
  const [providerStatusLabel, setProviderStatusLabel] = useState(initialMetadata.providerStatus.statusLabel);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / historyPageSize));
  const safeCurrentHistoryPage = Math.min(currentHistoryPage, totalHistoryPages);
  const currentHistoryPageStart = (safeCurrentHistoryPage - 1) * historyPageSize;
  const paginatedHistory = history.slice(currentHistoryPageStart, currentHistoryPageStart + historyPageSize);
  const currentHistoryRangeStart = history.length === 0 ? 0 : currentHistoryPageStart + 1;
  const currentHistoryRangeEnd = Math.min(history.length, currentHistoryPageStart + paginatedHistory.length);
  const historyPaginationItems = buildPaginationItems(safeCurrentHistoryPage, totalHistoryPages);

  const visibleSyncMessage = isGenerating ? metadata.generateLoadingMessage : resolveSyncMessage(metadata, syncState);

  useEffect(() => {
    let cancelled = false;

    async function syncMetadata() {
      try {
        const response = await getTextGenerationMetadata();

        if (cancelled) {
          return;
        }

        setMetadata(response);
        setTheme(response.defaultConfig.theme);
        setTone(response.defaultConfig.tone);
        setType(response.defaultConfig.type);
        setQuantity(response.defaultConfig.quantity);
        setOutputs(response.sampleOutputs);
        setQualityMetrics(response.defaultQualityMetrics);
        setQualityTip(response.defaultQualityTip);
        setToneKeywords(response.defaultToneKeywords);
        setProviderStatusLabel(response.providerStatus.statusLabel);
      } catch {
        // Keep local metadata fallback when the backend metadata endpoint is unavailable.
      }
    }

    async function syncHistory() {
      try {
        const response = await getGenerationHistory();

        if (cancelled) {
          return;
        }

        setHistory(response.items);
        setCurrentHistoryPage(1);
        setSyncState("history-ready");
      } catch {
        if (!cancelled) {
          setSyncState("fallback");
        }
      }
    }

    void syncMetadata();
    void syncHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate(nextConfig?: {
    theme: string;
    tone: GenerationTone;
    type: GenerationType;
    quantity: number;
  }) {
    const payload = nextConfig ?? { theme, tone, type, quantity };
    setIsGenerating(true);

    try {
      const response = await generateText(payload);

      startTransition(() => {
        setOutputs(response.outputs);
        setHistory(response.history);
        setCurrentHistoryPage(1);
        setQualityMetrics(response.qualityMetrics);
        setQualityTip(response.qualityTip);
        setToneKeywords(response.toneKeywords);
        setLastGeneratedAt(response.generatedAt);
        setCopiedId(null);
        setProviderStatusLabel(response.providerStatusMessage);
      });

      setSyncState("generate-success");
    } catch {
      const fallbackResponse = buildLocalTextGeneration(payload, history);

      startTransition(() => {
        setOutputs(fallbackResponse.outputs);
        setHistory(fallbackResponse.history);
        setCurrentHistoryPage(1);
        setQualityMetrics(fallbackResponse.qualityMetrics);
        setQualityTip(fallbackResponse.qualityTip);
        setToneKeywords(fallbackResponse.toneKeywords);
        setLastGeneratedAt(fallbackResponse.generatedAt);
        setCopiedId(null);
        setProviderStatusLabel(fallbackResponse.providerStatusMessage);
      });

      setSyncState("generate-local-fallback");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleHistoryPageChange(page: number) {
    const nextPage = Math.max(1, Math.min(totalHistoryPages, page));
    setCurrentHistoryPage(nextPage);
  }

  function handleRestoreExample() {
    setTheme(metadata.defaultConfig.theme);
    setTone(metadata.defaultConfig.tone);
    setType(metadata.defaultConfig.type);
    setQuantity(metadata.defaultConfig.quantity);
    setOutputs(metadata.sampleOutputs);
    setQualityMetrics(metadata.defaultQualityMetrics);
    setQualityTip(metadata.defaultQualityTip);
    setToneKeywords(metadata.defaultToneKeywords);
    setCopiedId(null);
    setProviderStatusLabel(metadata.providerStatus.statusLabel);
    setSyncState("restore-example");
  }

  async function handleCopy(output: GenerationOutput) {
    try {
      await navigator.clipboard.writeText(output.body);
      setCopiedId(output.id);
      window.setTimeout(
        () => setCopiedId((current) => (current === output.id ? null : current)),
        1200,
      );
    } catch {
      setSyncState("copy-failure");
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

      <Panel title="生成参数区" icon="pen">
        <div className="generator-config-grid">
          <div className="form-stack">
            <label className="field">
              <span>输入主题</span>
              <textarea value={theme} onChange={(event) => setTheme(event.target.value)} />
            </label>
            <div className="field-caption">{theme.trim().length} / 80</div>
          </div>

          <div className="generator-controls">
            <div>
              <p className="keyword-section__label">语气风格</p>
              <div className="chip-row">
                {metadata.toneOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-button${tone === item ? " chip-button--active" : ""}`}
                    onClick={() => setTone(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="keyword-section__label">生成类型</p>
              <div className="segmented-control segmented-control--spread">
                {metadata.generationTypes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`segmented-control__item${
                      type === item ? " segmented-control__item--active" : ""
                    }`}
                    onClick={() => setType(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="generator-control-row">
              <div>
                <p className="keyword-section__label">生成数量</p>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper__button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    -
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    type="button"
                    className="stepper__button"
                    onClick={() => setQuantity((current) => Math.min(5, current + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="generator-actions">
                <Button variant="secondary" onClick={handleRestoreExample}>
                  {metadata.restoreExampleButtonLabel}
                </Button>
                <Button onClick={() => void handleGenerate()}>
                  {isGenerating ? metadata.generateButtonBusyLabel : metadata.generateButtonLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <section className="page-grid page-grid--content-aside">
        <Panel
          title="生成结果区"
          icon="spark"
          action={<StatusBadge tone={isGenerating ? "accent" : "success"}>已生成 {outputs.length} 条结果</StatusBadge>}
        >
          <div className="output-list">
            {outputs.map((item, index) => (
              <article key={item.id} className="generation-result">
                <div className="generation-result__meta">
                  <span className="generation-result__index">{index + 1}</span>
                  <StatusBadge tone="accent">{item.type}</StatusBadge>
                </div>
                <div className="generation-result__body">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <div className="generation-result__actions">
                  <Button variant="secondary" onClick={() => void handleCopy(item)} icon="copy">
                    {copiedId === item.id ? metadata.copySuccessLabel : metadata.copyActionLabel}
                  </Button>
                  <Button variant="ghost" onClick={() => void handleGenerate()}>
                    {metadata.regenerateButtonLabel}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="stack-list">
          <Panel title="生成质量提示" icon="shield">
            <div className="quality-panel">
              {qualityMetrics.map((metric) => (
                <div key={metric.label} className="quality-meter">
                  <div className="quality-meter__head">
                    <span>{metric.label}</span>
                    <strong>{metric.value}%</strong>
                  </div>
                  <div className="progress-bar progress-bar--soft">
                    <span style={{ width: `${metric.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="生成摘要" icon="light">
            <div className="check-list">
              <div>
                <strong>{providerStatusLabel}</strong>
              </div>
              <div>
                <strong>{tone}风格</strong>
                <p>{qualityTip}</p>
              </div>
              <div>
                <strong>表达关键词</strong>
                <p>{toneKeywords.join(" / ")}</p>
              </div>
              <div>
                <strong>最近生成时间</strong>
                <p>{lastGeneratedAt}</p>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <Panel
        title="历史生成记录"
        icon="history"
        action={
          <span className="records-meta">
            <span className="status-dot status-dot--success" />
            <span>已累计 {history.length} 条记录</span>
          </span>
        }
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>主题</th>
                <th>类型</th>
                <th>语气风格</th>
                <th>生成数量</th>
                <th>时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((item) => (
                <tr key={item.id}>
                  <td>{item.theme}</td>
                  <td>{item.type}</td>
                  <td>{item.tone}</td>
                  <td>{item.count} 条</td>
                  <td>{item.time}</td>
                  <td>
                    <StatusBadge tone={item.status === "已生成" ? "success" : "neutral"}>
                      {item.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalHistoryPages > 1 ? (
          <div className="history-pagination" aria-label="文案生成历史分页">
            <div className="history-pagination__summary">
              {`当前显示 ${currentHistoryRangeStart}-${currentHistoryRangeEnd} 条，共 ${history.length} 条`}
            </div>

            <div className="history-pagination__controls">
              <Button
                variant="secondary"
                onClick={() => handleHistoryPageChange(safeCurrentHistoryPage - 1)}
                disabled={safeCurrentHistoryPage === 1}
              >
                上一页
              </Button>

              <div className="history-pagination__pages">
                {historyPaginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`text-history-ellipsis-${index}`} className="history-pagination__ellipsis" aria-hidden="true">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`history-pagination__page${
                        safeCurrentHistoryPage === item ? " history-pagination__page--active" : ""
                      }`}
                      onClick={() => handleHistoryPageChange(item)}
                      aria-current={safeCurrentHistoryPage === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>

              <Button
                variant="secondary"
                onClick={() => handleHistoryPageChange(safeCurrentHistoryPage + 1)}
                disabled={safeCurrentHistoryPage === totalHistoryPages}
              >
                下一页
              </Button>

              <div className="history-pagination__summary">{`第 ${safeCurrentHistoryPage} / ${totalHistoryPages} 页`}</div>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
