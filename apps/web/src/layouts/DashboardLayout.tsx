import { Suspense, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ChevronLeft, Code2, Crown, Menu, Moon, Sun, X } from "lucide-react";
import { isActivePremium } from "@careerportal/shared/types";
import { useDashboardSummary } from "@careerportal/web/data-access";
import { IconButton, useBodyScrollLock, useFocusTrap } from "@careerportal/web/ui";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { countOverdueFollowUps } from "../lib/follow-ups";
import { NOT_FOUND_TITLE, getAppPageTitle } from "../lib/page-titles";
import { PageLoader } from "../components/PageLoader";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import { JOB_TRACKER_PATH, SidebarNav, type NavBadges } from "./SidebarNav";
import { SidebarUpgradeBox } from "./SidebarUpgradeBox";
import { UserMenu } from "./UserMenu";

const SUPPORT_EMAIL = "support@career-repo.com";
const DESKTOP_QUERY = "(min-width: 1024px)";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
        <Code2 className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-sm font-bold tracking-tight text-text-primary">careerRepo</span>
    </div>
  );
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Applications: true,
    "Interview Prep": true,
  });
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const premium = isActivePremium(user);
  const pageTitle = getAppPageTitle(location.pathname) ?? NOT_FOUND_TITLE;

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const summary = useDashboardSummary();
  const overdueFollowUps = countOverdueFollowUps(summary.data?.data?.actionCentre?.followUps);
  const badges: NavBadges = {
    [JOB_TRACKER_PATH]: {
      count: overdueFollowUps,
      label: overdueFollowUps === 1 ? "overdue follow-up" : "overdue follow-ups",
    },
  };

  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // The drawer is a modal on small screens: trap focus, Escape closes, lock scroll.
  useFocusTrap(mobileNavRef, mobileOpen, { onEscape: closeMobileNav });
  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    if (!mobileOpen) return;
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mobileOpen]);

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? true) }));

  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus();
    mainRef.current?.scrollIntoView({ block: "start" });
  };

  const sidebar = (isMobile: boolean) => (
    <>
      <SidebarNav
        collapsed={!isMobile && collapsed}
        pathname={location.pathname}
        expandedGroups={expandedGroups}
        onToggleGroup={toggleGroup}
        badges={badges}
        onNavigate={isMobile ? closeMobileNav : undefined}
      />
      {!premium && (isMobile || !collapsed) && (
        <SidebarUpgradeBox onNavigate={isMobile ? closeMobileNav : undefined} />
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <a
        href="#main-content"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="h-14 glass glass-border flex items-center justify-between px-4 shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            label="Open navigation"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
          </IconButton>
          <IconButton
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            className="hidden lg:inline-flex"
          >
            {collapsed ? (
              <Menu className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </IconButton>
          <div className="h-4 w-px bg-border hidden sm:block" aria-hidden="true" />
          <h1 className="text-sm font-semibold text-text-primary tracking-tight truncate">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-1">
          {premium && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200/70 dark:border-accent-700/40 px-2.5 py-1 text-[11px] font-semibold text-accent-800 dark:text-accent-300 mr-1">
              <Crown className="h-3 w-3" aria-hidden="true" />
              {user?.isTrialing ? "Premium trial" : "Premium"}
            </span>
          )}
          <IconButton
            label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4" aria-hidden="true" />
            )}
          </IconButton>
          <div className="h-4 w-px bg-border mx-1 hidden sm:block" aria-hidden="true" />
          <UserMenu user={user} premium={premium} onLogout={() => void logout()} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {mobileOpen && (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={closeMobileNav}
          />
        )}

        {/* Mobile drawer: invisible (neither focusable nor announced) when closed. It
            becomes visible at once on open, so focus can move in, and is hidden only
            after the slide-out transition. */}
        <div
          ref={mobileNavRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal={mobileOpen || undefined}
          aria-label="Navigation"
          tabIndex={-1}
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-border flex flex-col lg:hidden duration-300 ease-in-out motion-reduce:transition-none focus:outline-none ${
            mobileOpen
              ? "translate-x-0 visible transition-transform"
              : "-translate-x-full invisible transition-[transform,visibility]"
          }`}
        >
          <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <Brand />
            <IconButton label="Close navigation" size="sm" onClick={closeMobileNav}>
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
          {sidebar(true)}
        </div>

        <aside
          aria-label="Sidebar"
          className={`${
            collapsed ? "w-16" : "w-60"
          } bg-bg-secondary border-r border-border transition-all duration-300 ease-in-out motion-reduce:transition-none shrink-0 flex-col hidden lg:flex`}
        >
          {!collapsed && (
            <div className="flex items-center px-4 h-14 shrink-0 border-b border-border">
              <Brand />
            </div>
          )}
          {sidebar(false)}
        </aside>

        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto flex flex-col min-w-0 focus:outline-none"
        >
          <div className="flex-1 p-4 sm:p-6 flex flex-col">
            <RouteErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </div>
          <footer className="border-t border-border py-3 px-6 text-xs text-text-tertiary flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>careerRepo &copy; {new Date().getFullYear()}</span>
            <Link to="/privacy" className="hover:text-text-primary hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-text-primary hover:underline">
              Terms
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
