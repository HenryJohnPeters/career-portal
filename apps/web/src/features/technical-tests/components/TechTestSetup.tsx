import { AlertCircle, Briefcase, ClipboardCheck, History, Play, Sparkles, TrendingUp } from "lucide-react";
import { getTechTagLabel, isMeterExhausted, type PlanUsage } from "@careerportal/shared/types";
import { Alert, Button } from "@careerportal/web/ui";
import { useTechnicalTests } from "@careerportal/web/data-access";
import { formatResetDate } from "../../../lib/plan-usage";
import { PageHero } from "../../shared";
import {
  ActionError,
  AllowanceMeter,
  ChoiceGrid,
  requestQuotaUpgrade,
  type Choice,
} from "../../interview-prep/components/common";
import { TechStackPicker } from "../../interview-prep/components/TechStackPicker";
import { LEVELS, LEVEL_META, ROLE_FOCUSES, ROLE_FOCUS_META, getLevelMeta, getRoleFocusMeta } from "../../interview-prep/meta";
import type { TechTestSetupState } from "../hooks/useTechTestSetup";

const ROLE_CHOICES: Choice<(typeof ROLE_FOCUSES)[number]>[] = ROLE_FOCUSES.map((role) => ({
  value: role,
  ...ROLE_FOCUS_META[role],
}));

const LEVEL_CHOICES: Choice<(typeof LEVELS)[number]>[] = LEVELS.map((level) => ({
  value: level,
  ...LEVEL_META[level],
}));

const HOW_IT_WORKS = [
  "A realistic take-home brief is generated for your role, level and stack",
  "Read the requirements, acceptance criteria and rubric",
  "Start when ready — a suggested time is shown, nothing is auto-submitted",
  "Write your solution: code, architecture and trade-offs (drafts autosave on this device)",
  "Submit for an automated checklist, then rate yourself against the rubric",
  "Premium: get an AI review of your solution",
];

interface TechTestSetupProps {
  setup: TechTestSetupState;
  isPremium: boolean;
  usage: PlanUsage | undefined;
  onShowHistory: () => void;
}

export function TechTestSetup({ setup, isPremium, usage, onShowHistory }: TechTestSetupProps) {
  const { data: testsData } = useTechnicalTests();
  const testCount = testsData?.data.length ?? 0;
  const meter = usage?.meters.techTests;
  const exhausted = isMeterExhausted(meter);
  const resetLabel = formatResetDate(meter?.resetsAt ?? usage?.periodResetsAt);
  const role = getRoleFocusMeta(setup.role);
  const level = getLevelMeta(setup.level);
  const RoleIcon = role.icon;
  const LevelIcon = level.icon;
  const canGenerate = setup.selectedTags.length > 0 && !exhausted;

  const historyButton =
    testCount > 0 ? (
      <Button variant="secondary" onClick={onShowHistory}>
        <History className="h-4 w-4" aria-hidden="true" /> Past tests ({testCount})
      </Button>
    ) : undefined;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <PageHero
        icon={ClipboardCheck}
        title="Technical Tests"
        subtitle="Realistic take-home briefs · Write your solution · Review it against the rubric"
        action={historyButton}
      />
      {historyButton && <div className="sm:hidden">{historyButton}</div>}

      {!isPremium && usage && meter && (
        <section aria-label="Your free allowance" className="rounded-2xl border border-border bg-bg-elevated p-4 space-y-2">
          <AllowanceMeter quota="techTests" meter={meter} />
          <p className="text-xs text-text-secondary">
            Free plan · Deleting a test doesn't give back an allowance. Premium removes the limit and adds AI reviews.
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChoiceGrid
            label="Role"
            icon={Briefcase}
            choices={ROLE_CHOICES}
            value={setup.role}
            onChange={setup.setRole}
            columns="grid-cols-2 sm:grid-cols-4"
          />
          <ChoiceGrid
            label="Experience level"
            icon={TrendingUp}
            choices={LEVEL_CHOICES}
            value={setup.level}
            onChange={setup.setLevel}
            columns="grid-cols-1 sm:grid-cols-3"
          />
          <TechStackPicker
            role={setup.role}
            selectedTags={setup.selectedTags}
            onToggleTag={setup.toggleTag}
            onAddTags={setup.addTags}
            onRemoveTags={setup.removeTags}
            onClear={setup.clearTags}
            limitReached={setup.tagLimitReached}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-3">
            <section className="rounded-2xl border border-border bg-bg-elevated overflow-hidden shadow-sm" aria-labelledby="test-summary-heading">
              <div className="h-1 bg-violet-600" />
              <div className="p-5 space-y-3">
                <h2 id="test-summary-heading" className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Your test
                </h2>
                <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <RoleIcon className="h-4 w-4 text-text-tertiary" aria-hidden="true" /> {role.label}
                </p>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <LevelIcon className="h-4 w-4 text-text-tertiary" aria-hidden="true" /> {level.label}
                </p>
                {setup.selectedTags.length > 0 ? (
                  <p className="text-xs text-text-secondary">
                    {setup.selectedTags.slice(0, 6).map(getTechTagLabel).join(", ")}
                    {setup.selectedTags.length > 6 ? ` +${setup.selectedTags.length - 6}` : ""}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Pick at least one technology
                  </p>
                )}
              </div>
              <div className="px-5 pb-5 space-y-3">
                <ActionError error={setup.error} title="Couldn't generate the test" onDismiss={setup.dismissError} />
                {exhausted && (
                  <Alert
                    variant="warning"
                    title="You've used this month's free tests"
                    action={
                      <Button size="sm" onClick={() => requestQuotaUpgrade("techTests", meter)}>
                        See upgrade options
                      </Button>
                    }
                  >
                    {resetLabel ? `New tests are available from ${resetLabel}.` : "New tests are available next month."}
                  </Alert>
                )}
                <Button size="lg" onClick={setup.generate} loading={setup.isGenerating} disabled={!canGenerate} className="w-full">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {setup.isGenerating ? "Generating…" : "Generate test"}
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-bg-elevated overflow-hidden" aria-labelledby="how-it-works-heading">
              <h2
                id="how-it-works-heading"
                className="flex items-center gap-2 px-4 py-3 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
                How it works
              </h2>
              <ol className="divide-y divide-border">
                {HOW_IT_WORKS.map((tip, i) => (
                  <li key={tip} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 tabular-nums">{i + 1}</span>
                    <span className="text-xs text-text-secondary leading-snug">{tip}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
