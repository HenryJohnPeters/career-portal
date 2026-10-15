import type { ReactNode } from "react";
import { Clock, FileText, Filter, Mail, Search, X } from "lucide-react";
import type { JobStatus } from "@careerportal/shared/types";
import { PIPELINE_COLUMNS } from "../constants";
import { EMPTY_FILTERS, hasToggleFilters, type TrackerFilterState } from "../lib/board";

interface TrackerFiltersProps {
  filters: TrackerFilterState;
  onChange: (filters: TrackerFilterState) => void;
}

export function TrackerFilters({ filters, onChange }: TrackerFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" role="search" aria-label="Filter applications">
      <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search company, role or skill…"
          maxLength={200}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          aria-label="Search applications"
        />
      </div>

      <div className="relative">
        <Filter
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as JobStatus | "" })}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-8 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-shadow"
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

      <div className="flex flex-wrap gap-2">
        <ToggleChip
          active={filters.followUpDue}
          onClick={() => onChange({ ...filters, followUpDue: !filters.followUpDue })}
          icon={<Clock className="h-3 w-3" aria-hidden="true" />}
          label="Follow-up due"
        />
        <ToggleChip
          active={filters.missingCv}
          onClick={() => onChange({ ...filters, missingCv: !filters.missingCv })}
          icon={<FileText className="h-3 w-3" aria-hidden="true" />}
          label="Missing CV"
        />
        <ToggleChip
          active={filters.missingCoverLetter}
          onClick={() => onChange({ ...filters, missingCoverLetter: !filters.missingCoverLetter })}
          icon={<Mail className="h-3 w-3" aria-hidden="true" />}
          label="Missing letter"
        />

        {hasToggleFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>
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
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
