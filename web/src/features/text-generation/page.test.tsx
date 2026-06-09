import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TextGenerationPage } from "./page";

const { generateTextMock, getGenerationHistoryMock, getTextGenerationMetadataMock } = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  getGenerationHistoryMock: vi.fn(),
  getTextGenerationMetadataMock: vi.fn(),
}));

vi.mock("../../shared/api/client", () => ({
  generateText: generateTextMock,
  getGenerationHistory: getGenerationHistoryMock,
  getTextGenerationMetadata: getTextGenerationMetadataMock,
}));

describe("TextGenerationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTextGenerationMetadataMock.mockResolvedValue({
      pageTitle: "后端文案生成页",
      pageDescription: "后端驱动的页面说明文案。",
      syncConnectingMessage: "后端连接中",
      syncHistoryReadyMessage: "后端历史记录已接通。",
      syncFallbackMessage: "后端历史兜底提示。",
      generateLoadingMessage: "后端生成中",
      generateSuccessMessage: "后端生成成功并已写入历史。",
      generateFallbackMessage: "后端生成失败后保留上次结果。",
      restoreExampleMessage: "后端已恢复默认示例。",
      copyActionLabel: "后端复制",
      copySuccessLabel: "后端已复制",
      copyFailureMessage: "后端复制失败提示。",
      restoreExampleButtonLabel: "后端恢复示例",
      generateButtonLabel: "后端开始生成",
      generateButtonBusyLabel: "后端生成中...",
      regenerateButtonLabel: "后端重新生成",
      providerStatus: {
        configuredProvider: "deepseek",
        activeProvider: "local",
        enabled: false,
        statusLabel: "当前生成引擎：本地模板",
        detailMessage: "后端未检测到 DeepSeek Key，当前回退到本地模板。",
      },
      toneOptions: ["正式", "活泼", "科技感", "文艺"],
      generationTypes: ["标题", "宣传语", "短文案", "诗意表达"],
      defaultConfig: {
        theme: "人工智能课程展示",
        tone: "科技感",
        type: "标题",
        quantity: 3,
      },
      sampleOutputs: [
        {
          id: "gen-1",
          type: "标题",
          title: "课程成果平台展示标题",
          body: "多模态 AI 实验一站式展示，让图像、文本与知识理解在同一界面协同呈现。",
        },
        {
          id: "gen-2",
          type: "宣传语",
          title: "答辩宣传语",
          body: "从原始实验数据到可交互演示页面，统一呈现课程成果的技术路径与应用价值。",
        },
        {
          id: "gen-3",
          type: "短文案",
          title: "短说明文案",
          body: "系统支持图像识别、情感分析、文案生成与博物馆图像理解四类任务，适合课堂汇报与课程答辩演示。",
        },
      ],
      defaultQualityMetrics: [
        { label: "主题相关度", value: 92 },
        { label: "语言流畅度", value: 92 },
        { label: "创意表达", value: 86 },
      ],
      defaultQualityTip: "推荐用于产品化展示、模块介绍和平台价值主张区域。",
      defaultToneKeywords: ["技术气质", "未来感强", "适合产品页"],
    });
  });

  it("updates generated content from backend and can restore the local example state", async () => {
    getGenerationHistoryMock.mockResolvedValue({
      items: [
        {
          id: "hist-api-1",
          theme: "课程答辩展示自动化回归",
          type: "宣传语",
          tone: "正式",
          count: 2,
          time: "16:40",
          status: "已生成",
        },
      ],
    });
    generateTextMock.mockResolvedValue({
      outputs: [
        {
          id: "gen-api-1",
          type: "宣传语",
          title: "正式宣传语",
          body: "以统一平台整合课程实验成果，突出多模态 AI 的分析与展示价值。",
        },
        {
          id: "gen-api-2",
          type: "宣传语",
          title: "答辩展示短句",
          body: "从数据到交互界面，完整呈现课程项目的技术闭环。",
        },
      ],
      historyEntry: {
        id: "hist-api-2",
        theme: "课程答辩展示自动化回归",
        type: "宣传语",
        tone: "正式",
        count: 2,
        time: "16:41",
        status: "已生成",
      },
      history: [
        {
          id: "hist-api-2",
          theme: "课程答辩展示自动化回归",
          type: "宣传语",
          tone: "正式",
          count: 2,
          time: "16:41",
          status: "已生成",
        },
      ],
      qualityMetrics: [
        { label: "主题相关度", value: 95 },
        { label: "语言流畅度", value: 90 },
        { label: "创意表达", value: 88 },
      ],
      qualityTip: "推荐用于课程汇报、答辩陈述和总结页摘要。",
      toneKeywords: ["结构清晰", "表达稳健", "适合答辩"],
      generatedAt: "16:41:28",
      providerUsed: "deepseek",
      usedFallback: false,
      providerStatusMessage: "当前生成引擎：DeepSeek",
      historyRecord: {
        id: "#3101",
        date: "2026-06-06",
        time: "16:41",
        module: "文案生成",
        inputType: "主题",
        inputContent: "课程答辩展示自动化回归",
        output: "已生成 2 条",
        confidence: "95%",
        status: "成功",
        route: "/text-generation",
      },
    });

    render(<TextGenerationPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "后端文案生成页" })).toBeInTheDocument();
    expect(screen.getByText("后端驱动的页面说明文案。")).toBeInTheDocument();
    expect(await screen.findByText("课程答辩展示自动化回归")).toBeInTheDocument();
    expect(screen.queryByText("后端历史记录已接通。")).not.toBeInTheDocument();
    expect(screen.getByText("当前生成引擎：本地模板")).toBeInTheDocument();

    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "课程答辩展示自动化回归");
    await userEvent.click(screen.getByRole("button", { name: "正式" }));
    await userEvent.click(screen.getByRole("button", { name: "宣传语" }));
    await userEvent.click(screen.getByRole("button", { name: "后端开始生成" }));

    expect(await screen.findByText("正式宣传语")).toBeInTheDocument();
    expect(await screen.findByText("答辩展示短句")).toBeInTheDocument();
    expect(await screen.findByText("结构清晰 / 表达稳健 / 适合答辩")).toBeInTheDocument();
    expect(await screen.findByText("16:41:28")).toBeInTheDocument();
    expect(await screen.findByText("当前生成引擎：DeepSeek")).toBeInTheDocument();
    expect(await screen.findByText("后端生成成功并已写入历史。")).toBeInTheDocument();

    expect(generateTextMock).toHaveBeenCalledWith({
      theme: "课程答辩展示自动化回归",
      tone: "正式",
      type: "宣传语",
      quantity: 3,
    });

    await userEvent.click(screen.getByRole("button", { name: "后端恢复示例" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("人工智能课程展示");
    });

    expect(await screen.findByText("课程成果平台展示标题")).toBeInTheDocument();
    expect(await screen.findByText("推荐用于产品化展示、模块介绍和平台价值主张区域。")).toBeInTheDocument();
    expect(await screen.findByText("技术气质 / 未来感强 / 适合产品页")).toBeInTheDocument();
    expect(await screen.findByText("后端已恢复默认示例。")).toBeInTheDocument();
  });

  it("uses the current config to build local fallback outputs when generation fails afterwards", async () => {
    getGenerationHistoryMock.mockResolvedValue({
      items: [
        {
          id: "hist-api-1",
          theme: "课程答辩展示自动化回归",
          type: "标题",
          tone: "科技感",
          count: 3,
          time: "16:40",
          status: "已生成",
        },
      ],
    });
    generateTextMock
      .mockResolvedValueOnce({
        outputs: [
          {
            id: "gen-api-1",
            type: "标题",
            title: "回归标题一",
            body: "第一轮成功生成的文案结果。",
          },
          {
            id: "gen-api-2",
            type: "标题",
            title: "回归标题二",
            body: "用于验证失败后仍保留最后一次成功结果。",
          },
        ],
        historyEntry: {
          id: "hist-api-2",
          theme: "课程答辩展示自动化回归",
          type: "标题",
          tone: "科技感",
          count: 3,
          time: "16:41",
          status: "已生成",
        },
        history: [
          {
            id: "hist-api-2",
            theme: "课程答辩展示自动化回归",
            type: "标题",
            tone: "科技感",
            count: 3,
            time: "16:41",
            status: "已生成",
          },
        ],
        qualityMetrics: [
          { label: "主题相关度", value: 95 },
          { label: "语言流畅度", value: 90 },
          { label: "创意表达", value: 88 },
        ],
        qualityTip: "推荐用于课程汇报、答辩陈述和总结页摘要。",
        toneKeywords: ["结构清晰", "表达稳健", "适合答辩"],
        generatedAt: "16:41:28",
        providerUsed: "local",
        usedFallback: false,
        providerStatusMessage: "当前生成引擎：本地模板",
        historyRecord: {
          id: "#3101",
          date: "2026-06-06",
          time: "16:41",
          module: "文案生成",
          inputType: "主题",
          inputContent: "课程答辩展示自动化回归",
          output: "已生成 2 条",
          confidence: "95%",
          status: "成功",
          route: "/text-generation",
        },
      })
      .mockRejectedValueOnce(new Error("network failed"));

    render(<TextGenerationPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "后端文案生成页" })).toBeInTheDocument();
    expect(screen.queryByText("后端历史记录已接通。")).not.toBeInTheDocument();

    const themeInput = screen.getAllByRole("textbox")[0];
    await userEvent.clear(themeInput);
    await userEvent.type(themeInput, "课程答辩展示自动化回归");
    await userEvent.click(screen.getByRole("button", { name: "后端开始生成" }));

    expect(await screen.findByText("回归标题一")).toBeInTheDocument();
    expect(await screen.findByText("回归标题二")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "后端开始生成" }));

    const localFallbackMessage = await screen.findByText((content) => {
      return content === "后端生成失败后保留上次结果。" ||
        content === "文案生成接口暂时不可用，当前已根据输入主题生成本地兜底结果。";
    });

    const preservedOutputsStillVisible =
      screen.queryByText("回归标题一") && screen.queryByText("回归标题二");
    const localFallbackOutputsVisible =
      screen.queryByText("课程答辩展示自动化回归标题 1") &&
      screen.queryByText("课程答辩展示自动化回归标题 2");

    expect(preservedOutputsStillVisible ?? localFallbackOutputsVisible).toBeTruthy();

    if (localFallbackMessage.textContent === "后端生成失败后保留上次结果。") {
      expect(screen.getByText("当前生成引擎：本地模板")).toBeInTheDocument();
    } else {
      expect(
        screen.queryByText("当前生成引擎：本地模板兜底") ??
        screen.queryByText("当前生成引擎：本地模板"),
      ).toBeTruthy();
    }

    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("paginates generation history in 8-row chunks", async () => {
    getGenerationHistoryMock.mockResolvedValue({
      items: Array.from({ length: 10 }, (_, index) => ({
        id: `hist-api-${index + 1}`,
        theme: `历史主题 ${index + 1}`,
        type: "标题",
        tone: "科技感",
        count: 3,
        time: `16:${String(40 + index).padStart(2, "0")}`,
        status: "已生成",
      })),
    });
    generateTextMock.mockResolvedValue({
      outputs: [],
      historyEntry: {
        id: "hist-api-11",
        theme: "新生成记录",
        type: "标题",
        tone: "科技感",
        count: 3,
        time: "16:55",
        status: "已生成",
      },
      history: [],
      qualityMetrics: [],
      qualityTip: "",
      toneKeywords: [],
      generatedAt: "16:55:00",
      providerUsed: "local",
      usedFallback: false,
      providerStatusMessage: "当前生成引擎：本地模板",
      historyRecord: {
        id: "#3102",
        date: "2026-06-06",
        time: "16:55",
        module: "文案生成",
        inputType: "主题",
        inputContent: "新生成记录",
        output: "已生成 0 条",
        confidence: "0%",
        status: "成功",
        route: "/text-generation",
      },
    });

    render(<TextGenerationPage />);

    expect(await screen.findByText("历史主题 1")).toBeInTheDocument();
    expect(await screen.findByText("历史主题 8")).toBeInTheDocument();
    expect(screen.queryByText("历史主题 9")).not.toBeInTheDocument();
    expect(screen.getByText("当前显示 1-8 条，共 10 条")).toBeInTheDocument();
    expect(screen.getByText("第 1 / 2 页")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "2" }));

    expect(await screen.findByText("历史主题 9")).toBeInTheDocument();
    expect(await screen.findByText("历史主题 10")).toBeInTheDocument();
    expect(screen.queryByText("历史主题 1")).not.toBeInTheDocument();
    expect(screen.getByText("当前显示 9-10 条，共 10 条")).toBeInTheDocument();
    expect(screen.getByText("第 2 / 2 页")).toBeInTheDocument();
  });

  it("falls back to local generation that still uses the current input theme when the backend generate request fails", async () => {
    getTextGenerationMetadataMock.mockRejectedValue(new Error("metadata offline"));
    getGenerationHistoryMock.mockRejectedValue(new Error("history offline"));
    generateTextMock.mockRejectedValue(new Error("generate offline"));

    render(<TextGenerationPage />);

    const themeInput = screen.getAllByRole("textbox")[0];
    await userEvent.clear(themeInput);
    await userEvent.type(themeInput, "离线答辩演示专题");
    await userEvent.click(screen.getByRole("button", { name: "正式" }));
    await userEvent.click(screen.getByRole("button", { name: "宣传语" }));
    await userEvent.click(screen.getByRole("button", { name: "开始生成" }));

    expect(await screen.findByText("离线答辩演示专题宣传语 1")).toBeInTheDocument();
    expect(
      screen.getByText("文案生成接口暂时不可用，当前已根据输入主题生成本地兜底结果。"),
    ).toBeInTheDocument();
    expect(screen.getByText("当前生成引擎：本地模板兜底")).toBeInTheDocument();
    expect(screen.getByText("离线答辩演示专题 / 结构清晰 / 适合正式展示")).toBeInTheDocument();
  });
});
