import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import {
  LayoutDashboard,
  FileText,
  Mail,
  Briefcase,
  Menu,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronDown,
  User,
  ClipboardList,
  CreditCard,
  Crown,
  Sparkles,
  Brain,
  Code2,
  X,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  beta?: boolean;
};

type NavGroup = {
  label: string;
  icon: typeof LayoutDashboard;
  children: NavItem[];
};

type NavEntry =
  | { type: "item"; item: NavItem }
  | { type: "group"; group: NavGroup }
  | { type: "separator" };

const NAV_ENTRIES: NavEntry[] = [
  {
    type: "item",
    item: { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  },
  { type: "separator" },
  {
    type: "group",
    group: {
      label: "Applications",
      icon: Briefcase,
      children: [
        { to: "/app/cv", label: "CV Builder", icon: FileText },
        { to: "/app/cover-letters", label: "Cover Letters", icon: Mail },
        { to: "/app/jobs", label: "Job Tracker", icon: ClipboardList },
      ],
    },
  },
  { type: "separator" },
  {
    type: "group",
    group: {
      label: "Interview Prep",
      icon: Brain,
      children: [
        { to: "/app/interview-prep", label: "Practice Questions", icon: Brain, beta: true },
        { to: "/app/technical-tests", label: "Mock Tests", icon: Code2, beta: true },
      ],
    },
  },
  { type: "separator" },
  {
    type: "item",
    item: { to: "/app/billing", label: "Billing", icon: CreditCard },
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/cv": "CV Builder",
  "/app/cover-letters": "Cover Letters",
  "/app/jobs": "Job Tracker",
  "/app/billing": "Billing & Plans",
  "/app/qualifications": "Qualifications",
  "/app/interview-prep": "Interview Prep",
  "/app/technical-tests": "Technical Tests",
};

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-primary-500/10 text-primary-700 dark:text-primary-300"
            : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
        }`
      }
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-primary-600 text-white"
                : "bg-bg-tertiary text-text-tertiary"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="truncate flex items-center gap-1">
              {item.label}
              {item.beta && (
                <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/20 px-1.5 py-0.5 rounded-full">
                  Beta
                </span>
              )}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavGroupSection({
  group,
  collapsed,
  expanded,
  onToggle,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = group.icon;
  const isGroupActive = group.children.some((child) =>
    pathname.startsWith(child.to)
  );

  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.children.map((child) => (
          <NavItemLink key={child.to} item={child} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isGroupActive
            ? "text-primary-700 dark:text-primary-300"
            : "text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isGroupActive
              ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
              : "bg-bg-tertiary text-text-tertiary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        />
      </button>
      {expanded && (
        <div className="ml-5 pl-3 mt-1 space-y-0.5 border-l-2 border-border">
          {group.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary-500/10 text-primary-700 dark:text-primary-300"
                      : "text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
                  }`
                }
              >
                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex items-center gap-1">
                  {child.label}
                  {child.beta && (
                    <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/20 px-1.5 py-0.5 rounded-full">
                      Beta
                    </span>
                  )}
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      Applications: true,
      "Interview Prep": true,
    }
  );
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || "Career Portal";

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {NAV_ENTRIES.map((entry, idx) => {
          if (entry.type === "separator") {
            return (
              <div
                key={`sep-${idx}`}
                className="!my-4 mx-2 border-t border-border"
              />
            );
          }
          if (entry.type === "item") {
            return (
              <NavItemLink
                key={entry.item.to}
                item={entry.item}
                collapsed={collapsed}
                onNavigate={closeMobileSidebar}
              />
            );
          }
          if (entry.type === "group") {
            return (
              <NavGroupSection
                key={entry.group.label}
                group={entry.group}
                collapsed={collapsed}
                expanded={expandedGroups[entry.group.label] ?? true}
                onToggle={() => toggleGroup(entry.group.label)}
                pathname={location.pathname}
                onNavigate={closeMobileSidebar}
              />
            );
          }
          return null;
        })}
      </nav>

      {/* Upgrade CTA for free users */}
      {!user?.isPremium && !collapsed && (
        <div className="px-3 pb-5">
          <NavLink
            to="/app/billing"
            onClick={closeMobileSidebar}
            className="block rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-400/20 p-4 hover:bg-accent-100 dark:hover:bg-accent-900/30 hover:border-accent-400/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-400 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-accent-700 dark:text-accent-400">
                Go Premium
              </span>
            </div>
            <p className="text-xs leading-relaxed text-accent-600/80 dark:text-accent-400/70">
              Unlock AI features for £9.99/mo
            </p>
          </NavLink>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="h-14 sm:h-16 glass glass-border flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary hover:text-text-primary transition-all active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary hover:text-text-primary transition-all active:scale-95"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <h1 className="text-sm sm:text-base font-bold text-text-primary truncate">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user?.isPremium && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-accent-100 dark:bg-accent-900/20 border border-accent-400/30 px-3 py-1.5 text-xs font-bold text-accent-600 dark:text-accent-400">
              <Crown className="h-3.5 w-3.5" />
              Premium
            </span>
          )}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary hover:text-text-primary transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            ) : (
              <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            )}
          </button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary hidden sm:inline">
              {user?.name}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-text-tertiary hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-bg-secondary border-r border-border transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <span className="text-sm font-bold text-text-primary">Menu</span>
            <button
              onClick={closeMobileSidebar}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary hover:text-text-primary transition-all"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {sidebarContent}
        </aside>

        {/* Desktop sidebar */}
        <aside
          className={`${
            collapsed ? "w-20" : "w-64"
          } bg-bg-secondary border-r border-border transition-all duration-300 ease-in-out shrink-0 flex-col hidden lg:flex`}
        >
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col min-h-0">
            <Outlet />
          </div>
          <footer className="border-t border-border py-3 sm:py-4 px-4 sm:px-8 text-center text-xs text-text-tertiary mt-auto">
            Career Portal &copy; {new Date().getFullYear()}
          </footer>
        </main>
      </div>
    </div>
  );
}
