import { Button } from "@careerportal/web/ui";
import {
  Play,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Star,
  AlertTriangle,
  Target,
  Package,
  Lock,
  Lightbulb,
  FileText,
  Building2,
  BarChart3,
} from "lucide-react";
import { LEVEL_META } from "../../shared";
import {
  ROLE_FOCUS_ITEMS,
  DIFFICULTY_ITEMS,
} from "../../interview-prep/constants";
import type { TechTestScenario } from "@careerportal/shared/types";
import type { useTechTestState } from "../hooks/useTechTestState";

interface TechTestBriefProps {
  state: ReturnType<typeof useTechTestState>;
}

export function TechTestBrief({ state }: TechTestBriefProps) {
  const test = state.activeTest;
  if (!test) return null;

  const scenario = test.scenario as TechTestScenario;
  const levelMeta = LEVEL_META[test.level] ?? LEVEL_META.mid;
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === test.roleFocus);
  const diffMeta = DIFFICULTY_ITEMS.find((d) => d.key === test.difficulty);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={state.handleBackToSetup}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mt-0.5"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {scenario.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {[
              roleMeta?.icon + " " + (roleMeta?.label ?? test.roleFocus),
              levelMeta.icon + " " + levelMeta.label,
              (diffMeta?.icon ?? "🟡") +
                " " +
                (diffMeta?.label ?? test.difficulty),
              "⏱️ " + test.timeLimit + " min",
              "📐 " + scenario.estimatedTime,
            ].map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-lg"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Company context */}
      <div className="rounded-2xl border border-violet-200/50 dark:border-violet-800/40 bg-violet-50/60 dark:bg-violet-950/20 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1.5">
              Company Context
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {scenario.companyContext}
            </p>
          </div>
        </div>
      </div>

      {/* Brief */}
      <BriefSection icon={FileText} title="Problem Brief">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {scenario.brief}
        </p>
        {scenario.background && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-3 italic">
            {scenario.background}
          </p>
        )}
      </BriefSection>

      {/* Requirements */}
      <BriefSection
        icon={CheckCircle2}
        title={`Requirements (${scenario.requirements.length})`}
      >
        <div className="space-y-2.5">
          {scenario.requirements.map((req, idx) => (
            <div
              key={req.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold mt-0.5">
                {idx + 1}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-0.5">
                  {req.key}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {req.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </BriefSection>

      {/* Non-functional */}
      {scenario.nonFunctional.length > 0 && (
        <BriefSection icon={AlertTriangle} title="Non-Functional Requirements">
          <ul className="space-y-2">
            {scenario.nonFunctional.map((nf, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {nf}
              </li>
            ))}
          </ul>
        </BriefSection>
      )}

      {/* Two-col sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BriefSection icon={Target} title="Acceptance Criteria">
          <ul className="space-y-2">
            {scenario.acceptanceCriteria.map((ac, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {ac}
              </li>
            ))}
          </ul>
        </BriefSection>
        <BriefSection icon={Package} title="Deliverables">
          <ul className="space-y-2">
            {scenario.deliverables.map((d, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <Package className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                {d}
              </li>
            ))}
          </ul>
        </BriefSection>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BriefSection icon={Lock} title="Constraints">
          <ul className="space-y-2">
            {scenario.constraints.map((c, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <Lock className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                {c}
              </li>
            ))}
          </ul>
        </BriefSection>
        <BriefSection icon={Lightbulb} title="Hints">
          <ul className="space-y-2">
            {scenario.hints.map((h, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                {h}
              </li>
            ))}
          </ul>
        </BriefSection>
      </div>

      {scenario.bonusChallenges.length > 0 && (
        <BriefSection icon={Star} title="Bonus Challenges">
          <ul className="space-y-2">
            {scenario.bonusChallenges.map((b, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </BriefSection>
      )}

      {/* Evaluation criteria */}
      <BriefSection icon={BarChart3} title="Evaluation Criteria">
        <div className="space-y-2">
          {scenario.evaluationCriteria.map((ec) => (
            <div
              key={ec.name}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white text-xs font-bold">
                {ec.weight}%
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {ec.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {ec.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </BriefSection>

      {/* Sticky start bar */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Ready to begin?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The {test.timeLimit}-minute timer starts once you click Start.
            </p>
          </div>
          <Button
            size="lg"
            onClick={state.handleStart}
            loading={state.isStarting}
            className="shrink-0 w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-1.5" /> Start Test
          </Button>
        </div>
      </div>
    </div>
  );
}

function BriefSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2.5 border-b border-gray-100 dark:border-gray-800">
        <Icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {title}
        </h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
