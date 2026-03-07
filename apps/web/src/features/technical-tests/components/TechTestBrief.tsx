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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={state.handleBackToSetup}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {scenario.title}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <MetaChip
              icon={roleMeta?.icon ?? "🔗"}
              label={roleMeta?.label ?? test.roleFocus}
            />
            <MetaChip icon={levelMeta.icon} label={levelMeta.label} />
            <MetaChip
              icon={diffMeta?.icon ?? "🟡"}
              label={diffMeta?.label ?? test.difficulty}
            />
            <MetaChip icon="⏱️" label={`${test.timeLimit} min`} />
            <MetaChip icon="📐" label={scenario.estimatedTime} />
          </div>
        </div>
      </div>

      {/* Company context */}
      <div className="rounded-2xl border border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/20 p-5">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-1">
              Company Context
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {scenario.companyContext}
            </p>
          </div>
        </div>
      </div>

      {/* Brief */}
      <Section icon={FileText} title="Problem Brief">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {scenario.brief}
        </p>
        {scenario.background && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-3 italic">
            {scenario.background}
          </p>
        )}
      </Section>

      {/* Requirements */}
      <Section
        icon={CheckCircle2}
        title={`Requirements (${scenario.requirements.length})`}
      >
        <div className="space-y-3">
          {scenario.requirements.map((req, idx) => (
            <div
              key={req.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold mt-0.5">
                {idx + 1}
              </span>
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-0.5">
                  {req.key}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {req.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Non-functional */}
      {scenario.nonFunctional.length > 0 && (
        <Section icon={AlertTriangle} title="Non-Functional Requirements">
          <ul className="space-y-2">
            {scenario.nonFunctional.map((nf, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {nf}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Two-column layout for smaller sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Acceptance criteria */}
        <Section icon={Target} title="Acceptance Criteria">
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
        </Section>

        {/* Deliverables */}
        <Section icon={Package} title="Deliverables">
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
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Constraints */}
        <Section icon={Lock} title="Constraints">
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
        </Section>

        {/* Hints */}
        <Section icon={Lightbulb} title="Hints">
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
        </Section>
      </div>

      {/* Bonus challenges */}
      {scenario.bonusChallenges.length > 0 && (
        <Section icon={Star} title="Bonus Challenges">
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
        </Section>
      )}

      {/* Evaluation rubric */}
      <Section icon={BarChart3} title="Evaluation Criteria">
        <div className="space-y-2">
          {scenario.evaluationCriteria.map((ec) => (
            <div
              key={ec.name}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
                {ec.weight}%
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {ec.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ec.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Start button */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Ready to begin?
            </p>
            <p className="text-xs text-gray-500">
              The {test.timeLimit}-minute timer starts once you click Start.
            </p>
          </div>
          <Button
            size="lg"
            onClick={state.handleStart}
            loading={state.isStarting}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white border-0 shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Play className="h-4 w-4 mr-2" /> Start Test
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
      <span>{icon}</span> {label}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
