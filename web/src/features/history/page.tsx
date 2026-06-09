import { useDeferredValue, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  downloadHistoryRecords,
  getHistoryMetadata,
  getHistoryRecords,
} from "../../shared/api/client";
import { historyRecords as initialHistoryRecords } from "../../mocks/platformData";
import { formatHistoryOutput } from "../../shared/copy/display";
import { backendApiOperations, type HistoryExportFormat, type HistoryMetadataResponse } from "../../shared/api/types";
import type { HistoryStatus } from "../../shared/types/platform";
import { Button, Panel, StatusBadge } from "../../shared/ui/Surface";

const statusToneMap: Record<HistoryStatus, "success" | "warning" | "neutral"> = {
  成功: "success",
  警告: "warning",
  失败: "neutral",
};

const initialHistoryMetadata: HistoryMetadataResponse = {
  pageTitle: "历史记录",
  pageDescription: "查看平台各模块的运行记录，并按条件筛选或导出结果。",
  syncConnectedMessage: "已连接历史记录接口。",
  syncLoadingMessage: "正在同步历史记录...",
  syncReadyMessage: "历史记录已由后端接口实时提供。",
  syncFallbackMessage: "历史记录接口暂时不可用，当前展示的是本地演示数据。",
  filterPanelTitle: "筛选记录",
  searchFieldLabel: "搜索内容",
  searchPlaceholder: "搜索输入内容、输出结果或记录 ID...",
  moduleFilterLabel: "模块筛选",
  statusFilterLabel: "状态筛选",
  exportFormatLabel: "导出格式",
  clearFiltersLabel: "清空筛选",
  exportButtonLabel: "导出",
  exportButtonBusyLabel: "导出中...",
  exportSuccessMessageTemplate: "历史记录已从后端导出为 {format} 文件。",
  exportFallbackMessage: "历史记录导出接口暂时不可用，已导出当前页面数据。",
  tableTitle: "运行记录",
  tableLoadingMessage: "正在同步...",
  tableCountTemplate: "共 {count} 条记录",
  tableHeaders: ["记录 ID", "时间", "实验模块", "输入内容", "输出结果", "置信度 / 评分", "状态", "操作"],
  rowActionLabel: "查看",
  projectOverviewTitle: "",
  moduleSpotlightActionLabel: "",
  moduleFilters: ["全部", "图像识别", "情感分析", "文案生成", "博物馆图像理解"],
  statusFilters: ["全部", "成功", "警告", "失败"],
  exportFormats: [
    { label: "JSON", value: "json" },
    { label: "CSV", value: "csv" },
  ],
  overviewSections: [],
  valuePoints: [],
  moduleSpotlights: [],
};

const historyQueryDefaults = backendApiOperations.history_api_v1_history_get.queryDefaults;
const historyExportQueryDefaults = backendApiOperations.export_history_api_v1_history_export_get.queryDefaults;
const defaultModuleFilter = historyQueryDefaults.module ?? "全部";
const defaultStatusFilter = historyQueryDefaults.status ?? "全部";
const defaultExportFormat = historyExportQueryDefaults.format ?? "json";
const historyPageSize = 8;

type HistorySyncState =
  | { kind: "connected" }
  | { kind: "ready" }
  | { kind: "fallback" }
  | { kind: "export-success"; format: HistoryExportFormat }
  | { kind: "export-fallback" };

function applyTemplate(template: string, values: Record<string, string | number>) {
  return template.replaceAll(/\{(\w+)\}/g, (placeholder, key) => {
    if (!(key in values)) {
      return placeholder;
    }

    return String(values[key]);
  });
}

