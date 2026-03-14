import { Button } from "@careerportal/web/ui";
import {
  ClipboardCheck,
  TrendingUp,
  Timer,
  Play,
  Sparkles,
  Briefcase,
  History,
} from "lucide-react";
import { PageHero, OptionGrid, SectionHeading, LEVEL_META } from "../../shared";
import type { OptionItem } from "../../shared";
import { ROLE_FOCUS_ITEMS } from "../../interview-prep/constants";
import { TechStackPicker } from "../../interview-prep/components/TechStackPicker";
import type {
  InterviewRoleFocus,
  InterviewLevel,
} from "@careerportal/shared/types";
import type { useTechTestState } from "../hooks/useTechTestState";

const LEVEL_ITEMS: OptionItem[] = Object.entries(LEVEL_META).map(
  ([key, m]) => ({
    key,
    icon: m.icon,
    label: m.label,
    description: m.description,
  })
);

const TIME_LIMIT_ITEMS: OptionItem[] = [
  { key: "30", icon: "⚡", label: "30 min", description: "Quick challenge" },
  { key: "60", icon: "⏱️", label: "1 hour", description: "Standard" },
  { key: "90", icon: "🕐", label: "1.5 hours", description: "In-depth" },
  { key: "120", icon: "🕑", label: "2 hours", description: "Comprehensive" },
  { key: "180", icon: "🕒", label: "3 hours", description: "Take-home" },
];

interface TechTestSetupProps {
  state: ReturnType<typeof useTechTestState>;
}

export function TechTestSetup({ state }: TechTestSetupProps) {
  const levelMeta = LEVEL_META[state.level] ?? LEVEL_META.mid;
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === state.roleFocus);
  const timeMeta = TIME_LIMIT_ITEMS.find(
    (t) => t.key === String(state.timeLimit)
  );

  return (
    <div className="w-full space-y-8">
      <PageHero
        icon={ClipboardCheck}
        title="Technical Tests"
        subtitle="In-depth coding challenges · Real-world scenarios · Detailed evaluation"
        action={
          state.tests.length > 0 ? (
            <Button variant="secondary" onClick={state.handleShowHistory}>
              <History className="h-4 w-4 mr-2" /> Past Tests (
              {state.tests.length})
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Config */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <SectionHeading icon={Briefcase} label="Role Focus" />
            <OptionGrid
              items={ROLE_FOCUS_ITEMS}
              value={state.roleFocus}
              onChange={(v) => state.setRoleFocus(v as InterviewRoleFocus)}
            />
          </section>

          <section>
            <SectionHeading icon={TrendingUp} label="Experience Level" />
            <OptionGrid
              items={LEVEL_ITEMS}
              value={state.level}
              onChange={(v) => state.setLevel(v as InterviewLevel)}
              columns="grid-cols-1 sm:grid-cols-3"
            />
          </section>

          <section>
            <TechStackPicker
              roleFocus={state.roleFocus}
              selectedTags={state.selectedTags}
              onToggleTag={state.toggleTag}
            />
          </section>

          <section>
            <SectionHeading icon={Timer} label="Time Limit" />
            <OptionGrid
              items={TIME_LIMIT_ITEMS}
              value={String(state.timeLimit)}
              onChange={(v) => state.setTimeLimit(Number(v))}
              columns="grid-cols-2 sm:grid-cols-5"
            />
          </section>
        </div>

        {/* Right — Summary + Generate */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="h-2 bg-violet-600" />
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Your Test
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {roleMeta?.label ?? "Fullstack"} · {levelMeta.label}
                  </h3>
                </div>

                <div className="space-y-3">
                  <PreviewRow
                    icon={roleMeta?.icon ?? "🔗"}
                    label="Role"
                    value={roleMeta?.label ?? "Fullstack"}
                  />
                  <PreviewRow
                    icon={levelMeta.icon}
                    label="Level"
                    value={levelMeta.label}
                  />
                  <PreviewRow
                    icon={timeMeta?.icon ?? "⏱️"}
                    label="Time Limit"
                    value={timeMeta?.label ?? "1 hour"}
                  />
                  {state.selectedTags.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                        Tech Stack
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {state.selectedTags.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                        {state.selectedTags.length > 6 && (
                          <span className="text-[10px] text-gray-400">
                            +{state.selectedTags.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5">
                <Button
                  size="lg"
                  onClick={state.handleGenerate}
                  loading={state.isGenerating}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" /> Generate Test Scenario
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-accent-muted bg-accent-muted/50 p-4">
              <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> How it works
              </p>
              <ul className="space-y-1.5">
                {[
                  "A realistic scenario is generated based on your filters",
                  "Review the problem brief, requirements, and acceptance criteria",
                  "Start the timer when you're ready to begin",
                  "Write your solution — code, architecture, explanations",
                  "Submit for automated evaluation and feedback",
                ].map((tip) => (
                  <li
                    key={tip}
                    className="text-[11px] text-accent/80 leading-relaxed flex items-start gap-1.5">
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

function PreviewRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <span className="text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {value}
        </p>
      </div>
    </div>
  );
}
