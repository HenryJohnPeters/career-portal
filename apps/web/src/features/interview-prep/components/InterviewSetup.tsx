import { Button } from "@careerportal/web/ui";
import type {
  InterviewLevel,
  InterviewRoleFocus,
  InterviewType,
} from "@careerportal/shared/types";
import {
  Mic,
  Hash,
  TrendingUp,
  Briefcase,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
  Play,
  Brain,
  Target,
  Zap,
  CheckCircle2,
  Users,
  Settings2,
} from "lucide-react";
import { PageHero, OptionGrid, SectionHeading, LEVEL_META } from "../../shared";
import type { OptionItem } from "../../shared";
import { ROLE_FOCUS_ITEMS, INTERVIEW_TYPE_ITEMS } from "../constants";
import type { InterviewSetupProps } from "../types";
import { TechStackPicker } from "./TechStackPicker";
import { InterviewerSelector } from "./InterviewerSelector";

const LEVEL_ITEMS: OptionItem[] = Object.entries(LEVEL_META).map(
  ([key, m]) => ({
    key,
    icon: m.icon,
    label: m.label,
    description: m.description,
  })
);

export function InterviewSetup({
  options,
  level,
  selectedTags,
  questionCount,
  roleFocus,
  interviewType,
  expandedCategories,
  isCreating,
  onLevelChange,
  onRoleFocusChange,
  onInterviewTypeChange,
  onQuestionCountChange,
  onToggleTag,
  onToggleCategory,
  onCreateSession,
  isPracticeStarting,
  onStartPractice,
  selectedInterviewerId,
  onInterviewerChange,
}: InterviewSetupProps) {
  const levelMeta = LEVEL_META[level] ?? LEVEL_META.mid;
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === roleFocus);

  return (
    <div className="w-full space-y-6">
      <PageHero
        icon={Mic}
        title="Practice"
        subtitle="Configure every dimension · The question engine adapts dynamically"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Left — Config */}
        <div className="lg:col-span-2 space-y-4">
          <section>
            <SectionHeading icon={TrendingUp} label="Level" />
            <OptionGrid
              items={LEVEL_ITEMS}
              value={level}
              onChange={(v) => onLevelChange(v as InterviewLevel)}
              columns="grid-cols-1 sm:grid-cols-3"
            />
          </section>

          <section>
            <SectionHeading icon={Briefcase} label="Role Focus" />
            <OptionGrid
              items={ROLE_FOCUS_ITEMS}
              value={roleFocus}
              onChange={(v) => onRoleFocusChange(v as InterviewRoleFocus)}
            />
          </section>

          <InterviewerSelector
            selectedId={selectedInterviewerId}
            onSelect={onInterviewerChange}
          />

          <section>
            <TechStackPicker
              roleFocus={roleFocus}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          </section>

          <section>
            <SectionHeading icon={SlidersHorizontal} label="Question Count" />
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">
                  Number of Questions
                </span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {questionCount}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={25}
                value={questionCount}
                onChange={(e) => onQuestionCountChange(Number(e.target.value))}
                className="w-full h-1.5 accent-primary-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1.5">
                <span>3 (quick)</span>
                <span>25 (thorough)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right — Summary + Actions */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Interview Summary Card */}
            <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-sm">
              <div className="h-1 bg-primary-600" />
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">
                    Your Interview
                  </p>
                  <h3 className="text-base font-bold text-text-primary">
                    {levelMeta.label} Practice
                  </h3>
                </div>

                <div className="space-y-2">
                  <PreviewRow
                    icon={TrendingUp}
                    label="Level"
                    value={levelMeta.label}
                    valueClass={levelMeta.color}
                  />
                  <PreviewRow
                    icon={Briefcase}
                    label="Role Focus"
                    value={roleMeta?.label ?? "Fullstack"}
                  />
                  <PreviewRow
                    icon={Hash}
                    label="Questions"
                    value={String(questionCount)}
                  />
                  {selectedTags.length > 0 && (
                    <div className="flex items-start gap-2.5 pt-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-primary">
                        <Hash className="h-3.5 w-3.5 text-text-tertiary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-text-tertiary mb-1">
                          Topics
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedTags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md"
                            >
                              {t}
                            </span>
                          ))}
                          {selectedTags.length > 4 && (
                            <span className="text-[10px] font-medium text-text-tertiary px-1 py-0.5">
                              +{selectedTags.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 pb-4">
                <Button
                  size="lg"
                  onClick={onCreateSession}
                  loading={isCreating}
                  className="w-full"
                >
                  <Play className="h-4 w-4" /> Start Interview
                </Button>
              </div>
            </div>

            {/* Practice Mode Card */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden shadow-sm">
              <div className="h-1 bg-emerald-500" />
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                      Quick Practice
                    </h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                      Endless questions with instant feedback. Perfect for
                      building confidence.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={onStartPractice}
                  loading={isPracticeStarting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Zap className="h-4 w-4" /> Start Practicing
                </Button>
              </div>
            </div>

            {/* Tips Card */}
            <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-600">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Quick Tips
                </p>
              </div>
              <ul className="divide-y divide-border">
                {[
                  {
                    icon: Target,
                    tip: "Questions adapt to your selected difficulty",
                  },
                  {
                    icon: CheckCircle2,
                    tip: "Follow-up questions test deeper understanding",
                  },
                  {
                    icon: Users,
                    tip: "Persona affects interviewer tone & feedback",
                  },
                  {
                    icon: TrendingUp,
                    tip: "Review reports to track improvement over time",
                  },
                ].map(({ icon: Icon, tip }) => (
                  <li
                    key={tip}
                    className="flex items-center gap-2.5 px-3.5 py-2.5"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                    <span className="text-[11px] text-text-secondary leading-snug">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Preview Row (local to setup) ── */

function PreviewRow({
  icon: Icon,
  label,
  value,
  valueClass = "text-text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-primary">
        <Icon className="h-3.5 w-3.5 text-text-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-text-tertiary">{label}</p>
        <p className={`text-sm font-semibold ${valueClass} truncate`}>
          {value}
        </p>
      </div>
    </div>
  );
}