function resolveSyncMessage(metadata: HistoryMetadataResponse, syncState: HistorySyncState) {
  switch (syncState.kind) {
    case "export-success":
      return applyTemplate(metadata.exportSuccessMessageTemplate, {
        format: syncState.format.toUpperCase(),
      });
    case "export-fallback":
      return metadata.exportFallbackMessage;
    default:
      return "";
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

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const [moduleFilter, setModuleFilter] = useState<string>(defaultModuleFilter);
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter);
  const [records, setRecords] = useState(initialHistoryRecords);
  const [metadata, setMetadata] = useState(initialHistoryMetadata);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<HistoryExportFormat>(defaultExportFormat);
  const [syncState, setSyncState] = useState<HistorySyncState>({ kind: "ready" });

  const deferredKeyword = useDeferredValue(keyword);
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(records.length / historyPageSize));
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.min(Math.floor(requestedPage), totalPages) : 1;
  const currentPageStart = (currentPage - 1) * historyPageSize;
  const paginatedRecords = records.slice(currentPageStart, currentPageStart + historyPageSize);
  const currentPageRangeStart = records.length === 0 ? 0 : currentPageStart + 1;
  const currentPageRangeEnd = Math.min(records.length, currentPageStart + paginatedRecords.length);
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const visibleSyncMessage = isLoading ? metadata.syncLoadingMessage : resolveSyncMessage(metadata, syncState);

  useEffect(() => {
    let cancelled = false;

    async function syncMetadata() {
      try {
        const response = await getHistoryMetadata();

        if (cancelled) {
          return;
        }

        setMetadata(response);
      } catch {
        // Keep local metadata fallback when the backend metadata endpoint is unavailable.
      }
    }

    void syncMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncHistory() {
      setIsLoading(true);

      try {
        const response = await getHistoryRecords({
          keyword: deferredKeyword,
          module: moduleFilter,
          status: statusFilter,
        });

        if (cancelled) {
          return;
        }

        setRecords(response.records);
      } catch {
        // Keep local history fallback data when the backend history endpoint is unavailable.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void syncHistory();

    return () => {
      cancelled = true;
    };
  }, [deferredKeyword, moduleFilter, statusFilter]);

  function handlePageChange(page: number) {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (keyword) {
      nextSearchParams.set("keyword", keyword);
    } else {
      nextSearchParams.delete("keyword");
    }

    if (page <= 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(page));
    }

    setSearchParams(nextSearchParams);
  }

  function handleClearFilters() {
    setSearchParams({});
    setModuleFilter(defaultModuleFilter);
    setStatusFilter(defaultStatusFilter);
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function serializeRecordsToCsv() {
    const header = ["记录 ID", "日期", "时间", "实验模块", "输入内容", "输出结果", "置信度 / 评分", "状态", "路由"];
    const rows = records.map((record) => [
      record.id,
      record.date,
      record.time,
      record.module,
      record.inputContent,
      record.output,
      record.confidence,
      record.status,
      record.route,
    ]);

    return [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
  }

  async function handleExportLogs() {
    setIsExporting(true);

    try {
      const { blob, filename } = await downloadHistoryRecords(
        {
          keyword,
          module: moduleFilter,
          status: statusFilter,
        },
        exportFormat,
      );
      triggerDownload(blob, filename);
      setSyncState({ kind: "export-success", format: exportFormat });
    } catch {
      const blob =
        exportFormat === "csv"
          ? new Blob([`\ufeff${serializeRecordsToCsv()}`], { type: "text/csv;charset=utf-8" })
          : new Blob([JSON.stringify(records, null, 2)], {
              type: "application/json;charset=utf-8",
            });
      const fallbackFilename = exportFormat === "csv" ? "history-records.csv" : "history-records.json";
      triggerDownload(blob, fallbackFilename);
      setSyncState({ kind: "export-fallback" });
    } finally {
      setIsExporting(false);
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

      <Panel title={metadata.filterPanelTitle} icon="filter" className="history-filter-panel">
        <div className="history-filter-stack">
          <div className="history-toolbar history-toolbar--top">
            <label className="field field--compact history-search">
              <span>{metadata.searchFieldLabel}</span>
              <input
                type="search"
                value={keyword}
                onChange={(event) => {
                  const value = event.target.value;
                  const nextSearchParams = new URLSearchParams();

                  if (value) {
                    nextSearchParams.set("keyword", value);
                  }

                  setSearchParams(nextSearchParams);
                }}
                placeholder={metadata.searchPlaceholder}
              />
            </label>

            <div className="history-filter-group">
              <p className="keyword-section__label">{metadata.moduleFilterLabel}</p>
              <div className="chip-row">
                {metadata.moduleFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-button${moduleFilter === item ? " chip-button--active" : ""}`}
                    onClick={() => {
                      setModuleFilter(item);
                      handlePageChange(1);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="history-toolbar history-toolbar--bottom">
            <label className="field field--compact history-select">
              <span>{metadata.statusFilterLabel}</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  handlePageChange(1);
                }}
              >
                {metadata.statusFilters.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--compact history-select">
              <span>{metadata.exportFormatLabel}</span>
              <select
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as HistoryExportFormat)}
              >
                {metadata.exportFormats.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="history-actions">
              <Button variant="secondary" onClick={handleClearFilters}>
                {metadata.clearFiltersLabel}
              </Button>
              <Button icon="download" onClick={handleExportLogs}>
                {isExporting ? metadata.exportButtonBusyLabel : metadata.exportButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title={metadata.tableTitle}
        icon="history"
        action={
          <div className="records-meta">
            {isLoading ? metadata.tableLoadingMessage : applyTemplate(metadata.tableCountTemplate, { count: records.length })}
          </div>
        }
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {metadata.tableHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>
                    {record.date} {record.time}
                  </td>
                  <td>{record.module}</td>
                  <td>{record.inputContent}</td>
                  <td>{formatHistoryOutput(record.module, record.output)}</td>
                  <td>{record.confidence}</td>
                  <td>
                    <StatusBadge tone={statusToneMap[record.status]}>{record.status}</StatusBadge>
                  </td>
                  <td>
                    <Link to={record.route} className="table-action">
                      {metadata.rowActionLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="history-pagination" aria-label="历史记录分页">
            <div className="history-pagination__summary">
              {`当前显示 ${currentPageRangeStart}-${currentPageRangeEnd} 条，共 ${records.length} 条`}
            </div>

            <div className="history-pagination__controls">
              <Button
                variant="secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>

              <div className="history-pagination__pages">
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="history-pagination__ellipsis" aria-hidden="true">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`history-pagination__page${currentPage === item ? " history-pagination__page--active" : ""}`}
                      onClick={() => handlePageChange(item)}
                      aria-current={currentPage === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>

              <Button
                variant="secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>

              <div className="history-pagination__summary">{`第 ${currentPage} / ${totalPages} 页`}</div>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
