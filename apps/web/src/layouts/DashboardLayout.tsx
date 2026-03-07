import { useState } from "react";
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
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
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
        { to: "/app/interview-prep", label: "Practice Questions", icon: Brain },
        { to: "/app/technical-tests", label: "Mock Tests", icon: Code2 },
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
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-accent/10 to-indigo-500/10 text-accent-dark dark:text-accent shadow-sm shadow-accent/5"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-accent-dark text-white shadow-sm shadow-accent/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          {!collapsed && <span className="truncate">{item.label}</span>}
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
}: {
  group: NavGroup;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  const Icon = group.icon;
  const isGroupActive = group.children.some((child) =>
    pathname.startsWith(child.to)
  );

  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.children.map((child) => (
          <NavItemLink key={child.to} item={child} collapsed={collapsed} />
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
            ? "text-accent-dark dark:text-accent"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isGroupActive
              ? "bg-accent-dark/10 dark:bg-accent/10 text-accent-dark dark:text-accent"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
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
        <div className="ml-5 pl-3 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700">
          {group.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-accent/10 to-indigo-500/10 text-accent-dark dark:text-accent"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }`
                }
              >
                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{child.label}</span>
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

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-10 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <Menu className="h-4.5 w-4.5" />
            ) : (
              <ChevronLeft className="h-4.5 w-4.5" />
            )}
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {pageTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user?.isPremium && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          )}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2 pl-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-dark to-indigo-600 text-white">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              {user?.name}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? "w-[68px]" : "w-56"
          } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out shrink-0 flex flex-col`}
        >
          <nav className="flex-1 py-4 px-3 space-y-1">
            {NAV_ENTRIES.map((entry, idx) => {
              if (entry.type === "separator") {
                return (
                  <div
                    key={`sep-${idx}`}
                    className="!my-3 mx-2 border-t border-gray-200 dark:border-gray-700/50"
                  />
                );
              }
              if (entry.type === "item") {
                return (
                  <NavItemLink
                    key={entry.item.to}
                    item={entry.item}
                    collapsed={collapsed}
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
                  />
                );
              }
              return null;
            })}
          </nav>

          {/* Upgrade CTA for free users */}
          {!user?.isPremium && !collapsed && (
            <div className="px-3 pb-4">
              <NavLink
                to="/app/billing"
                className="block rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-3.5 hover:from-amber-500/15 hover:to-orange-500/15 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Go Premium
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-600/70 dark:text-amber-400/60">
                  Unlock AI features for £9.99/mo
                </p>
              </NavLink>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
          <footer className="border-t border-gray-200 dark:border-gray-800 py-3 px-6 text-center text-xs text-gray-400 dark:text-gray-600">
            Career Portal &copy; {new Date().getFullYear()}
          </footer>
        </main>
      </div>
    </div>
  );
}
