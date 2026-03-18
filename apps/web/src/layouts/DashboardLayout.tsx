import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import {
  LayoutDashboard, FileText, Mail, Briefcase, Menu,
  Sun, Moon, LogOut, ChevronLeft, ChevronDown,
  ClipboardList, CreditCard, Crown, Sparkles, Brain, Code2, X,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; beta?: boolean };
type NavGroup = { label: string; icon: typeof LayoutDashboard; children: NavItem[] };
type NavEntry = { type: "item"; item: NavItem } | { type: "group"; group: NavGroup } | { type: "separator" };

const NAV_ENTRIES: NavEntry[] = [
  { type: "item", item: { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard } },
  { type: "separator" },
  {
    type: "group",
    group: {
      label: "Applications", icon: Briefcase,
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
      label: "Interview Prep", icon: Brain,
      children: [
        { to: "/app/interview-prep", label: "Practice Questions", icon: Brain, beta: true },
        { to: "/app/technical-tests", label: "Mock Tests", icon: Code2, beta: true },
      ],
    },
  },
  { type: "separator" },
  { type: "item", item: { to: "/app/billing", label: "Billing", icon: CreditCard } },
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

function NavItemLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-primary-600 text-white shadow-sm"
            : "text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-text-primary"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary"}`} />
          {!collapsed && (
            <span className="truncate flex items-center gap-2 flex-1">
              {item.label}
              {item.beta && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 px-1.5 py-0.5 rounded-md">
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

function NavGroupSection({ group, collapsed, expanded, onToggle, pathname, onNavigate }: {
  group: NavGroup; collapsed: boolean; expanded: boolean; onToggle: () => void; pathname: string; onNavigate?: () => void;
}) {
  const Icon = group.icon;
  const isGroupActive = group.children.some((child) => pathname.startsWith(child.to));

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
        className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isGroupActive ? "text-text-primary" : "text-text-tertiary hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-text-secondary"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate flex-1 text-left text-xs font-semibold uppercase tracking-widest">{group.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`} />
      </button>
      {expanded && (
        <div className="mt-1 space-y-0.5 pl-3">
          {group.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary"}`} />
                    <span className="truncate flex items-center gap-2 flex-1 text-[13px]">
                      {child.label}
                      {child.beta && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 px-1.5 py-0.5 rounded-md">
                          Beta
                        </span>
                      )}
                    </span>
                  </>
                )}
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Applications: true, "Interview Prep": true,
  });
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || "Career Portal";

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  const closeMobileSidebar = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      {!collapsed && (
        <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Code2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">Career Portal</span>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ENTRIES.map((entry, idx) => {
          if (entry.type === "separator") {
            return <div key={`sep-${idx}`} className="!my-3 mx-1 border-t border-border" />;
          }
          if (entry.type === "item") {
            return (
              <NavItemLink key={entry.item.to} item={entry.item} collapsed={collapsed} onNavigate={closeMobileSidebar} />
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

      {/* Upgrade CTA */}
      {!user?.isPremium && !collapsed && (
        <div className="px-3 pb-4 shrink-0">
          <NavLink
            to="/app/billing"
            onClick={closeMobileSidebar}
            className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-400/5 border border-amber-400/20 p-3.5 hover:border-amber-400/40 hover:from-amber-500/15 transition-all duration-200"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 shadow-sm">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Upgrade to Premium</p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-500/70 truncate">Unlock all AI features · £9.99/mo</p>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-auto" />
          </NavLink>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="h-14 glass glass-border flex items-center justify-between px-4 shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-text-tertiary hover:text-text-primary transition-all"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-text-tertiary hover:text-text-primary transition-all"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-sm font-semibold text-text-primary tracking-tight truncate">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-1">
          {user?.isPremium && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-700/40 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 mr-1">
              <Crown className="h-3 w-3" />Premium
            </span>
          )}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-text-tertiary hover:text-text-primary transition-all"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-bold shadow-sm select-none">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:inline">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-tertiary hover:text-red-500 transition-all ml-1"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={closeMobileSidebar} />
        )}

        {/* Mobile sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-border transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
                <Code2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-text-primary">Career Portal</span>
            </div>
            <button onClick={closeMobileSidebar} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-text-tertiary transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
          {sidebarContent}
        </aside>

        {/* Desktop sidebar */}
        <aside className={`${collapsed ? "w-16" : "w-60"} bg-bg-secondary border-r border-border transition-all duration-300 ease-in-out shrink-0 flex-col hidden lg:flex`}>
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto flex flex-col min-w-0">
          <div className="flex-1 p-4 sm:p-6 flex flex-col">
            <Outlet />
          </div>
          <footer className="border-t border-border py-3 px-6 text-center text-xs text-text-tertiary">
            Career Portal &copy; {new Date().getFullYear()}
          </footer>
        </main>
      </div>
    </div>
  );
}
