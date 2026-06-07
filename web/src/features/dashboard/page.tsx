import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "../../assets/hero/dashboard-hero.png";
import shieldArtwork from "../../assets/illustrations/shield-orbit.png";
import cubeArtwork from "../../assets/illustrations/data-cube.png";
import { getDashboardMetadata, getDashboardSummary, getRuntimeAssets, warmRuntimeAssets } from "../../shared/api/client";
import type { DashboardMetadataResponse, DashboardSummaryResponse, RuntimeAssetStatus } from "../../shared/api/types";
import type { HistoryStatus } from "../../shared/types/platform";
import { dashboardMetrics, dashboardModules, historyRecords } from "../../mocks/platformData";
import { Button, Panel, StatusBadge } from "../../shared/ui/Surface";
import { Icon } from "../../shared/ui/Icon";

const statusToneMap: Record<HistoryStatus, "success" | "warning" | "neutral"> = {
  成功: "success",
  警告: "warning",
  失败: "neutral",
};

const initialSummary: DashboardSummaryResponse = {
  modules: dashboardModules,
  metrics: dashboardMetrics,
  recentHistory: historyRecords,
};

const initialMetadata: DashboardMetadataResponse = {
  pageTitle: "首页总览",
  pageDescription: "探索多模态 AI 能力，体验前端技术，并将课程成果整理为统一的演示平台。",
  syncLoadingMessage: "正在同步后端汇总数据...",
  syncReadyMessage: "已接入后端汇总接口，统计数据会随联调结果更新。",
  syncFallbackMessage: "后端汇总接口暂时不可用，当前展示的是本地演示数据。",
  heroTitle: "多模态 AI 课程成果平台",
  heroDescription:
    "整合图像分类、文本情感分析、文本生成与博物馆图像理解实验，形成统一的 AI 课程成果展示与交互平台。",
  primaryAction: {
    label: "开始体验",
    route: "/image-recognition",
  },
  secondaryAction: {
    label: "查看实验模块",
    route: "/history",
  },
  moduleActionLabel: "进入模块",
  runtimePanelTitle: "运行时资源状态",
  runtimePanelLoadingMessage: "正在检查运行时缓存状态...",
  runtimePanelErrorMessage: "暂时无法读取后端运行时资源状态，请稍后重试。",
  runtimeWarmActionColdLabel: "执行预热",
  runtimeWarmActionReadyLabel: "重新预热",
  runtimeWarmActionBusyLabel: "预热中...",
  runtimeAssetCacheFileLabel: "缓存文件",
  runtimeAssetCacheReadyLabel: "已生成",
  runtimeAssetCacheMissingLabel: "未生成",
  runtimeAssetCacheSizeLabel: "缓存体积",
  runtimeAssetUpdatedAtLabel: "更新时间",
  runtimeAssetMissingUpdatedAtLabel: "暂无",
  historyPanelTitle: "最近实验记录",
  historyPanelActionLabel: "查看全部记录",
  historyTableHeaders: ["时间", "实验模块", "输入类型", "输出结果", "状态"],
};

