import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./page";

const { getDashboardMetadataMock, getDashboardSummaryMock, getRuntimeAssetsMock, warmRuntimeAssetsMock } = vi.hoisted(() => ({
  getDashboardMetadataMock: vi.fn(),
  getDashboardSummaryMock: vi.fn(),
  getRuntimeAssetsMock: vi.fn(),
  warmRuntimeAssetsMock: vi.fn(),
}));

vi.mock("../../shared/api/client", () => ({
  getDashboardMetadata: getDashboardMetadataMock,
  getDashboardSummary: getDashboardSummaryMock,
  getRuntimeAssets: getRuntimeAssetsMock,
  warmRuntimeAssets: warmRuntimeAssetsMock,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers backend-provided dashboard metadata for intro and hero copy", async () => {
    getDashboardMetadataMock.mockResolvedValue({
      pageTitle: "课程成果总览",
      pageDescription: "后端下发的首页说明文案。",
      syncLoadingMessage: "后端摘要同步中",
      syncReadyMessage: "后端摘要已接通。",
      syncFallbackMessage: "摘要接口暂不可用。",
      heroTitle: "后端首页横幅标题",
      heroDescription: "后端首页横幅描述文案。",
      primaryAction: {
        label: "进入图像模块",
        route: "/image-recognition",
      },
      secondaryAction: {
        label: "查看项目记录",
        route: "/history",
      },
      moduleActionLabel: "后端进入模块",
      runtimePanelTitle: "运行资源后端标题",
      runtimePanelLoadingMessage: "运行资源后端加载文案",
      runtimePanelErrorMessage: "运行资源后端失败文案",
      runtimeWarmActionColdLabel: "执行运行时预热",
      runtimeWarmActionReadyLabel: "重新同步运行时缓存",
      runtimeWarmActionBusyLabel: "运行时预热中",
      runtimeAssetCacheFileLabel: "后端缓存文件标签",
      runtimeAssetCacheReadyLabel: "后端缓存已生成",
      runtimeAssetCacheMissingLabel: "后端缓存未生成",
      runtimeAssetCacheSizeLabel: "后端缓存体积标签",
      runtimeAssetUpdatedAtLabel: "后端更新时间标签",
      runtimeAssetMissingUpdatedAtLabel: "后端暂无更新时间",
      historyPanelTitle: "后端实验记录标题",
      historyPanelActionLabel: "查看后端记录",
      historyTableHeaders: ["后端时间列", "后端模块列", "后端输入列", "后端输出列", "后端状态列"],
    });
    getDashboardSummaryMock.mockResolvedValue({
      modules: [
        {
          title: "后端图像模块",
          description: "后端模块说明文案。",
          route: "/image-recognition",
          statusLabel: "已联调",
          statusTone: "success",
          icon: "image",
        },
      ],
      metrics: [],
      recentHistory: [],
    });
    getRuntimeAssetsMock.mockResolvedValue({
      assets: [
        {
          key: "herbal-classifier",
          label: "中药分类器缓存",
          description: "基于 experiment-01 中药样本训练的轻量分类器缓存。",
          cachePath: "/tmp/herbal-classifier.pkl",
          cacheExists: false,
          cacheReady: false,
          cacheSizeBytes: null,
          cacheUpdatedAt: null,
          datasetStatus: "ready",
          statusLabel: "待预热",
          statusTone: "warning",
          note: "数据集已就位，但缓存尚未准备；可先执行一次预热。",
        },
      ],
      summaryMessage: "后端运行时状态摘要。",
    });
    warmRuntimeAssetsMock.mockResolvedValue({
      assets: [
        {
          key: "herbal-classifier",
          label: "中药分类器缓存",
          description: "基于 experiment-01 中药样本训练的轻量分类器缓存。",
          cachePath: "/tmp/herbal-classifier.pkl",
          cacheExists: true,
          cacheReady: true,
          cacheSizeBytes: 4467795,
          cacheUpdatedAt: "2026-06-06 04:21:58",
          datasetStatus: "ready",
          statusLabel: "就绪",
          statusTone: "success",
          note: "已生成可复用缓存，新后端进程启动后可直接复用。",
        },
      ],
      warmedKeys: ["herbal-classifier"],
      totalDurationMs: 84,
      warmedAt: "2026-06-06 04:21:58",
      summaryMessage: "后端预热完成文案。",
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: "课程成果总览" })).toBeInTheDocument();
    expect(await screen.findByText("后端下发的首页说明文案。")).toBeInTheDocument();
    expect(screen.queryByText("后端摘要已接通。")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "后端首页横幅标题" })).toBeInTheDocument();
    expect(await screen.findByText("后端首页横幅描述文案。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入图像模块" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看项目记录" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /后端进入模块/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "运行资源后端标题" })).toBeInTheDocument();
    expect(await screen.findByText("后端运行时状态摘要。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "执行运行时预热" })).toBeInTheDocument();
    expect(screen.getByText("后端缓存文件标签：后端缓存未生成")).toBeInTheDocument();
    expect(screen.getByText("后端缓存体积标签：后端缓存未生成")).toBeInTheDocument();
    expect(screen.getByText("后端更新时间标签：后端暂无更新时间")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端实验记录标题" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /查看后端记录/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端时间列" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端模块列" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端输入列" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端输出列" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端状态列" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "执行运行时预热" }));

    await waitFor(() => {
      expect(warmRuntimeAssetsMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("后端预热完成文案。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新同步运行时缓存" })).toBeInTheDocument();
  });

  it("shows runtime asset status and updates after warmup", async () => {
    getDashboardMetadataMock.mockRejectedValue(new Error("metadata unavailable"));
    getDashboardSummaryMock.mockResolvedValue({
      modules: [],
      metrics: [],
      recentHistory: [],
    });
    getRuntimeAssetsMock.mockResolvedValue({
      assets: [
        {
          key: "herbal-classifier",
          label: "中药分类器缓存",
          description: "基于 experiment-01 中药样本训练的轻量分类器缓存。",
          cachePath: "/tmp/herbal-classifier.pkl",
          cacheExists: false,
          cacheReady: false,
          cacheSizeBytes: null,
          cacheUpdatedAt: null,
          datasetStatus: "ready",
          statusLabel: "待预热",
          statusTone: "warning",
          note: "数据集已就位，但缓存尚未准备；可先执行一次预热。",
        },
        {
          key: "museum-feature-index",
          label: "博物馆特征索引缓存",
          description: "基于 experiment-03 馆藏图片构建的相似度检索特征索引。",
          cachePath: "/tmp/museum-feature-index.pkl",
          cacheExists: false,
          cacheReady: false,
          cacheSizeBytes: null,
          cacheUpdatedAt: null,
          datasetStatus: "ready",
          statusLabel: "待预热",
          statusTone: "warning",
          note: "数据集已就位，但缓存尚未准备；可先执行一次预热。",
        },
      ],
      summaryMessage: "当前已就绪 0/2 项运行时缓存，建议先执行一次预热。",
    });
    warmRuntimeAssetsMock.mockResolvedValue({
      assets: [
        {
          key: "herbal-classifier",
          label: "中药分类器缓存",
          description: "基于 experiment-01 中药样本训练的轻量分类器缓存。",
          cachePath: "/tmp/herbal-classifier.pkl",
          cacheExists: true,
          cacheReady: true,
          cacheSizeBytes: 4467795,
          cacheUpdatedAt: "2026-06-06 04:21:58",
          datasetStatus: "ready",
          statusLabel: "就绪",
          statusTone: "success",
          note: "已生成可复用缓存，新后端进程启动后可直接复用。",
        },
        {
          key: "museum-feature-index",
          label: "博物馆特征索引缓存",
          description: "基于 experiment-03 馆藏图片构建的相似度检索特征索引。",
          cachePath: "/tmp/museum-feature-index.pkl",
          cacheExists: true,
          cacheReady: true,
          cacheSizeBytes: 9112587,
          cacheUpdatedAt: "2026-06-06 04:21:58",
          datasetStatus: "ready",
          statusLabel: "就绪",
          statusTone: "success",
          note: "已生成可复用缓存，新后端进程启动后可直接复用。",
        },
      ],
      warmedKeys: ["herbal-classifier", "museum-feature-index"],
      totalDurationMs: 84,
      warmedAt: "2026-06-06 04:21:58",
      summaryMessage: "已就绪 2/2 项运行时缓存，新后端进程可直接复用。 本次预热耗时 84 ms。",
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "运行时资源状态" })).toBeInTheDocument();
    expect(screen.queryByText("已接入后端汇总接口，统计数据会随联调结果更新。")).not.toBeInTheDocument();
    expect(await screen.findByText("中药分类器缓存")).toBeInTheDocument();
    expect(await screen.findByText("博物馆特征索引缓存")).toBeInTheDocument();
    expect(await screen.findAllByText("待预热")).toHaveLength(2);
    expect(await screen.findByText("当前已就绪 0/2 项运行时缓存，建议先执行一次预热。")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "执行预热" }));

    await waitFor(() => {
      expect(warmRuntimeAssetsMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findAllByText("就绪")).toHaveLength(2);
    expect(await screen.findByText("已就绪 2/2 项运行时缓存，新后端进程可直接复用。 本次预热耗时 84 ms。")).toBeInTheDocument();
  });
});
