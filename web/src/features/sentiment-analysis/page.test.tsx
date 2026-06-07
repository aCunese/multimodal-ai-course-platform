import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SentimentAnalysisPage } from "./page";

const { analyzeSentimentMock, getSentimentAnalysisMetadataMock } = vi.hoisted(() => ({
  analyzeSentimentMock: vi.fn(),
  getSentimentAnalysisMetadataMock: vi.fn(),
}));

vi.mock("../../shared/api/client", () => ({
  analyzeSentiment: analyzeSentimentMock,
  getSentimentAnalysisMetadata: getSentimentAnalysisMetadataMock,
}));

describe("SentimentAnalysisPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the default sample, supports re-analysis, and filters negative keywords", async () => {
    getSentimentAnalysisMetadataMock.mockResolvedValue({
      pageTitle: "后端情感分析页",
      pageDescription: "后端情感页说明文案。",
      syncLoadingMessage: "后端同步中",
      syncAnalyzingMessage: "后端分析调用中",
      syncReadyMessage: "后端分析已接通",
      syncFallbackMessage: "后端分析兜底",
      emptyInputMessage: "后端要求先输入文本",
      textInputLabel: "后端文本输入标签",
      clearButtonLabel: "后端清空",
      sampleButtonLabel: "后端示例文本",
      analyzeButtonLabel: "后端开始分析",
      analyzeButtonBusyLabel: "后端分析中...",
      positiveOnlyButtonLabel: "后端仅积极",
      showAllButtonLabel: "后端显示全部",
      sampleText: "Backend sample review text.",
      pendingResult: {
        label: "中性",
        englishLabel: "Neutral",
        confidence: 50,
        score: 0,
        tags: ["待分析"],
        positiveMatches: [
          { label: "great", score: 0.88 },
          { label: "moving", score: 0.82 },
        ],
        negativeMatches: [{ label: "slow", score: 0.18 }],
        explanation: "等待后端默认示例启动分析。",
        status: "待分析",
        processingTime: "--",
        taskId: "SA-BACKEND-PENDING",
        completedAt: "--",
        providerUsed: "local",
        usedFallback: false,
        providerStatusMessage: "当前分析引擎：本地词典",
        historyRecord: {
          id: "#2099",
          date: "2026-06-06",
          time: "16:29",
          module: "情感分析",
          inputType: "文本",
          inputContent: "Backend sample",
          output: "Pending",
          confidence: "--",
          status: "成功",
          route: "/sentiment-analysis",
        },
      },
      providerStatus: {
        configuredProvider: "deepseek",
        activeProvider: "deepseek",
        enabled: true,
        statusLabel: "当前分析引擎：DeepSeek",
        detailMessage: "后端当前已启用 DeepSeek 情感分析。",
      },
      modelLabel: "后端情感模型说明",
      analysisNote: "后端分析说明文案。",
    });

    analyzeSentimentMock
      .mockResolvedValueOnce({
        label: "正面",
        englishLabel: "Positive",
        confidence: 91,
        score: 0.84,
        tags: ["积极", "细腻"],
        positiveMatches: [
          { label: "wonderful", score: 0.94 },
          { label: "moving", score: 0.82 },
        ],
        negativeMatches: [{ label: "slow", score: 0.18 }],
        explanation: "文本整体呈现积极评价，画面感和情绪表达都偏正向。",
        status: "已完成",
        processingTime: "118 ms",
        taskId: "SA-1001",
        completedAt: "2026-06-06 16:30:00",
        providerUsed: "deepseek",
        usedFallback: false,
        providerStatusMessage: "当前分析引擎：DeepSeek",
        historyRecord: {
          id: "#2101",
          date: "2026-06-06",
          time: "16:30",
          module: "情感分析",
          inputType: "文本",
          inputContent: "sample",
          output: "Positive",
          confidence: "91%",
          status: "成功",
          route: "/sentiment-analysis",
        },
      })
      .mockResolvedValueOnce({
        label: "负面",
        englishLabel: "Negative",
        confidence: 88,
        score: -0.72,
        tags: ["消极", "失望"],
        positiveMatches: [{ label: "recommended", score: 0.31 }],
        negativeMatches: [
          { label: "flop", score: 0.91 },
          { label: "copied", score: 0.73 },
        ],
        explanation: "文本包含明显消极词汇，整体判断为负面倾向。",
        status: "已完成",
        processingTime: "126 ms",
        taskId: "SA-1002",
        completedAt: "2026-06-06 16:31:00",
        providerUsed: "deepseek",
        usedFallback: false,
        providerStatusMessage: "当前分析引擎：DeepSeek",
        historyRecord: {
          id: "#2102",
          date: "2026-06-06",
          time: "16:31",
          module: "情感分析",
          inputType: "文本",
          inputContent: "negative",
          output: "Negative",
          confidence: "88%",
          status: "成功",
          route: "/sentiment-analysis",
        },
      });

    render(<SentimentAnalysisPage />);

    expect(getSentimentAnalysisMetadataMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("heading", { level: 1, name: "后端情感分析页" })).toBeInTheDocument();
    expect(screen.getByText("后端情感页说明文案。")).toBeInTheDocument();
    expect(await screen.findByText("正面判断")).toBeInTheDocument();
    expect(await screen.findByText("精彩")).toBeInTheDocument();
    expect(await screen.findByText("节奏慢")).toBeInTheDocument();
    expect(screen.getByText("后端情感模型说明")).toBeInTheDocument();
    expect(screen.getByText("后端分析说明文案。")).toBeInTheDocument();
    expect(screen.getByLabelText("后端文本输入标签")).toBeInTheDocument();
    expect(screen.queryByText("后端分析已接通")).not.toBeInTheDocument();
    expect(screen.getByText("当前分析引擎：DeepSeek")).toBeInTheDocument();
    expect(screen.getByText("后端当前已启用 DeepSeek 情感分析。")).toBeInTheDocument();

    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "This sequel is a flop and feels copied.");
    await userEvent.click(screen.getByRole("button", { name: "后端开始分析" }));

    expect(await screen.findByText("负面判断")).toBeInTheDocument();
    expect(await screen.findByText("失败")).toBeInTheDocument();
    expect(await screen.findByText("缺乏新意")).toBeInTheDocument();
    expect(screen.getByText("后端分析已接通")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "后端仅积极" }));

    await waitFor(() => {
      expect(screen.queryByText("缺乏新意")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "后端显示全部" })).toBeInTheDocument();

    expect(analyzeSentimentMock).toHaveBeenNthCalledWith(
      1,
      "Backend sample review text.",
    );
    expect(analyzeSentimentMock).toHaveBeenNthCalledWith(
      2,
      "This sequel is a flop and feels copied.",
    );
  });

  it("falls back to a local analysis based on the current input when the backend analyze request fails", async () => {
    getSentimentAnalysisMetadataMock.mockRejectedValue(new Error("metadata offline"));
    analyzeSentimentMock.mockRejectedValue(new Error("analyze offline"));

    render(<SentimentAnalysisPage />);

    const textbox = screen.getByRole("textbox");
    await userEvent.clear(textbox);
    await userEvent.type(textbox, "This sequel is a flop and feels copied.");
    await userEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(await screen.findByText("负面判断")).toBeInTheDocument();
    expect(
      screen.getByText("情感分析接口暂时不可用，当前已根据输入内容执行本地兜底分析。"),
    ).toBeInTheDocument();
    expect(screen.getByText("当前分析引擎：本地规则兜底")).toBeInTheDocument();
    expect(screen.getAllByText("已完成")).toHaveLength(2);
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.getByText("缺乏新意")).toBeInTheDocument();
  });
});