function formatCacheSize(size?: number | null) {
  if (!size || size <= 0) {
    return null;
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(initialMetadata);
  const [summary, setSummary] = useState(initialSummary);
  const [syncState, setSyncState] = useState<"loading" | "ready" | "fallback">("loading");
  const [runtimeAssets, setRuntimeAssets] = useState<RuntimeAssetStatus[]>([]);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(true);
  const [isRuntimeWarming, setIsRuntimeWarming] = useState(false);
  const [runtimeMessage, setRuntimeMessage] = useState(initialMetadata.runtimePanelLoadingMessage);

  useEffect(() => {
    let cancelled = false;

    async function syncDashboardMetadata() {
      try {
        const response = await getDashboardMetadata();

        if (cancelled) {
          return;
        }

        setMetadata(response);
        setRuntimeMessage((currentMessage) =>
          currentMessage === initialMetadata.runtimePanelLoadingMessage
            ? response.runtimePanelLoadingMessage
            : currentMessage,
        );
      } catch {
        // Keep local metadata fallback when the backend metadata endpoint is unavailable.
      }
    }

    void syncDashboardMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncDashboard() {
      setSyncState("loading");

      try {
        const response = await getDashboardSummary();

        if (cancelled) {
          return;
        }

        setSummary(response);
        setSyncState("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setSyncState("fallback");
      }
    }

    void syncDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncRuntimeAssets() {
      setIsRuntimeLoading(true);
      setRuntimeMessage(metadata.runtimePanelLoadingMessage);

      try {
        const response = await getRuntimeAssets();

        if (cancelled) {
          return;
        }

        setRuntimeAssets(response.assets);
        setRuntimeMessage(response.summaryMessage);
      } catch {
        if (cancelled) {
          return;
        }

        setRuntimeMessage(metadata.runtimePanelErrorMessage);
      } finally {
        if (!cancelled) {
          setIsRuntimeLoading(false);
        }
      }
    }

    void syncRuntimeAssets();

    return () => {
      cancelled = true;
    };
  }, [metadata.runtimePanelErrorMessage, metadata.runtimePanelLoadingMessage]);

  const availableRuntimeAssets = runtimeAssets.filter((asset) => asset.datasetStatus === "ready");
  const coldRuntimeAssets = availableRuntimeAssets.filter((asset) => !asset.cacheReady);
  const runtimeActionLabel = isRuntimeWarming
    ? metadata.runtimeWarmActionBusyLabel
    : coldRuntimeAssets.length > 0
      ? metadata.runtimeWarmActionColdLabel
      : metadata.runtimeWarmActionReadyLabel;
  const visibleSyncMessage =
    syncState === "loading"
      ? metadata.syncLoadingMessage
      : syncState === "fallback"
        ? metadata.syncFallbackMessage
        : "";

  async function handleWarmRuntimeAssets() {
    setIsRuntimeWarming(true);
    setRuntimeMessage(metadata.runtimeWarmActionBusyLabel);

    try {
      const response = await warmRuntimeAssets();
      setRuntimeAssets(response.assets);
      setRuntimeMessage(response.summaryMessage);
    } catch {
      setRuntimeMessage(metadata.runtimePanelErrorMessage);
    } finally {
      setIsRuntimeWarming(false);
      setIsRuntimeLoading(false);
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

      <section className="hero-banner" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-banner__overlay" />
        <div className="hero-banner__content">
          <p className="hero-banner__eyebrow">课程项目总览</p>
          <h2>{metadata.heroTitle}</h2>
          <p>{metadata.heroDescription}</p>
          <div className="hero-banner__actions">
            <Button onClick={() => navigate(metadata.primaryAction.route)}>
              {metadata.primaryAction.label}
            </Button>
            <Button variant="secondary" onClick={() => navigate(metadata.secondaryAction.route)}>
              {metadata.secondaryAction.label}
            </Button>
          </div>
          <div className="hero-banner__facts" aria-label="平台关键摘要">
            <span>{`${summary.modules.length} 个实验模块`}</span>
            <span>{`${summary.recentHistory.length} 条近期记录`}</span>
            <span>{`${availableRuntimeAssets.length} 项缓存可用`}</span>
          </div>
        </div>
      </section>

      <section className="modules-grid">
        {summary.modules.map((module) => (
          <Panel key={module.title} className="module-card">
            <div className="module-card__top">
              <span className="module-card__icon">
                <Icon name={module.icon} size={22} />
              </span>
              <div>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </div>
            </div>
            <div className="module-card__bottom">
              <StatusBadge tone={module.statusTone}>{module.statusLabel}</StatusBadge>
              <Link to={module.route} className="inline-link">
                <span>{metadata.moduleActionLabel}</span>
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </Panel>
        ))}
      </section>

      <section className="metrics-grid">
        {summary.metrics.map((metric, index) => (
          <Panel
            key={metric.label}
            className={`metric-card${index < 2 ? " metric-card--with-art" : ""}`}
          >
            <div className="metric-card__meta">
              <span className="metric-card__icon">
                <Icon name={metric.icon} size={20} />
              </span>
              <p>{metric.label}</p>
            </div>
            <strong>{metric.value}</strong>
            <p>{metric.caption}</p>
            {index === 0 ? (
              <img src={cubeArtwork} alt="" className="metric-card__art metric-card__art--cube" />
            ) : null}
            {index === 1 ? (
              <img
                src={shieldArtwork}
                alt=""
                className="metric-card__art metric-card__art--shield"
              />
            ) : null}
          </Panel>
        ))}
      </section>

      <Panel
        title={metadata.runtimePanelTitle}
        icon="database"
        action={
          <Button
            variant="secondary"
            icon="refresh"
            onClick={() => void handleWarmRuntimeAssets()}
            disabled={isRuntimeWarming || runtimeAssets.length === 0}
          >
            {runtimeActionLabel}
          </Button>
        }
      >
        <p className="field-caption runtime-assets__caption">
          {isRuntimeLoading ? metadata.runtimePanelLoadingMessage : runtimeMessage}
        </p>
        <div className="page-grid page-grid--two runtime-assets-grid">
          {runtimeAssets.map((asset) => (
            <Panel key={asset.key} className="runtime-asset-card">
              <div className="runtime-asset-card__top">
                <div>
                  <h3>{asset.label}</h3>
                  <p>{asset.description}</p>
                </div>
                <StatusBadge tone={asset.statusTone}>{asset.statusLabel}</StatusBadge>
              </div>
              <p className="runtime-asset-card__note">{asset.note}</p>
              <div className="runtime-asset-card__meta">
                <span>
                  {metadata.runtimeAssetCacheFileLabel}：
                  {asset.cacheExists ? metadata.runtimeAssetCacheReadyLabel : metadata.runtimeAssetCacheMissingLabel}
                </span>
                <span>
                  {metadata.runtimeAssetCacheSizeLabel}：
                  {formatCacheSize(asset.cacheSizeBytes) ?? metadata.runtimeAssetCacheMissingLabel}
                </span>
                <span>
                  {metadata.runtimeAssetUpdatedAtLabel}：
                  {asset.cacheUpdatedAt ?? metadata.runtimeAssetMissingUpdatedAtLabel}
                </span>
              </div>
              <p className="runtime-asset-card__path">{asset.cachePath}</p>
            </Panel>
          ))}
        </div>
      </Panel>

      <Panel
        title={metadata.historyPanelTitle}
        action={
          <Link to="/history" className="inline-link">
            <span>{metadata.historyPanelActionLabel}</span>
            <Icon name="arrow-right" size={16} />
          </Link>
        }
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {metadata.historyTableHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.recentHistory.map((record) => (
                <tr key={record.id}>
                  <td>{record.time}</td>
                  <td>{record.module}</td>
                  <td>{record.inputType}</td>
                  <td>{record.output}</td>
                  <td>
                    <StatusBadge tone={statusToneMap[record.status]}>{record.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
