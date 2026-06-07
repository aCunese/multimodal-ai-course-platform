import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HistoryPage } from "./page";

const { downloadHistoryRecordsMock, getHistoryMetadataMock, getHistoryRecordsMock } = vi.hoisted(() => ({
  downloadHistoryRecordsMock: vi.fn(),
  getHistoryMetadataMock: vi.fn(),
  getHistoryRecordsMock: vi.fn(),
}));

vi.mock("../../shared/api/client", () => ({
  downloadHistoryRecords: downloadHistoryRecordsMock,
  getHistoryMetadata: getHistoryMetadataMock,
  getHistoryRecords: getHistoryRecordsMock,
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders history metadata from the backend contract when available", async () => {
    getHistoryMetadataMock.mockResolvedValue({
      pageTitle: "后端历史页标题",
      pageDescription: "后端历史页说明文案。",
      syncConnectedMessage: "后端已连接提示",
      syncLoadingMessage: "后端同步中",
      syncReadyMessage: "后端实时同步完成。",
      syncFallbackMessage: "后端同步失败兜底。",
      filterPanelTitle: "后端筛选区标题",
      searchFieldLabel: "后端搜索标签",
      searchPlaceholder: "后端搜索占位",
      moduleFilterLabel: "后端模块筛选",
      statusFilterLabel: "后端状态筛选",
      exportFormatLabel: "后端导出格式",
      clearFiltersLabel: "后端清空",
      exportButtonLabel: "后端导出",
      exportButtonBusyLabel: "后端导出中",
      exportSuccessMessageTemplate: "后端已导出 {format}",
      exportFallbackMessage: "后端导出兜底",
      tableTitle: "后端历史表格标题",
      tableLoadingMessage: "后端表格同步中",
      tableCountTemplate: "后端共 {count} 条",
      tableHeaders: ["后端记录列", "后端时间列", "后端模块列", "后端输入列", "后端输出列", "后端评分列", "后端状态列", "后端操作列"],
      rowActionLabel: "后端查看记录",
      projectOverviewTitle: "后端项目说明标题",
      moduleSpotlightActionLabel: "后端查看详情",
      moduleFilters: ["全部", "图像识别", "运行时资源"],
      statusFilters: ["全部", "成功", "失败"],
      exportFormats: [
        { label: "JSON", value: "json" },
        { label: "CSV", value: "csv" },
      ],
      overviewSections: [
        {
          title: "接口合同",
          body: "历史页的筛选项、项目说明和模块导览已经统一由后端接口提供。",
        },
      ],
      valuePoints: ["接口驱动页面"],
      moduleSpotlights: [
        {
          title: "运行时资源模块",
          description: "聚合缓存状态、预热入口和交付校验信息。",
          route: "/history#project-overview",
        },
      ],
    });
    getHistoryRecordsMock.mockResolvedValue({
      records: [
        {
          id: "#3001",
          date: "2026-06-06",
          time: "18:30",
          module: "图像识别",
          inputType: "图片",
          inputContent: "backend-sample.jpg",
          output: "Dangshen",
          confidence: "91.2%",
          status: "成功",
          route: "/image-recognition",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: "后端历史页标题" })).toBeInTheDocument();
    expect(screen.getByText("后端历史页说明文案。")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端筛选区标题" })).toBeInTheDocument();
    expect(screen.getByLabelText("后端搜索标签")).toHaveAttribute("placeholder", "后端搜索占位");
    expect(await screen.findByText("接口合同")).toBeInTheDocument();
    expect(screen.getByText("历史页的筛选项、项目说明和模块导览已经统一由后端接口提供。")).toBeInTheDocument();
    expect(screen.getByText("接口驱动页面")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "运行时资源" })).toBeInTheDocument();
    expect(screen.getByText("运行时资源模块")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端历史表格标题" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端记录列" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "后端操作列" })).toBeInTheDocument();
    expect(screen.queryByText("后端实时同步完成。")).not.toBeInTheDocument();
    expect(screen.getByText("后端共 1 条")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "后端查看记录" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端项目说明标题" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /后端查看详情/i })).toBeInTheDocument();
  });

  it("falls back to client-side CSV export when backend export fails", async () => {
    getHistoryMetadataMock.mockResolvedValue({
      pageTitle: "历史记录与项目说明",
      pageDescription: "查看平台运行记录、实验结果和项目模块说明，帮助完成课程答辩与后续开发整理。",
      syncConnectedMessage: "已连接历史记录接口。",
      syncLoadingMessage: "正在同步历史记录...",
      syncReadyMessage: "历史记录已由后端接口实时提供。",
      syncFallbackMessage: "历史记录接口暂时不可用，当前展示的是本地演示数据。",
      filterPanelTitle: "历史记录筛选区",
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
      tableTitle: "历史记录表格",
      tableLoadingMessage: "正在同步...",
      tableCountTemplate: "共 {count} 条记录",
      tableHeaders: ["记录 ID", "时间", "实验模块", "输入内容", "输出结果", "置信度 / 评分", "状态", "操作"],
      rowActionLabel: "查看",
      projectOverviewTitle: "项目说明",
      moduleSpotlightActionLabel: "查看详情",
      moduleFilters: ["全部", "图像识别", "情感分析", "文案生成", "博物馆图像理解"],
      statusFilters: ["全部", "成功", "警告", "失败"],
      exportFormats: [
        { label: "JSON", value: "json" },
        { label: "CSV", value: "csv" },
      ],
      overviewSections: [],
      valuePoints: [],
      moduleSpotlights: [],
    });
    getHistoryRecordsMock.mockResolvedValue({
      records: [
        {
          id: "#2048",
          date: "2026-06-06",
          time: "16:20",
          module: "图像识别",
          inputType: "图片",
          inputContent: "huaihua_1.jpg",
          output: "Huaihua",
          confidence: "66.1%",
          status: "成功",
          route: "/image-recognition",
        },
      ],
    });
    downloadHistoryRecordsMock.mockRejectedValue(new Error("export failed"));

    const createObjectURLSpy = vi.fn<(object: Blob | MediaSource) => string>().mockReturnValue("blob:history");
    const revokeObjectURLSpy = vi.fn<(url: string) => void>();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURLSpy,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURLSpy,
    });
    const createElementOriginal = document.createElement.bind(document);
    const anchor = createElementOriginal("a");
    const clickSpy = vi.fn();
    anchor.click = clickSpy;
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => (tagName === "a" ? anchor : createElementOriginal(tagName)));

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("#2048")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("导出格式"), "csv");
    await userEvent.click(screen.getByRole("button", { name: "导出" }));

    await waitFor(() => {
      expect(downloadHistoryRecordsMock).toHaveBeenCalledWith(
        {
          keyword: "",
          module: "全部",
          status: "全部",
        },
        "csv",
      );
    });

    expect(await screen.findByText("历史记录导出接口暂时不可用，已导出当前页面数据。")).toBeInTheDocument();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe("history-records.csv");
    expect(anchor.href).toBe("blob:history");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:history");

    const exportedBlob = createObjectURLSpy.mock.lastCall?.[0] as Blob | undefined;
    expect(exportedBlob).toBeInstanceOf(Blob);
    expect(exportedBlob?.type).toContain("text/csv");

    createElementSpy.mockRestore();
  });

  it("paginates history records in groups of eight", async () => {
    getHistoryMetadataMock.mockRejectedValue(new Error("metadata unavailable"));
    getHistoryRecordsMock.mockResolvedValue({
      records: Array.from({ length: 9 }, (_, index) => ({
        id: `#20${String(index + 1).padStart(2, "0")}`,
        date: "2026-06-07",
        time: `10:${String(index).padStart(2, "0")}`,
        module: "图像识别",
        inputType: "图片",
        inputContent: `sample-${index + 1}.jpg`,
        output: `Result-${index + 1}`,
        confidence: `${90 - index}%`,
        status: "成功",
        route: "/image-recognition",
      })),
    });

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("#2001")).toBeInTheDocument();
    expect(screen.getByText("#2008")).toBeInTheDocument();
    expect(screen.queryByText("#2009")).not.toBeInTheDocument();
    expect(screen.getByText("当前显示 1-8 条，共 9 条")).toBeInTheDocument();
    expect(screen.getByText("第 1 / 2 页")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "下一页" }));

    expect(await screen.findByText("#2009")).toBeInTheDocument();
    expect(screen.queryByText("#2001")).not.toBeInTheDocument();
    expect(screen.getByText("当前显示 9-9 条，共 9 条")).toBeInTheDocument();
    expect(screen.getByText("第 2 / 2 页")).toBeInTheDocument();
  });
});
