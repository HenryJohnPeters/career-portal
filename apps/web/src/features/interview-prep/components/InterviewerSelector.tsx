/**
 * InterviewerSelector.tsx
 *
 * Horizontal sliding carousel of interviewer cards with avatar thumbnails.
 * Users can scroll through 8 unique interviewers with distinct appearances.
 */

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lightbulb,
  MessageCircle,
  Infinity,
} from "lucide-react";
import { INTERVIEWER_CONFIGS } from "../interviewer-configs";
import type { InterviewerConfig } from "../interviewer-configs";
import { SectionHeading } from "../../shared";
import { UserCircle2 } from "lucide-react";
import { Avatar2D } from "./Avatar2D";
import { useRef, useState, useEffect, useCallback } from "react";

interface InterviewerSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function InterviewerSelector({
  selectedId,
  onSelect,
}: InterviewerSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (dir: "left" | "right") => {
    scrollContainerRef.current?.scrollBy({
      left: dir === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative">
      <SectionHeading icon={UserCircle2} label="Choose Your Interviewer" />

      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-[55%] -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-bg-elevated border border-border shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-text-secondary" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-[55%] -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-bg-elevated border border-border shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-text-secondary" />
        </button>
      )}

      {/* Fade edges */}
      <div className="relative">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none rounded-l-2xl" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none rounded-r-2xl" />
        )}

        {/* Horizontal scrolling container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 px-1 pt-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {INTERVIEWER_CONFIGS.map((cfg, i) => (
            <InterviewerCard
              key={cfg.id}
              config={cfg}
              selected={selectedId === cfg.id}
              onSelect={() => onSelect(cfg.id)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator dots */}
      <div className="flex justify-center gap-1.5 mt-1">
        {INTERVIEWER_CONFIGS.map((cfg) => (
          <button
            key={cfg.id}
            onClick={() => onSelect(cfg.id)}
            className={`rounded-full transition-all duration-300 ${
              selectedId === cfg.id
                ? "w-6 h-1.5 bg-primary-500 shadow-glow-sm"
                : "w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600"
            }`}
            aria-label={`Select ${cfg.name}`}
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
  index,
}: {
  config: InterviewerConfig;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  // Special card for "No Interviewer" option
  if (config.id === "none") {
    return (
      <button
        type="button"
        onClick={onSelect}
        style={{ animationDelay: `${index * 50}ms` }}
        className={[
          "group relative flex-shrink-0 w-44 snap-center rounded-2xl border transition-all duration-300 animate-fade-in-up",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
          selected
            ? "border-primary-500 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-950/30 shadow-lg shadow-primary-500/10 scale-[1.02]"
            : "border-border bg-bg-secondary/50 backdrop-blur-sm hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md hover:scale-[1.02]",
        ].join(" ")}
      >
        {/* Selected indicator */}
        {selected && (
          <span className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 shadow-md shadow-primary-500/30 ring-2 ring-bg-primary animate-scale-in">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
        )}

        {/* Gradient accent bar */}
        <div
          className={`h-1 rounded-t-2xl bg-gradient-to-r ${config.gradient} ${
            selected ? "opacity-100" : "opacity-40 group-hover:opacity-70"
          } transition-opacity duration-300`}
        />

        {/* Icon area */}
        <div className="relative pt-4 px-4">
          <div
            className={`w-full aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
              selected
                ? "ring-2 ring-primary-400/50 shadow-inner"
                : "group-hover:shadow-sm"
            }`}
            style={{ background: config.avatar.background }}
          >
            <Infinity
              className={`h-12 w-12 transition-all duration-300 ${
                selected
                  ? "text-primary-400 scale-110"
                  : "text-neutral-500 group-hover:text-neutral-400 group-hover:scale-105"
              }`}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Name and Role */}
        <div className="px-4 pb-2 pt-3">
          <p
            className={`text-sm font-bold text-center leading-tight transition-colors duration-200 ${
              selected
                ? "text-primary-600 dark:text-primary-400"
                : "text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400"
            }`}
          >
            {config.name}
          </p>
          <p className="text-[11px] text-center text-text-tertiary mt-1 leading-snug">
            {config.role}
          </p>
        </div>

        {/* Trait badge */}
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-center justify-center">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors duration-200 ${
                selected
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "bg-neutral-100 dark:bg-neutral-800 text-text-tertiary group-hover:bg-primary-50 dark:group-hover:bg-primary-950/20"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Unlimited
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animationDelay: `${index * 50}ms` }}
      className={[
        "group relative flex-shrink-0 w-44 snap-center rounded-2xl border transition-all duration-300 animate-fade-in-up",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        selected
          ? "border-primary-500 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-950/30 shadow-lg shadow-primary-500/10 scale-[1.02]"
          : "border-border bg-bg-secondary/50 backdrop-blur-sm hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md hover:scale-[1.02]",
      ].join(" ")}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 shadow-md shadow-primary-500/30 ring-2 ring-bg-primary animate-scale-in">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Gradient accent bar */}
      <div
        className={`h-1 rounded-t-2xl bg-gradient-to-r ${config.gradient} ${
          selected ? "opacity-100" : "opacity-40 group-hover:opacity-70"
        } transition-opacity duration-300`}
      />

      {/* Avatar thumbnail */}
      <div className="relative pt-3 px-3">
        <div
          className={`w-full aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300 ${
            selected
              ? "ring-2 ring-primary-400/50 shadow-inner"
              : "group-hover:shadow-sm"
          }`}
          style={{ background: config.avatar.background }}
        >
          <div className="scale-[0.7] origin-top translate-y-[-8%]">
            <Avatar2D
              interviewer={config}
              mouthShape="closed"
              isSpeaking={false}
            />
          </div>
        </div>
      </div>

      {/* Name and company */}
      <div className="px-3 pb-1 pt-3">
        <p
          className={`text-sm font-bold text-center leading-tight transition-colors duration-200 ${
            selected
              ? "text-primary-600 dark:text-primary-400"
              : "text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400"
          }`}
        >
          {config.name}
        </p>
        <p className="text-[11px] text-center text-text-tertiary mt-1 leading-snug">
          {config.role.split("·")[0].trim()}
        </p>
      </div>

      {/* Traits */}
      {config.traits && (
        <div className="px-3 pb-3 pt-2 space-y-1.5">
          {/* Question count pill */}
          <div className="flex items-center justify-center">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors duration-200 ${
                selected
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "bg-neutral-100 dark:bg-neutral-800 text-text-tertiary group-hover:bg-primary-50 dark:group-hover:bg-primary-950/20"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              {config.traits.questionCount} Questions
            </span>
          </div>

          {/* Ability pills */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {config.traits.adviceLevel === "detailed" && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                <MessageCircle className="h-2.5 w-2.5" />
                Advice
              </span>
            )}
            {config.traits.fiftyFifty && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                <Lightbulb className="h-2.5 w-2.5" />
                Hints
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
