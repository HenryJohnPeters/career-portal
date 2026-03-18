import { Button } from "@careerportal/web/ui";
import {
  Brain,
  TrendingUp,
  Hash,
  Clock,
  Play,
  Sparkles,
  Briefcase,
  Lock,
  Crown,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { PageHero, OptionGrid, SectionHeading, LEVEL_META } from "../../shared";
import type { OptionItem } from "../../shared";
import type { PracticeState } from "../types";
import { ROLE_FOCUS_ITEMS } from "../../interview-prep/constants";
import { TechStackPicker } from "../../interview-prep/components/TechStackPicker";
import type { InterviewRoleFocus } from "@careerportal/shared/types";

const LEVEL_ITEMS: OptionItem[] = Object.entries(LEVEL_META).map(
  ([key, m]) => ({
    key,
    icon: m.icon,
    label: m.label,
    description: m.description,
  })
);

interface PracticeSetupProps {
  state: PracticeState;
  onStart: () => void;
}

export function PracticeSetup({ state, onStart }: PracticeSetupProps) {
  const levelMeta = LEVEL_META[state.level] ?? LEVEL_META.mid;
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === state.roleFocus);
  const usage = state.practiceUsage;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <PageHero
        icon={Brain}
        title="Practice Mode"
        subtitle="AI-tailored questions · Instant feedback · Track your progress"
      />

      {/* Daily usage banner */}
      {usage && !usage.isPremium && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800/40">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {usage.remaining === 0
                  ? "Daily limit reached"
                  : `${usage.remaining} of ${usage.limit} questions left today`}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                {usage.remaining === 0
                  ? `Resets midnight UTC · ${new Date(
                      usage.resetsAt
                    ).toLocaleDateString()}`
                  : "Free plan · 10 questions per day"}
              </p>
            </div>
          </div>
          <NavLink
            to="/app/billing"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
          >
            <Crown className="h-3.5 w-3.5" />
            Unlimited
          </NavLink>
        </div>
      )}

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
              onChange={state.setLevel}
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
        </div>

        {/* Right — Summary + Start */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-3">
            {/* Session card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              {/* Accent bar */}
              <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-600" />

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                    Your Session
                  </p>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {roleMeta?.label ?? "Fullstack"} · {levelMeta.label}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  <SessionRow
                    emoji={roleMeta?.icon ?? "🔗"}
                    label="Role"
                    value={roleMeta?.label ?? "Fullstack"}
                  />
                  <SessionRow
                    emoji={levelMeta.icon}
                    label="Level"
                    value={levelMeta.label}
                    valueClass={levelMeta.color}
                  />
                  <SessionRow emoji="⏱️" label="Mode" value="Endless" />
                  {state.selectedTags.length > 0 && (
                    <div className="flex items-start gap-3 pt-0.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                        <Hash className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                          Topics
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {state.selectedTags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded-md"
                            >
                              {t}
                            </span>
                          ))}
                          {state.selectedTags.length > 4 && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              +{state.selectedTags.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5">
                {usage?.remaining === 0 ? (
                  <NavLink
                    to="/app/billing"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors"
                  >
                    <Lock className="h-4 w-4" /> Upgrade to Continue
                  </NavLink>
                ) : (
                  <Button
                    size="lg"
                    onClick={onStart}
                    loading={state.isLoadingNext}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-1.5" /> Start Practising
                  </Button>
                )}
              </div>
            </div>

            {/* Tips card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Tips
                </p>
              </div>
              <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {[
                  {
                    emoji: "🎯",
                    tip: "Questions are tailored to your role & level",
                  },
                  {
                    emoji: "✅",
                    tip: "Some questions require multiple correct answers",
                  },
                  {
                    emoji: "📖",
                    tip: "Every answer includes a detailed explanation",
                  },
                  {
                    emoji: "🔧",
                    tip: "Pick topics to focus on your exact stack",
                  },
                ].map(({ emoji, tip }) => (
                  <li key={tip} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm shrink-0">{emoji}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
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

function SessionRow({
  emoji,
  label,
  value,
  valueClass = "text-gray-800 dark:text-gray-200",
}: {
  emoji: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
        <span className="text-sm">{emoji}</span>
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-xs font-semibold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
