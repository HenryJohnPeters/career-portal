import { useState } from "react";
import { Check, ChevronDown, Layers, Sparkles, X } from "lucide-react";
import type { InterviewRoleFocus } from "@careerportal/shared/types";
import {
  ROLE_TECH_PATHWAYS,
  ROLE_FOCUS_ITEMS,
  type TechPathway,
} from "../constants";

interface TechStackPickerProps {
  roleFocus: InterviewRoleFocus;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export function TechStackPicker({
  roleFocus,
  selectedTags,
  onToggleTag,
}: TechStackPickerProps) {
  const pathways = ROLE_TECH_PATHWAYS[roleFocus] ?? [];
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === roleFocus);
  const [expandedPathway, setExpandedPathway] = useState<string | null>(
    pathways[0]?.key ?? null
  );

  const totalSelected = selectedTags.length;

  return (
    <div className="space-y-4">
      {/* Header with role context + selected count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-dark/10 to-indigo-500/10 dark:from-accent-dark/20 dark:to-indigo-500/20">
            <Layers className="h-4 w-4 text-accent-dark dark:text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Your {roleMeta?.label ?? "Fullstack"} Stack
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Select the technologies you'll be interviewed on
            </p>
          </div>
        </div>

        {totalSelected > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-dark/10 dark:bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent-dark dark:text-accent">
              <Sparkles className="h-3 w-3" />
              {totalSelected} selected
            </span>
            <button
              onClick={() => selectedTags.forEach((t) => onToggleTag(t))}
              className="text-[11px] font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Selected tags pills — quick overview at a glance */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-3">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className="group inline-flex items-center gap-1 rounded-full bg-accent-dark text-white dark:bg-accent dark:text-gray-950 px-2.5 py-1 text-[11px] font-medium shadow-sm transition-all hover:bg-red-500 dark:hover:bg-red-500 dark:hover:text-white"
            >
              {tag}
              <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* Pathway cards */}
      <div className="space-y-2">
        {pathways.map((pathway) => (
          <PathwayCard
            key={pathway.key}
            pathway={pathway}
            selectedTags={selectedTags}
            isExpanded={expandedPathway === pathway.key}
            onToggle={() =>
              setExpandedPathway(
                expandedPathway === pathway.key ? null : pathway.key
              )
            }
            onToggleTag={onToggleTag}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Pathway Card ── */

function PathwayCard({
  pathway,
  selectedTags,
  isExpanded,
  onToggle,
  onToggleTag,
}: {
  pathway: TechPathway;
  selectedTags: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onToggleTag: (tag: string) => void;
}) {
  const selectedInPathway = pathway.items.filter((item) =>
    selectedTags.includes(item)
  );
  const count = selectedInPathway.length;
  const allSelected = count === pathway.items.length && count > 0;

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSelected) {
      // Deselect all in this pathway
      selectedInPathway.forEach((tag) => onToggleTag(tag));
    } else {
      // Select all not yet selected
      pathway.items.forEach((item) => {
        if (!selectedTags.includes(item)) onToggleTag(item);
      });
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        count > 0
          ? "border-accent-dark/30 dark:border-accent/30 bg-white dark:bg-gray-900 shadow-sm"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <span className="text-lg shrink-0">{pathway.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {pathway.label}
            </span>
            {count > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-accent-dark/10 dark:bg-accent/15 text-accent-dark dark:text-accent rounded-full">
                {count}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            {pathway.description}
          </p>
        </div>

        {/* Quick preview of selected items when collapsed */}
        {!isExpanded && count > 0 && (
          <div className="hidden sm:flex items-center gap-1 max-w-[180px] overflow-hidden">
            {selectedInPathway.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium bg-accent-dark/10 dark:bg-accent/10 text-accent-dark dark:text-accent px-1.5 py-0.5 rounded-full truncate"
              >
                {tag}
              </span>
            ))}
            {count > 2 && (
              <span className="text-[10px] text-gray-400">+{count - 2}</span>
            )}
          </div>
        )}

        <ChevronDown
          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          {/* Select all toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {count} of {pathway.items.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-[11px] font-medium text-accent-dark dark:text-accent hover:underline"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Tech chips */}
          <div className="flex flex-wrap gap-2">
            {pathway.items.map((item) => {
              const selected = selectedTags.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => onToggleTag(item)}
                  className={`group relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 ${
                    selected
                      ? "bg-accent-dark text-white border-accent-dark shadow-sm shadow-accent-dark/20 dark:bg-accent dark:text-gray-950 dark:border-accent dark:shadow-accent/20"
                      : "bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent-dark/40 dark:hover:border-accent/40 hover:bg-accent-dark/5 dark:hover:bg-accent/5"
                  }`}
                >
                  {selected && <Check className="h-3 w-3 shrink-0" />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
