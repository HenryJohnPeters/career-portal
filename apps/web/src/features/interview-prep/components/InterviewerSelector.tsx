/**
 * InterviewerSelector.tsx
 *
 * Modern minimalist interviewer carousel with clean card design,
 * subtle glassmorphism, and smooth micro-interactions.
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

      {/* Scroll navigation */}
      <div className="relative group/carousel">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-glow-sm transition-all duration-300 hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-text-secondary" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-glow-sm transition-all duration-300 hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
          </button>
        )}

        {/* Fade edges */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrolling container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2.5 overflow-x-auto pb-3 pt-0.5 px-0.5 snap-x snap-mandatory scrollbar-hide"
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

      {/* Minimal scroll indicator */}
      <div className="flex justify-center gap-1 mt-2">
        {INTERVIEWER_CONFIGS.map((cfg) => (
          <button
            key={cfg.id}
            onClick={() => onSelect(cfg.id)}
            className={`rounded-full transition-all duration-500 ease-out ${
              selectedId === cfg.id
                ? "w-5 h-1 bg-primary-500"
                : "w-1 h-1 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-500"
            }`}
            aria-label={`Select ${cfg.name}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Interviewer card ──────────────────────────────────────────────────── */

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
  const isNone = config.id === "none";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animationDelay: `${index * 40}ms` }}
      className={[
        "group relative flex-shrink-0 w-[152px] snap-center rounded-xl overflow-hidden transition-all duration-300 animate-fade-in-up",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        selected
          ? "ring-[1.5px] ring-primary-500 dark:ring-primary-400 bg-bg-elevated shadow-lg shadow-primary-500/8 dark:shadow-primary-500/5"
          : "ring-1 ring-transparent bg-bg-secondary/60 hover:bg-bg-secondary hover:ring-border hover:shadow-md",
      ].join(" ")}
    >
      {/* Selection check */}
      {selected && (
        <span className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 shadow-sm animate-scale-in">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Avatar area */}
      <div className="relative px-3 pt-3">
        <div
          className={`w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 ${
            selected ? "shadow-sm" : "opacity-80 group-hover:opacity-100"
          }`}
          style={{ background: config.avatar.background }}
        >
          {isNone ? (
            <div className="w-full h-full flex items-center justify-center">
              <Infinity
                className={`h-10 w-10 transition-all duration-300 ${
                  selected
                    ? "text-primary-400"
                    : "text-neutral-500 group-hover:text-neutral-400"
                }`}
                strokeWidth={1.5}
              />
            </div>
          ) : (
            <div className="scale-[0.7] origin-top translate-y-[-8%]">
              <Avatar2D
                interviewer={config}
                mouthShape="closed"
                isSpeaking={false}
              />
            </div>
          )}
        </div>

        {/* Gradient accent line */}
        <div
          className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r ${
            config.gradient
          } transition-opacity duration-300 ${
            selected ? "opacity-80" : "opacity-0 group-hover:opacity-40"
          }`}
        />
      </div>

      {/* Info */}
      <div className="px-3 pt-2.5 pb-1">
        <p
          className={`text-[13px] font-semibold leading-tight transition-colors duration-200 ${
            selected
              ? "text-primary-600 dark:text-primary-400"
              : "text-text-primary"
          }`}
        >
          {config.name}
        </p>
        <p className="text-[10px] text-text-tertiary mt-0.5 leading-snug truncate">
          {isNone ? config.role : config.role.split("·")[0].trim()}
        </p>
      </div>

      {/* Tags */}
      <div className="px-3 pb-3 pt-1">
        {isNone ? (
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 ${
              selected
                ? "bg-primary-100/80 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300"
                : "bg-neutral-100 dark:bg-neutral-800/60 text-text-tertiary"
            }`}
          >
            <Sparkles className="h-2.5 w-2.5" />
            Unlimited
          </span>
        ) : config.traits ? (
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 ${
                selected
                  ? "bg-primary-100/80 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300"
                  : "bg-neutral-100 dark:bg-neutral-800/60 text-text-tertiary"
              }`}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {config.traits.questionCount}Q
            </span>
            {config.traits.adviceLevel === "detailed" && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full">
                <MessageCircle className="h-2.5 w-2.5" />
              </span>
            )}
            {config.traits.fiftyFifty && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                <Lightbulb className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        ) : null}
      </div>
    </button>
  );
}
