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
import {
  getAppShellMetadata,
  searchPlatform,
} from "../api/client";
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
  projectReportButtonLabel: "",
  projectReportFallbackTitle: "",
  projectReportFallbackFilename: "",
  projectDeliverablesButtonLabel: "",
  projectOverviewButtonLabel: "",
  accountDisplayName: "",
  accountRoleLabel: "",
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
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__context">
            <p className="topbar__kicker">当前浏览页面</p>
            <p className="topbar__eyebrow">{activeMeta.label}</p>
            <p className="topbar__summary">{activeMeta.summary}</p>
          </div>

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
        </header>

        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
