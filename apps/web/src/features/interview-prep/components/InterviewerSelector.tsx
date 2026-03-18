/**
 * InterviewerSelector.tsx
 *
 * A card grid rendered in InterviewSetup that lets the user pick
 * which interviewer (avatar + voice) they want for their Mock Interview.
 *
 * Selecting a card simply calls onSelect(id); no avatar loading happens
 * here — that is deferred until the session actually starts.
 */

import { Check } from "lucide-react";
import { INTERVIEWER_CONFIGS } from "../interviewer-configs";
import type { InterviewerConfig } from "../interviewer-configs";
import { SectionHeading } from "../../shared";
import { UserCircle2 } from "lucide-react";

interface InterviewerSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function InterviewerSelector({
  selectedId,
  onSelect,
}: InterviewerSelectorProps) {
  return (
    <section>
      <SectionHeading icon={UserCircle2} label="Mock Interviewer" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {INTERVIEWER_CONFIGS.map((cfg) => (
          <InterviewerCard
            key={cfg.id}
            config={cfg}
            selected={selectedId === cfg.id}
            onSelect={() => onSelect(cfg.id)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Single card ─────────────────────────────────────────────────────────── */

function InterviewerCard({
  config,
  selected,
  onSelect,
}: {
  config: InterviewerConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative text-left w-full rounded-2xl border-2 p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        selected
          ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 shadow-md"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Gradient accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${config.gradient}`}
      />

      {/* Selected check */}
      {selected && (
        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Avatar emoji */}
      <div className="mt-1 mb-3">
        <span
          className={[
            "inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl",
            `bg-gradient-to-br ${config.gradient} bg-opacity-10`,
          ].join(" ")}
          style={{ background: "transparent" }}
        >
          {config.emoji}
        </span>
      </div>

      {/* Text */}
      <p
        className={`text-sm font-bold leading-tight mb-0.5 ${
          selected
            ? "text-blue-700 dark:text-blue-300"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {config.name}
      </p>
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
        {config.role}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
        {config.style}
      </p>

      {/* "3D Avatar" badge */}
      <div className="mt-3 flex items-center gap-1">
        <span
          className={[
            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
            selected
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
          ].join(" ")}
        >
          🎭 3D Avatar + Voice
        </span>
      </div>
    </button>
  );
}
