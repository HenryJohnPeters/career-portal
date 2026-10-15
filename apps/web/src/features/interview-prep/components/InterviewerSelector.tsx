import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lightbulb,
  ListOrdered,
  MessageCircle,
  UserCircle2,
} from "lucide-react";
import { requestUpgrade } from "@careerportal/web/data-access";
import {
  INTERVIEWER_CONFIGS,
  describeTraits,
  getInterviewerById,
  isInterviewerFree,
  type InterviewerConfig,
  type InterviewerId,
} from "../interviewer-configs";
import { Avatar2D } from "./Avatar2D";
import { SectionTitle } from "./common";

interface InterviewerSelectorProps {
  selectedId: InterviewerId;
  onSelect: (id: InterviewerId) => void;
  /** Premium/trial: every interviewer is available. */
  allInterviewers: boolean;
}

export function InterviewerSelector({ selectedId, onSelect, allInterviewers }: InterviewerSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const selected = getInterviewerById(selectedId) ?? INTERVIEWER_CONFIGS[0];

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
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
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  const choose = (config: InterviewerConfig) => {
    if (!allInterviewers && !isInterviewerFree(config.id)) {
      requestUpgrade({ reason: "premium_required", feature: "interviewers" });
      return;
    }
    onSelect(config.id);
  };

  return (
    <section aria-labelledby="interviewer-heading">
      <SectionTitle icon={UserCircle2}>
        <span id="interviewer-heading">Choose your interviewer</span>
      </SectionTitle>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Show previous interviewers"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated/90 border border-border shadow-md hover:bg-primary-50 dark:hover:bg-primary-950/40"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Show more interviewers"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated/90 border border-border shadow-md hover:bg-primary-50 dark:hover:bg-primary-950/40"
          >
            <ChevronRight className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
          </button>
        )}

        <div
          ref={scrollRef}
          role="list"
          className="flex gap-2.5 overflow-x-auto pb-3 pt-0.5 px-0.5 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {INTERVIEWER_CONFIGS.map((config) => (
            <div role="listitem" key={config.id} className="snap-center shrink-0">
              <InterviewerCard
                config={config}
                selected={selectedId === config.id}
                locked={!allInterviewers && !isInterviewerFree(config.id)}
                onChoose={() => choose(config)}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-1 text-xs text-text-secondary" aria-live="polite">
        <span className="font-semibold text-text-primary">{selected.name}</span>
        {selected.id !== "none" && ` — ${selected.title} · ${selected.tone}`}. {selected.style}.{" "}
        <span className="text-text-tertiary">{describeTraits(selected)}.</span>
      </p>
    </section>
  );
}

function InterviewerCard({
  config,
  selected,
  locked,
  onChoose,
}: {
  config: InterviewerConfig;
  selected: boolean;
  locked: boolean;
  onChoose: () => void;
}) {
  const isNone = config.id === "none";
  const label = `${config.name}${isNone ? "" : `, ${config.title}`}. ${describeTraits(config)}${
    locked ? ". Premium — select to see upgrade options" : ""
  }`;

  return (
    <button
      type="button"
      onClick={onChoose}
      aria-pressed={selected}
      aria-label={label}
      className={[
        "group relative w-[152px] rounded-xl overflow-hidden text-left transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        locked
          ? "opacity-70 ring-1 ring-transparent bg-bg-secondary/40"
          : selected
            ? "ring-[1.5px] ring-primary-500 dark:ring-primary-400 bg-bg-elevated shadow-lg"
            : "ring-1 ring-transparent bg-bg-secondary/60 hover:bg-bg-secondary hover:ring-border hover:shadow-md",
      ].join(" ")}
    >
      {locked && (
        <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-accent-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          <Crown className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
          Premium
        </span>
      )}
      {selected && (
        <span className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 shadow-sm">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden="true" />
        </span>
      )}

      <div className="relative px-3 pt-3">
        <div
          className={`w-full aspect-[4/3] rounded-lg overflow-hidden ${selected ? "" : "opacity-80 group-hover:opacity-100"}`}
          style={{ background: config.background }}
        >
          {isNone ? (
            <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
              <ListOrdered className={`h-10 w-10 ${selected ? "text-primary-400" : "text-neutral-500"}`} strokeWidth={1.5} />
            </div>
          ) : (
            <div className="scale-[0.7] origin-top -translate-y-[8%]">
              <Avatar2D interviewer={config} thumbnail />
            </div>
          )}
        </div>
        <div
          className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r ${config.gradient} ${
            selected ? "opacity-80" : "opacity-0 group-hover:opacity-40"
          }`}
          aria-hidden="true"
        />
      </div>

      <div className="px-3 pt-2.5 pb-1">
        <p className={`text-[13px] font-semibold leading-tight ${selected ? "text-primary-600 dark:text-primary-400" : "text-text-primary"}`}>
          {config.name}
        </p>
        <p className="text-[10px] text-text-tertiary mt-0.5 leading-snug truncate">{config.title}</p>
      </div>

      <div className="px-3 pb-3 pt-1 flex items-center gap-1 flex-wrap" aria-hidden="true">
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/60 text-text-secondary">
          {config.traits.questionCount}Q
        </span>
        {config.traits.adviceLevel === "detailed" && (
          <span className="inline-flex items-center text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full" title="Detailed feedback">
            <MessageCircle className="h-2.5 w-2.5" />
          </span>
        )}
        {config.traits.fiftyFifty && (
          <span className="inline-flex items-center text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full" title="50/50 hints">
            <Lightbulb className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
    </button>
  );
}
