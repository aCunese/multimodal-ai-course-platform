import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell";

const { getAppShellMetadataMock, searchPlatformMock } = vi.hoisted(() => ({
  getAppShellMetadataMock: vi.fn(),
  searchPlatformMock: vi.fn(),
}));

vi.mock("../api/client", () => ({
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
  projectReportButtonLabel: "",
  projectReportFallbackTitle: "",
  projectReportFallbackFilename: "",
  projectDeliverablesButtonLabel: "",
  projectOverviewButtonLabel: "",
  accountDisplayName: "",
  accountRoleLabel: "",
};

describe("AppShell", () => {
  beforeEach(() => {
    getAppShellMetadataMock.mockResolvedValue(defaultAppShellMetadata);
  });

  afterEach(() => {
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

  it("applies backend shell metadata to the search box copy", async () => {
    getAppShellMetadataMock.mockResolvedValue({
      ...defaultAppShellMetadata,
      searchFieldAriaLabel: "后端全局搜索",
      searchPlaceholder: "后端搜索占位",
      searchResultsAriaLabel: "后端搜索建议",
      searchLoadingMessage: "后端搜索中",
      searchEmptyMessage: "后端暂无搜索结果",
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
    expect(screen.getAllByText("首页总览")).toHaveLength(2);
    expect(screen.getByText("查看模块入口与关键状态")).toBeInTheDocument();

    await userEvent.type(searchbox, "ghost");

    expect(await screen.findByRole("listbox", { name: "后端搜索建议" })).toBeInTheDocument();
    expect(await screen.findByText("后端暂无搜索结果")).toBeInTheDocument();
  });
});
