import { Button } from "@careerportal/web/ui";
import type {
  InterviewLevel,
  InterviewRoleFocus,
  InterviewType,
} from "@careerportal/shared/types";
import {
  Mic,
  Zap,
  Hash,
  TrendingUp,
  Briefcase,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
  Play,
  Brain,
} from "lucide-react";
import { PageHero, OptionGrid, SectionHeading, LEVEL_META } from "../../shared";
import type { OptionItem } from "../../shared";
import { ROLE_FOCUS_ITEMS, INTERVIEW_TYPE_ITEMS } from "../constants";
import type { InterviewSetupProps } from "../types";
import { TechStackPicker } from "./TechStackPicker";

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
}: InterviewSetupProps) {
  const levelMeta = LEVEL_META[level] ?? LEVEL_META.mid;
  const typeMeta = INTERVIEW_TYPE_ITEMS.find((t) => t.key === interviewType);
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === roleFocus);

  return (
    <div className="w-full space-y-8">
      <PageHero
        icon={Mic}
        title="Interview Prep"
        subtitle="Configure every dimension · The question engine adapts dynamically"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Config */}
        <div className="lg:col-span-2 space-y-6">
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

          <section>
            <SectionHeading icon={MessageSquare} label="Interview Type" />
            <OptionGrid
              items={INTERVIEW_TYPE_ITEMS}
              value={interviewType}
              onChange={(v) => onInterviewTypeChange(v as InterviewType)}
              columns="grid-cols-1 sm:grid-cols-3"
            />
          </section>

          <section>
            <TechStackPicker
              roleFocus={roleFocus}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          </section>

          <section>
            <SectionHeading icon={SlidersHorizontal} label="Question Count" />
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Questions
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {questionCount}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={25}
                value={questionCount}
                onChange={(e) => onQuestionCountChange(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>3 (quick)</span>
                <span>25 (thorough)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right — Summary + Start */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="h-2 bg-gradient-to-r from-accent-dark to-indigo-600" />
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Your Interview
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {typeMeta?.label ?? "Coding"} · {levelMeta.label}
                  </h3>
                </div>

                <div className="space-y-3">
                  <PreviewRow
                    icon={levelMeta.icon}
                    label="Level"
                    value={levelMeta.label}
                    valueClass={levelMeta.color}
                  />
                  <PreviewRow
                    icon={roleMeta?.icon ?? "🔗"}
                    label="Role Focus"
                    value={roleMeta?.label ?? "Fullstack"}
                  />
                  <PreviewRow
                    icon={typeMeta?.icon ?? "💻"}
                    label="Type"
                    value={typeMeta?.label ?? "Coding"}
                  />
                  <PreviewRow
                    icon="📝"
                    label="Questions"
                    value={String(questionCount)}
                  />
                  {selectedTags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Hash className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Topics
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {selectedTags.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded"
                            >
                              {t}
                            </span>
                          ))}
                          {selectedTags.length > 5 && (
                            <span className="text-[10px] text-gray-400">
                              +{selectedTags.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5">
                <Button
                  size="lg"
                  onClick={onCreateSession}
                  loading={isCreating}
                  className="w-full bg-gradient-to-r from-accent-dark to-indigo-600 hover:opacity-90 text-white border-0 shadow-lg shadow-accent/20"
                >
                  <Play className="h-4 w-4 mr-2" /> Start Interview
                </Button>
              </div>
            </div>

            {/* Practice card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Quick Practice
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Endless Questions
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Uses your selected role, level &amp; topics above. Instant
                    feedback, track your streak &amp; accuracy.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={onStartPractice}
                  loading={isPracticeStarting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white border-0 shadow-lg shadow-emerald-500/20"
                >
                  <Brain className="h-4 w-4 mr-2" /> Start Practicing
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-accent-muted bg-accent-muted/50 p-4">
              <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Quick tips
              </p>
              <ul className="space-y-1.5">
                {[
                  "Questions adapt to your selected difficulty",
                  "Follow-up questions test deeper understanding",
                  "Persona affects interviewer tone & feedback",
                  "Review reports to track improvement over time",
                ].map((tip) => (
                  <li
                    key={tip}
                    className="text-[11px] text-accent/80 leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="mt-1 h-1 w-1 rounded-full bg-accent shrink-0" />
                    {tip}
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
  icon,
  label,
  value,
  valueClass = "text-gray-800 dark:text-gray-200",
}: {
  icon: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <span className="text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
