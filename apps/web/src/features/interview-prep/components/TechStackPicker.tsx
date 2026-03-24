import { useState } from "react";
import {
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import * as Icons from "lucide-react";
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
  isPremium?: boolean;
}

// Helper to get icon component from string name
function getIconComponent(iconName: string) {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.HelpCircle;
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
            <Layers className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {roleMeta?.label ?? "Fullstack"} Stack
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalSelected > 0 
                ? `${totalSelected} selected · Questions will focus on these technologies`
                : "Select technologies to refine your interview questions"}
            </p>
          </div>
        </div>

        {totalSelected > 0 && (
          <button
            onClick={() => selectedTags.forEach((t) => onToggleTag(t))}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Selected tags pills - modern compact style */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50/50 to-primary-100/30 dark:from-primary-900/10 dark:to-primary-800/5 p-3.5">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:bg-red-500 hover:shadow-md hover:scale-105 active:scale-95"
            >
              {tag}
              <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* Info banner about question refinement */}
      {totalSelected > 0 && (
        <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                Your interview questions will be tailored to <span className="font-bold text-primary-700 dark:text-primary-400">{totalSelected} selected {totalSelected === 1 ? 'technology' : 'technologies'}</span>
              </p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                Questions adapt in real-time based on your selections
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pathway cards - grid layout when collapsed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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

  const IconComponent = getIconComponent(pathway.icon);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        count > 0
          ? "border-primary-300 dark:border-primary-700 bg-white dark:bg-gray-900 shadow-md shadow-primary-100 dark:shadow-primary-900/20"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
      } ${isExpanded ? 'md:col-span-2' : ''}`}
    >
      {/* Header - compact single row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
          count > 0 
            ? "bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm" 
            : "bg-gray-100 dark:bg-gray-800"
        }`}>
          <IconComponent className={`h-4 w-4 ${
            count > 0 
              ? "text-white" 
              : "text-gray-600 dark:text-gray-400"
          }`} />
        </div>
        
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {pathway.label}
          </span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-primary-600 text-white rounded-full shadow-sm">
              {count}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {pathway.description}
          </span>
        </div>

        {/* Quick preview of selected items when collapsed */}
        {!isExpanded && count > 0 && (
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {selectedInPathway.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded truncate max-w-[60px]"
              >
                {tag}
              </span>
            ))}
            {count > 2 && (
              <span className="text-[10px] font-medium text-gray-500">+{count - 2}</span>
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
        <div className="px-4 pb-4 pt-1 bg-gray-50/30 dark:bg-gray-800/20">
          {/* Select all toggle */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {count} of {pathway.items.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline underline-offset-2"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Tech chips - modern gradient style */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pathway.items.map((item) => {
              const selected = selectedTags.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => onToggleTag(item)}
                  className={`group relative inline-flex items-center justify-between gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all duration-150 w-full ${
                    selected
                      ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white border-primary-600 shadow-md shadow-primary-500/25 scale-[1.02]"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:scale-[1.02]"
                  }`}
                >
                  <span className="truncate">{item}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
