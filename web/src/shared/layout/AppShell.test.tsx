import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell";

const { downloadProjectDeliveryBundleMock, downloadProjectReportMock, getAppShellMetadataMock, searchPlatformMock } = vi.hoisted(() => ({
  downloadProjectDeliveryBundleMock: vi.fn(),
  downloadProjectReportMock: vi.fn(),
  getAppShellMetadataMock: vi.fn(),
  searchPlatformMock: vi.fn(),
}));

vi.mock("../api/client", () => ({
  downloadProjectDeliveryBundle: downloadProjectDeliveryBundleMock,
  downloadProjectReport: downloadProjectReportMock,
  getAppShellMetadata: getAppShellMetadataMock,
  searchPlatform: searchPlatformMock,
}));

const defaultAppShellMetadata = {
  searchFieldAriaLabel: "全局搜索",
  searchPlaceholder: "搜索实验、记录或内容...",
  searchResultsAriaLabel: "搜索建议",
  searchLoadingMessage: "正在搜索...",
  searchEmptyMessage: "未找到匹配结果，可直接回车跳转到历史记录页继续搜索。",
  searchUnavailableMessage: "全局搜索接口暂时不可用，可直接回车跳转到历史记录页。",
  projectReportButtonLabel: "导出演示报告",
  projectReportFallbackTitle: "多模态 AI 课程成果平台演示报告",
  projectReportFallbackFilename: "multimodal-ai-demo-report.json",
  projectDeliverablesButtonLabel: "导出交付包",
  projectOverviewButtonLabel: "查看项目说明",
  accountDisplayName: "课程实验用户",
  accountRoleLabel: "学生",
};

