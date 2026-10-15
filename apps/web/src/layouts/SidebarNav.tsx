import { useId } from "react";
import { NavLink } from "react-router-dom";
import {
  Brain,
  Briefcase,
  ChevronDown,
  ClipboardList,
  Code2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  beta?: boolean;
};

type NavGroup = {
  label: string;
  icon: LucideIcon;
  children: NavItem[];
};

type NavEntry =
  | { type: "item"; item: NavItem }
  | { type: "group"; group: NavGroup }
  | { type: "separator" };

export const JOB_TRACKER_PATH = "/app/jobs";

const NAV_ENTRIES: NavEntry[] = [
  { type: "item", item: { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard } },
  { type: "separator" },
  {
    type: "group",
    group: {
      label: "Applications",
      icon: Briefcase,
      children: [
        { to: "/app/cv", label: "CV Builder", icon: FileText },
        { to: "/app/cover-letters", label: "Cover Letters", icon: Mail },
        { to: JOB_TRACKER_PATH, label: "Job Tracker", icon: ClipboardList },
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
        { to: "/app/practice", label: "Practice Questions", icon: Brain, beta: true },
        { to: "/app/technical-tests", label: "Mock Tests", icon: Code2, beta: true },
      ],
    },
  },
  { type: "separator" },
  { type: "item", item: { to: "/app/billing", label: "Billing", icon: CreditCard } },
  { type: "item", item: { to: "/app/settings", label: "Settings", icon: Settings } },
];

/** Counts shown next to nav items, keyed by path (e.g. overdue follow-ups on the tracker). */
export type NavBadges = Partial<Record<string, { count: number; label: string }>>;

function BetaTag() {
  return (
    <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 px-1.5 py-0.5 rounded-md">
      Beta
    </span>
  );
}

function NavItemLink({
  item,
  collapsed,
  nested = false,
  badge,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  nested?: boolean;
  badge?: { count: number; label: string };
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const count = badge && badge.count > 0 ? badge.count : 0;
  const badgeText = count > 0 ? `${count} ${badge?.label}` : null;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? [item.label, badgeText].filter(Boolean).join(", ") : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
          isActive
            ? "bg-primary-600 text-white shadow-sm"
            : "text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-text-primary"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative shrink-0">
            <Icon
              aria-hidden="true"
              className={`${nested ? "h-3.5 w-3.5" : "h-4 w-4"} ${
                isActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary"
              }`}
            />
            {collapsed && count > 0 && (
              <span aria-hidden="true" className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-bg-secondary" />
            )}
          </span>
          {!collapsed && (
            <span className={`truncate flex items-center gap-2 flex-1 ${nested ? "text-[13px]" : ""}`}>
              {item.label}
              {item.beta && <BetaTag />}
              {count > 0 && (
                <span
                  className={`ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-5 ${
                    isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  <span aria-hidden="true">{count > 9 ? "9+" : count}</span>
                  <span className="sr-only">, {badgeText}</span>
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
  badges,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
  badges: NavBadges;
  onNavigate?: () => void;
}) {
  const listId = useId();
  const Icon = group.icon;
  const isGroupActive = group.children.some((child) => pathname.startsWith(child.to));

  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.children.map((child) => (
          <NavItemLink key={child.to} item={child} collapsed badge={badges[child.to]} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={listId}
        className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
          isGroupActive
            ? "text-text-primary"
            : "text-text-tertiary hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-text-secondary"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate flex-1 text-left text-xs font-semibold uppercase tracking-widest">
          {group.label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
        />
      </button>
      <div id={listId} hidden={!expanded} className="mt-1 space-y-0.5 pl-3">
        {group.children.map((child) => (
          <NavItemLink
            key={child.to}
            item={child}
            collapsed={false}
            nested
            badge={badges[child.to]}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

interface SidebarNavProps {
  collapsed: boolean;
  pathname: string;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  badges: NavBadges;
  onNavigate?: () => void;
}

export function SidebarNav({
  collapsed,
  pathname,
  expandedGroups,
  onToggleGroup,
  badges,
  onNavigate,
}: SidebarNavProps) {
  return (
    <nav aria-label="Main" className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
      {NAV_ENTRIES.map((entry, idx) => {
        if (entry.type === "separator") {
          return <div key={`sep-${idx}`} role="separator" className="!my-3 mx-1 border-t border-border" />;
        }
        if (entry.type === "item") {
          return (
            <NavItemLink
              key={entry.item.to}
              item={entry.item}
              collapsed={collapsed}
              badge={badges[entry.item.to]}
              onNavigate={onNavigate}
            />
          );
        }
        return (
          <NavGroupSection
            key={entry.group.label}
            group={entry.group}
            collapsed={collapsed}
            expanded={expandedGroups[entry.group.label] ?? true}
            onToggle={() => onToggleGroup(entry.group.label)}
            pathname={pathname}
            badges={badges}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}
