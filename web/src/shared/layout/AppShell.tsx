import {
  startTransition,
  type FormEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import logoMark from "../../assets/branding/platform-mark.png";
import sidebarArtwork from "../../assets/illustrations/stacked-layers.png";
import {
  downloadProjectDeliveryBundle,
  downloadProjectReport,
  getAppShellMetadata,
  searchPlatform,
} from "../api/client";
import { formatAccountRoleLabel } from "../copy/display";
import type { AppShellMetadataResponse, SearchResponse } from "../api/types";
import { navItems } from "../constants/navigation";
import { Icon } from "../ui/Icon";

const initialMetadata: AppShellMetadataResponse = {
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

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(initialMetadata);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse["results"]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const latestSearchRequestId = useRef(0);
  const activeMeta =
    navItems.find((item) => item.path === location.pathname) ??
    navItems.find((item) => item.path !== "/" && location.pathname.startsWith(item.path)) ??
    navItems[0];
  const hasSearchKeyword = searchValue.trim().length > 0;
  const showSearchPanel = hasSearchKeyword && (isSearching || searchResults.length > 0 || searchMessage.length > 0);

  useEffect(() => {
    let cancelled = false;

    async function syncShellMetadata() {
      try {
        const response = await getAppShellMetadata();

        if (cancelled) {
          return;
        }

        setMetadata(response);
      } catch {
        // Keep local metadata fallback when the backend metadata endpoint is unavailable.
      }
    }

    void syncShellMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  function navigateToSearchRoute(route: string) {
    setSearchValue("");
    setSearchResults([]);
    setSearchMessage("");
    navigate(route);
  }

  async function handleSearchChange(nextValue: string) {
    setSearchValue(nextValue);

    const keyword = nextValue.trim();
    const requestId = latestSearchRequestId.current + 1;
    latestSearchRequestId.current = requestId;

    if (!keyword) {
      setSearchResults([]);
      setSearchMessage("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await searchPlatform(keyword);
      if (latestSearchRequestId.current !== requestId) {
        return;
      }

      startTransition(() => {
        setSearchResults(response.results);
        setSearchMessage(response.total === 0 ? metadata.searchEmptyMessage : "");
      });
    } catch {
      if (latestSearchRequestId.current !== requestId) {
        return;
      }

      startTransition(() => {
        setSearchResults([]);
        setSearchMessage(metadata.searchUnavailableMessage);
      });
    } finally {
      if (latestSearchRequestId.current === requestId) {
        setIsSearching(false);
      }
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = searchValue.trim();
    if (!keyword) {
      navigateToSearchRoute("/history");
      return;
    }

    const topResult = searchResults[0];
    navigateToSearchRoute(topResult?.route ?? `/history?keyword=${encodeURIComponent(keyword)}`);
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportReport() {
    try {
      const { blob, filename } = await downloadProjectReport();
      triggerDownload(blob, filename);
      return;
    } catch {
      // Fall back to a local snapshot if the backend export endpoint is unavailable.
    }

    const report = {
      generatedAt: new Date().toISOString(),
      title: metadata.projectReportFallbackTitle,
      pages: navItems.map((item) => ({ label: item.label, path: item.path, summary: item.summary })),
    };

    triggerDownload(new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json;charset=utf-8",
    }), metadata.projectReportFallbackFilename);
  }

  async function handleExportDeliveryBundle() {
    const { blob, filename } = await downloadProjectDeliveryBundle();
    triggerDownload(blob, filename);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logoMark} alt="多模态 AI 课程成果平台标识" className="brand__mark" />
          <div>
            <p className="brand__eyebrow">AI · 课程实验 · 交互答辩</p>
            <p className="brand__title">多模态 AI</p>
            <p className="brand__title">课程成果平台</p>
          </div>
        </div>

        <p className="sidebar__section-label">模块导航</p>
        <nav className="sidebar__nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
            >
              <span className="sidebar__icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="sidebar__link-copy">
                <span className="sidebar__link-label">{item.label}</span>
                <span className="sidebar__link-summary">{item.summary}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card__eyebrow">演示环境</p>
          <div className="sidebar-card__meta">
            <p>课程项目</p>
            <p>模型实验</p>
            <p>前端演示版</p>
          </div>
          <img src={sidebarArtwork} alt="平台底部装饰插图" className="sidebar-card__art" />
          <p className="sidebar-card__version">当前版本 v1.0</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__context">
            <p className="topbar__kicker">当前浏览页面</p>
            <p className="topbar__eyebrow">{activeMeta.label}</p>
            <p className="topbar__summary">{activeMeta.summary}</p>
          </div>

          <div className="topbar__controls" data-testid="topbar-controls">
            <form className="search-box" onSubmit={handleSearchSubmit}>
              <div className="search-box__field">
                <Icon name="search" size={18} />
                <input
                  aria-label={metadata.searchFieldAriaLabel}
                  type="search"
                  value={searchValue}
                  onChange={(event) => {
                    void handleSearchChange(event.target.value);
                  }}
                  placeholder={metadata.searchPlaceholder}
                />
              </div>
              {showSearchPanel ? (
                <div className="search-box__results" role="listbox" aria-label={metadata.searchResultsAriaLabel}>
                  {isSearching ? (
                    <p className="search-box__status">{metadata.searchLoadingMessage}</p>
                  ) : null}
                  {!isSearching
                    ? searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="search-box__result"
                          onClick={() => navigateToSearchRoute(result.route)}
                        >
                          <span className="search-box__result-icon">
                            <Icon name={result.icon} size={16} />
                          </span>
                          <span className="search-box__result-copy">
                            <strong>{result.title}</strong>
                            <small>{result.subtitle}</small>
                            <span>{result.description}</span>
                          </span>
                        </button>
                      ))
                    : null}
                  {!isSearching && searchMessage ? (
                    <p className="search-box__status">{searchMessage}</p>
                  ) : null}
                </div>
              ) : null}
            </form>

            <div className="topbar__utility">
              <div className="topbar__toolbar" data-testid="topbar-toolbar">
                <button type="button" className="toolbar-button" onClick={handleExportReport}>
                  <Icon name="download" size={18} />
                  <span>{metadata.projectReportButtonLabel}</span>
                </button>
                <button type="button" className="toolbar-button" onClick={() => void handleExportDeliveryBundle()}>
                  <Icon name="download" size={18} />
                  <span>{metadata.projectDeliverablesButtonLabel}</span>
                </button>
                <button
                  type="button"
                  className="toolbar-button"
                  onClick={() => navigate("/history#project-overview")}
                >
                  <Icon name="file" size={18} />
                  <span>{metadata.projectOverviewButtonLabel}</span>
                </button>
              </div>

              <button type="button" className="account-pill" data-testid="topbar-account" onClick={() => navigate("/")}>
                <span className="account-pill__avatar">
                  <Icon name="user" size={18} />
                </span>
                <span>
                  <strong>{metadata.accountDisplayName}</strong>
                  <small>{formatAccountRoleLabel(metadata.accountRoleLabel)}</small>
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
