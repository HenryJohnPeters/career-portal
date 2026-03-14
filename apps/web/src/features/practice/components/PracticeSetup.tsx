import { Button } from "@careerportal/web/ui";
import {
  Brain,
  Layers,
  TrendingUp,
  Hash,
  Clock,
  Play,
  Sparkles,
  Briefcase,
  Lock,
  Crown,
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
    <div className="w-full space-y-8">
      <PageHero
        icon={Brain}
        title="Practice Mode"
        subtitle="Endless questions · Instant feedback · Track your progress"
      />

      {/* Daily usage banner for free users */}
      {usage && !usage.isPremium && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-800/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {usage.remaining === 0
                  ? "Daily limit reached"
                  : `${usage.remaining} of ${usage.limit} questions remaining today`}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/60">
                {usage.remaining === 0
                  ? `Resets at midnight UTC · ${new Date(
                      usage.resetsAt
                    ).toLocaleDateString()}`
                  : "Free users get 10 practice questions per day"}
              </p>
            </div>
          </div>
          <NavLink
            to="/app/billing"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent-400 px-3.5 py-2 text-xs font-bold text-white hover:bg-accent-500 transition-colors shadow-sm"
          >
            <Crown className="h-3.5 w-3.5" />
            Upgrade for Unlimited
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
          <div className="sticky top-6 space-y-4">
            <SessionPreviewCard
              roleMeta={roleMeta}
              levelMeta={levelMeta}
              selectedTags={state.selectedTags}
              isLoading={state.isLoadingNext}
              onStart={onStart}
              dailyLimitReached={usage?.remaining === 0}
            />

            <div className="rounded-xl border border-accent-muted bg-accent-muted/50 p-4">
              <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Quick tips
              </p>
              <ul className="space-y-1.5">
                {[
                  "Questions adapt to your selected level",
                  "Build streaks for momentum tracking",
                  "Some questions allow multiple answers",
                  "Read explanations to learn from mistakes",
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

/* ── Session Preview (local to setup) ── */

function SessionPreviewCard({
  roleMeta,
  levelMeta,
  selectedTags,
  isLoading,
  onStart,
  dailyLimitReached,
}: {
  roleMeta: OptionItem | undefined;
  levelMeta: (typeof LEVEL_META)[string];
  selectedTags: string[];
  isLoading: boolean;
  onStart: () => void;
  dailyLimitReached?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated overflow-hidden shadow-sm">
      <div className="h-2 bg-primary-600" />
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
            Your Session
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {roleMeta?.label ?? "Fullstack"} · {levelMeta.label}
          </h3>
        </div>

        <div className="space-y-3">
          <PreviewRow
            icon={roleMeta?.icon ?? "🔗"}
            label="Role Focus"
            value={roleMeta?.label ?? "Fullstack"}
          />
          <PreviewRow
            icon={levelMeta.icon}
            label="Experience Level"
            value={levelMeta.label}
            valueClass={levelMeta.color}
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
          <PreviewRow icon="⏱️" label="Mode" value="Endless" />
        </div>
      </div>

      <div className="px-5 pb-5">
        {dailyLimitReached ? (
          <NavLink
            to="/app/billing"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-400 px-4 py-3 text-sm font-bold text-white hover:bg-accent-500 transition-colors shadow-sm"
          >
            <Lock className="h-4 w-4" /> Upgrade to Continue
          </NavLink>
        ) : (
          <Button
            size="lg"
            onClick={onStart}
            loading={isLoading}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" /> Start Practicing
          </Button>
        )}
      </div>
    </div>
  );
}

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
