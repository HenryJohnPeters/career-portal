/**
 * InterviewerSelector.tsx
 *
 * Horizontal sliding carousel of interviewer cards with avatar thumbnails.
 * Users can scroll through 8 unique interviewers with distinct appearances.
 */

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { INTERVIEWER_CONFIGS } from "../interviewer-configs";
import type { InterviewerConfig } from "../interviewer-configs";
import { SectionHeading } from "../../shared";
import { UserCircle2 } from "lucide-react";
import { Avatar2D } from "./Avatar2D";
import { useRef } from "react";

interface InterviewerSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function InterviewerSelector({
  selectedId,
  onSelect,
}: InterviewerSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  return (
    <section className="relative">
      <SectionHeading icon={UserCircle2} label="Choose Your Interviewer" />

      {/* Scroll buttons */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors hidden md:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors hidden md:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Horizontal scrolling container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {INTERVIEWER_CONFIGS.map((cfg) => (
          <InterviewerCard
            key={cfg.id}
            config={cfg}
            selected={selectedId === cfg.id}
            onSelect={() => onSelect(cfg.id)}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center gap-2 mt-2">
        {INTERVIEWER_CONFIGS.map((cfg) => (
          <div
            key={cfg.id}
            className={`h-1.5 rounded-full transition-all ${
              selectedId === cfg.id
                ? "w-6 bg-blue-500"
                : "w-1.5 bg-gray-300 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Single card with avatar thumbnail ───────────────────────────────────── */

function InterviewerCard({
  config,
  selected,
  onSelect,
}: {
  config: InterviewerConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  // Special card for "No Interviewer" option
  if (config.id === "none") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={[
          "relative flex-shrink-0 w-40 snap-center rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:scale-105",
          selected
            ? "border-blue-500 shadow-2xl"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg",
        ].join(" ")}
      >
        {/* Selected check */}
        {selected && (
          <span className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow-lg ring-4 ring-white dark:ring-gray-900">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </span>
        )}

        {/* No Interviewer Icon */}
        <div className="relative pt-3 px-3">
          <div
            className={`w-full h-36 rounded-xl overflow-hidden transition-all flex items-center justify-center ${
              selected ? "ring-3 ring-blue-500" : ""
            }`}
            style={{ background: config.avatar.background }}
          >
            <div className="text-6xl opacity-50">{config.emoji}</div>
          </div>
        </div>

        {/* Name and Role */}
        <div className="px-3 pb-3 pt-2">
          <p
            className={`text-base font-black text-center leading-tight ${
              selected
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {config.name}
          </p>
          <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-1">
            {config.role}
          </p>
        </div>

        {/* Traits display for endless mode */}
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
            <span className="font-semibold">∞ Questions</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative flex-shrink-0 w-40 snap-center rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:scale-105",
        selected
          ? "border-blue-500 shadow-2xl"
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg",
      ].join(" ")}
    >
      {/* Selected check */}
      {selected && (
        <span className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow-lg ring-4 ring-white dark:ring-gray-900">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Avatar thumbnail */}
      <div className="relative pt-3 px-3">
        <div
          className={`w-full h-36 rounded-xl overflow-hidden transition-all ${
            selected ? "ring-3 ring-blue-500" : ""
          }`}
          style={{ background: config.avatar.background }}
        >
          <div className="scale-75 -mt-3">
            <Avatar2D
              interviewer={config}
              mouthShape="closed"
              isSpeaking={false}
            />
          </div>
        </div>
      </div>

      {/* Name and Works at */}
      <div className="px-3 pb-3 pt-2">
        <p
          className={`text-base font-black text-center leading-tight ${
            selected
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {config.name}
        </p>
        <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-1">
          Works at {config.role.split("·")[0].trim()}
        </p>
      </div>

      {/* Traits display */}
      {config.traits && (
        <div className="px-3 pb-3 pt-1 space-y-1 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
            <span className="font-semibold">
              {config.traits.questionCount} Questions
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            {config.traits.adviceLevel === "detailed" && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                💬 Extra Advice
              </span>
            )}
            {config.traits.fiftyFifty && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                💡 Hints
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