describe("AppShell", () => {
  beforeEach(() => {
    getAppShellMetadataMock.mockResolvedValue(defaultAppShellMetadata);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("renders backend search suggestions and navigates to the selected result", async () => {
    searchPlatformMock.mockResolvedValue({
      keyword: "flop",
      total: 1,
      results: [
        {
          id: "history-1025",
          title: "情感分析 · Negative",
          subtitle: "历史记录 · 成功 · 2026-06-06 08:00",
          description: "This sequel is a flop and feels copied. -> Negative",
          route: "/history?keyword=%231025",
          icon: "heart",
          scope: "history",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={(
              <AppShell>
                <div>dashboard content</div>
              </AppShell>
            )}
          />
          <Route
            path="/history"
            element={(
              <AppShell>
                <div>history content</div>
              </AppShell>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByRole("searchbox", { name: "全局搜索" }), "flop");

    await waitFor(() => {
      expect(searchPlatformMock).toHaveBeenLastCalledWith("flop");
    });

    expect(getAppShellMetadataMock).toHaveBeenCalledTimes(1);
    await userEvent.click(await screen.findByText("情感分析 · Negative"));

    expect(await screen.findByText("history content")).toBeInTheDocument();
  });

  it("applies backend shell metadata to search and toolbar copy", async () => {
    getAppShellMetadataMock.mockResolvedValue({
      ...defaultAppShellMetadata,
      searchFieldAriaLabel: "后端全局搜索",
      searchPlaceholder: "后端搜索占位",
      searchResultsAriaLabel: "后端搜索建议",
      searchLoadingMessage: "后端搜索中",
      searchEmptyMessage: "后端暂无搜索结果",
      projectReportButtonLabel: "后端导出演示报告",
      projectDeliverablesButtonLabel: "后端导出交付包",
      projectOverviewButtonLabel: "后端查看项目说明",
      accountDisplayName: "后端课程用户",
      accountRoleLabel: "Backend Student",
    });
    searchPlatformMock.mockResolvedValue({
      keyword: "ghost",
      total: 0,
      results: [],
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <div>dashboard content</div>
        </AppShell>
      </MemoryRouter>,
    );

    const searchbox = await screen.findByRole("searchbox", { name: "后端全局搜索" });
    expect(searchbox).toHaveAttribute("placeholder", "后端搜索占位");
    expect(screen.getByRole("button", { name: "后端导出演示报告" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端导出交付包" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端查看项目说明" })).toBeInTheDocument();
    expect(screen.getByText("后端课程用户")).toBeInTheDocument();
    expect(screen.getByText("Backend 学生")).toBeInTheDocument();

    await userEvent.type(searchbox, "ghost");

    expect(await screen.findByRole("listbox", { name: "后端搜索建议" })).toBeInTheDocument();
    expect(await screen.findByText("后端暂无搜索结果")).toBeInTheDocument();
  });

  it("renders the desktop topbar control groups with stable structure", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <div>dashboard content</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("topbar-controls")).toBeInTheDocument();
    expect(screen.getByTestId("topbar-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("topbar-account")).toBeInTheDocument();
  });

  it("downloads the backend project report from the topbar action", async () => {
    downloadProjectReportMock.mockResolvedValue({
      blob: new Blob(['{"title":"多模态 AI 课程成果平台演示报告"}'], {
        type: "application/json;charset=utf-8",
      }),
      filename: "multimodal-ai-demo-report-20260606.json",
    });

    const createObjectURLSpy = vi.fn<(object: Blob | MediaSource) => string>().mockReturnValue("blob:project-report");
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
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <div>dashboard content</div>
        </AppShell>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "导出演示报告" }));

    await waitFor(() => {
      expect(downloadProjectReportMock).toHaveBeenCalledTimes(1);
    });

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe("multimodal-ai-demo-report-20260606.json");
    expect(anchor.href).toBe("blob:project-report");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:project-report");

    createElementSpy.mockRestore();
  });

  it("uses backend metadata for the local project report fallback snapshot", async () => {
    getAppShellMetadataMock.mockResolvedValue({
      ...defaultAppShellMetadata,
      projectReportButtonLabel: "后端导出演示报告",
      projectReportFallbackTitle: "后端演示报告标题",
      projectReportFallbackFilename: "backend-demo-report.json",
    });
    downloadProjectReportMock.mockRejectedValue(new Error("report offline"));

    const createObjectURLSpy = vi.fn<(object: Blob | MediaSource) => string>().mockReturnValue("blob:project-report-fallback");
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
    const jsonStringifySpy = vi.spyOn(JSON, "stringify");
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => (tagName === "a" ? anchor : createElementOriginal(tagName)));

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <div>dashboard content</div>
        </AppShell>
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "后端导出演示报告" }));

    await waitFor(() => {
      expect(downloadProjectReportMock).toHaveBeenCalledTimes(1);
    });

    const fallbackBlob = createObjectURLSpy.mock.calls[0]?.[0];
    expect(fallbackBlob).toBeInstanceOf(Blob);
    expect(jsonStringifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "后端演示报告标题",
      }),
      null,
      2,
    );
    expect(anchor.download).toBe("backend-demo-report.json");
    expect(anchor.href).toBe("blob:project-report-fallback");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:project-report-fallback");

    createElementSpy.mockRestore();
    jsonStringifySpy.mockRestore();
  });

  it("downloads the backend delivery bundle from the topbar action", async () => {
    downloadProjectDeliveryBundleMock.mockResolvedValue({
      blob: new Blob(["PK"], {
        type: "application/zip",
      }),
      filename: "multimodal-ai-delivery-bundle-20260606.zip",
    });

    const createObjectURLSpy = vi.fn<(object: Blob | MediaSource) => string>().mockReturnValue("blob:delivery-bundle");
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
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <div>dashboard content</div>
        </AppShell>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "导出交付包" }));

    await waitFor(() => {
      expect(downloadProjectDeliveryBundleMock).toHaveBeenCalledTimes(1);
    });

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe("multimodal-ai-delivery-bundle-20260606.zip");
    expect(anchor.href).toBe("blob:delivery-bundle");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:delivery-bundle");

    createElementSpy.mockRestore();
  });
});
