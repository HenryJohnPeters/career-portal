import { Button } from "@careerportal/web/ui";
import {
  ArrowLeft,
  Trophy,
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  FileText,
  RotateCcw,
} from "lucide-react";
import type {
  TechTestScenario,
  TechTestEvaluation,
} from "@careerportal/shared/types";
import type { useTechTestState } from "../hooks/useTechTestState";

interface TechTestResultsProps {
  state: ReturnType<typeof useTechTestState>;
}

export function TechTestResults({ state }: TechTestResultsProps) {
  const test = state.activeTest;
  if (!test) return null;

  const scenario = test.scenario as TechTestScenario;
  const evaluation = test.evaluation as TechTestEvaluation | null;

  if (!evaluation) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-20">
        <p className="text-gray-500">Evaluation is processing…</p>
      </div>
    );
  }

  const gradeColor =
    evaluation.percentage >= 70
      ? "from-emerald-500 to-teal-500"
      : evaluation.percentage >= 40
      ? "from-amber-500 to-orange-500"
      : "from-red-500 to-rose-500";

  const gradeTextColor =
    evaluation.percentage >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : evaluation.percentage >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

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
            Test Results
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {scenario.title}
          </p>
        </div>
        <Button variant="secondary" onClick={state.handleBackToSetup}>
          <RotateCcw className="h-4 w-4 mr-2" /> New Test
        </Button>
      </div>

      {/* Score hero */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <div className={`h-2 bg-gradient-to-r ${gradeColor}`} />
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="6"
                strokeDasharray={`${evaluation.percentage * 2.64} ${
                  264 - evaluation.percentage * 2.64
                }`}
                strokeLinecap="round"
                className={gradeTextColor}
              />
            </svg>
            <div className="text-center">
              <span className={`text-2xl font-black ${gradeTextColor}`}>
                {evaluation.grade}
              </span>
              <p className="text-xs text-gray-400">{evaluation.percentage}%</p>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {evaluation.summary}
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <StatChip
                icon="📝"
                label="Words"
                value={String(evaluation.wordCount)}
              />
              <StatChip
                icon="✅"
                label="Requirements"
                value={`${evaluation.requirementsCovered}/${evaluation.requirementsTotal}`}
              />
              <StatChip
                icon="📊"
                label="Score"
                value={`${Math.round(evaluation.overallScore)}/${
                  evaluation.maxPossible
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Criteria breakdown */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Criteria Breakdown
          </h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {evaluation.criteriaScores.map((cs) => {
            const pct =
              cs.maxScore > 0 ? Math.round((cs.score / cs.maxScore) * 100) : 0;
            const barColor =
              pct >= 70
                ? "bg-emerald-500"
                : pct >= 40
                ? "bg-amber-500"
                : "bg-red-500";
            return (
              <div key={cs.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {cs.name}
                  </p>
                  <span className="text-xs font-mono text-gray-400">
                    {cs.score.toFixed(1)} / {cs.maxScore}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {cs.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evaluation.strengths.length > 0 && (
          <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-4 pb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Strengths
              </h3>
            </div>
            <ul className="px-5 pb-5 space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.improvements.length > 0 && (
          <div className="rounded-2xl border border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-4 pb-2">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Areas to Improve
              </h3>
            </div>
            <ul className="px-5 pb-5 space-y-2">
              {evaluation.improvements.map((imp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {imp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Missed requirements */}
      {evaluation.requirementsMissed.length > 0 && (
        <div className="rounded-2xl border border-red-200/50 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-4 pb-2">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
              Requirements Not Detected
            </h3>
          </div>
          <div className="px-5 pb-5 flex flex-wrap gap-2">
            {evaluation.requirementsMissed.map((r) => (
              <span
                key={r}
                className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submission preview */}
      {test.submission && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-4 pb-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Your Submission
            </h3>
          </div>
          <div className="px-5 pb-5">
            <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-h-80 overflow-y-auto">
              {test.submission}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
      <span>{icon}</span>
      <span>{label}:</span>
      <span className="font-bold text-gray-700 dark:text-gray-300">
        {value}
      </span>
    </div>
  );
}
