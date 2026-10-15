import { useEffect, useId, useState } from "react";
import { Check, ChevronDown, Layers, X } from "lucide-react";
import {
  MAX_SELECTED_TAGS,
  getTechTagLabel,
  type InterviewRoleFocus,
} from "@careerportal/shared/types";
import { ROLE_TECH_PATHWAYS, type TechPathway } from "../tech-pathways";

interface TechStackPickerProps {
  role: InterviewRoleFocus;
  /** Canonical TECH_TAG_CATALOG ids. */
  selectedTags: readonly string[];
  onToggleTag: (tag: string) => void;
  onAddTags: (tags: readonly string[]) => void;
  onRemoveTags: (tags: readonly string[]) => void;
  onClear: () => void;
  /** The last add was refused because MAX_SELECTED_TAGS are selected. */
  limitReached: boolean;
}

/** Role-aware tech-stack picker over the shared tag catalog (max MAX_SELECTED_TAGS tags). */
export function TechStackPicker({
  role,
  selectedTags,
  onToggleTag,
  onAddTags,
  onRemoveTags,
  onClear,
  limitReached,
}: TechStackPickerProps) {
  const pathways = ROLE_TECH_PATHWAYS[role];
  const [expanded, setExpanded] = useState<string | null>(pathways[0]?.key ?? null);
  const atLimit = selectedTags.length >= MAX_SELECTED_TAGS;

  // A different role shows different pathways: open its first one.
  useEffect(() => {
    setExpanded(ROLE_TECH_PATHWAYS[role][0]?.key ?? null);
  }, [role]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm" aria-hidden="true">
            <Layers className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-primary">Tech stack</h3>
            <p className="text-xs text-text-secondary">
              {selectedTags.length > 0
                ? `${selectedTags.length} of ${MAX_SELECTED_TAGS} selected · questions focus on these`
                : `Pick up to ${MAX_SELECTED_TAGS} technologies to focus your questions`}
            </p>
          </div>
        </div>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <ul
          aria-label="Selected technologies"
          className="flex flex-wrap gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 p-3"
        >
          {selectedTags.map((tag) => {
            const label = getTechTagLabel(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  aria-label={`Remove ${label}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-red-500"
                >
                  {label}
                  <X className="h-3 w-3 opacity-80" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p role="status" className={limitReached ? "text-xs font-medium text-amber-700 dark:text-amber-400" : "sr-only"}>
        {limitReached ? `You can pick up to ${MAX_SELECTED_TAGS} technologies — remove one to add another.` : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {pathways.map((pathway) => (
          <PathwayCard
            key={pathway.key}
            pathway={pathway}
            selectedTags={selectedTags}
            atLimit={atLimit}
            isExpanded={expanded === pathway.key}
            onToggleExpanded={() => setExpanded((cur) => (cur === pathway.key ? null : pathway.key))}
            onToggleTag={onToggleTag}
            onAddTags={onAddTags}
            onRemoveTags={onRemoveTags}
          />
        ))}
      </div>
    </div>
  );
}

function PathwayCard({
  pathway,
  selectedTags,
  atLimit,
  isExpanded,
  onToggleExpanded,
  onToggleTag,
  onAddTags,
  onRemoveTags,
}: {
  pathway: TechPathway;
  selectedTags: readonly string[];
  atLimit: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onToggleTag: (tag: string) => void;
  onAddTags: (tags: readonly string[]) => void;
  onRemoveTags: (tags: readonly string[]) => void;
}) {
  const panelId = useId();
  const selectedHere = pathway.tags.filter((tag) => selectedTags.includes(tag));
  const count = selectedHere.length;
  const allSelected = count === pathway.tags.length;
  const Icon = pathway.icon;

  return (
    <div
      className={`rounded-xl border transition-colors overflow-hidden bg-bg-elevated ${
        count > 0 ? "border-primary-300 dark:border-primary-700 shadow-sm" : "border-border hover:border-neutral-300 dark:hover:border-neutral-700"
      } ${isExpanded ? "md:col-span-2" : ""}`}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
            count > 0 ? "bg-primary-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-text-secondary"
          }`}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary whitespace-nowrap">{pathway.label}</span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-primary-600 text-white rounded-full">
              {count}
              <span className="sr-only"> selected</span>
            </span>
          )}
          <span className="text-xs text-text-tertiary truncate">{pathway.description}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-text-tertiary shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div id={panelId} className="px-4 pb-4 pt-1 bg-neutral-50/40 dark:bg-neutral-800/20">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border">
            <span className="text-xs font-medium text-text-secondary">
              {count} of {pathway.tags.length} selected
            </span>
            <button
              type="button"
              onClick={() => (allSelected ? onRemoveTags(pathway.tags) : onAddTags(pathway.tags))}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline underline-offset-2"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pathway.tags.map((tag) => {
              const selected = selectedTags.includes(tag);
              const blocked = !selected && atLimit;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  aria-pressed={selected}
                  aria-disabled={blocked || undefined}
                  className={`inline-flex items-center justify-between gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors w-full ${
                    selected
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : blocked
                        ? "bg-bg-elevated text-text-tertiary border-border opacity-60 cursor-not-allowed"
                        : "bg-bg-elevated text-text-primary border-border hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                  }`}
                >
                  <span className="truncate">{getTechTagLabel(tag)}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
