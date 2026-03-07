import { Search, Filter, FileText, Mail, Clock, X } from "lucide-react";
import { PIPELINE_COLUMNS } from "../constants";
import type { PipelineStatus } from "../constants";

export interface TrackerFilterState {
  search: string;
  status: PipelineStatus | "";
  followUpDue: boolean;
  missingCv: boolean;
  missingCoverLetter: boolean;
}

export const EMPTY_FILTERS: TrackerFilterState = {
  search: "",
  status: "",
  followUpDue: false,
  missingCv: false,
  missingCoverLetter: false,
};

interface TrackerFiltersProps {
  filters: TrackerFilterState;
  onChange: (filters: TrackerFilterState) => void;
}

export function TrackerFilters({ filters, onChange }: TrackerFiltersProps) {
  const hasActiveFilters =
    filters.status !== "" ||
    filters.followUpDue ||
    filters.missingCv ||
    filters.missingCoverLetter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search company or role…"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          aria-label="Search applications"
        />
      </div>

      {/* Status filter */}
      <div className="relative">
        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as PipelineStatus | "",
            })
          }
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-8 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {PIPELINE_COLUMNS.map((col) => (
            <option key={col.id} value={col.id}>
              {col.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle filters */}
      <ToggleChip
        active={filters.followUpDue}
        onClick={() =>
          onChange({ ...filters, followUpDue: !filters.followUpDue })
        }
        icon={<Clock className="h-3 w-3" />}
        label="Follow-up due"
      />
      <ToggleChip
        active={filters.missingCv}
        onClick={() => onChange({ ...filters, missingCv: !filters.missingCv })}
        icon={<FileText className="h-3 w-3" />}
        label="Missing CV"
      />
      <ToggleChip
        active={filters.missingCoverLetter}
        onClick={() =>
          onChange({
            ...filters,
            missingCoverLetter: !filters.missingCoverLetter,
          })
        }
        icon={<Mail className="h-3 w-3" />}
        label="Missing letter"
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Clear filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-500/10"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}
