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
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-900/20 mb-3 animate-pulse">
          <BarChart3 className="h-6 w-6 text-violet-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Evaluation is processing…
        </p>
      </div>
    );
  }

  const pct = evaluation.percentage;
  const gradeRing =
    pct >= 70
      ? "from-emerald-500 to-emerald-600"
      : pct >= 40
      ? "from-amber-500 to-amber-600"
      : "from-red-500 to-red-600";
  const gradeText =
    pct >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";
  const gradeBg =
    pct >= 70
      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40"
      : pct >= 40
      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40"
      : "bg-red-50 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/40";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={state.handleBackToSetup}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
            Test Results
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {scenario.title}
          </p>
        </div>
      </div>

      {/* Score hero */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${gradeBg}`}>
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-28 h-28" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="url(#gradeGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 301.6} 301.6`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
              <defs>
                <linearGradient
                  id="gradeGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    className={`text-${
                      pct >= 70 ? "emerald" : pct >= 40 ? "amber" : "red"
                    }-500`}
                    stopColor="currentColor"
                  />
                  <stop
                    offset="100%"
                    className={`text-${
                      pct >= 70 ? "emerald" : pct >= 40 ? "amber" : "red"
                    }-600`}
                    stopColor="currentColor"
                  />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black leading-none ${gradeText}`}>
                {evaluation.grade}
              </span>
              <span className={`text-sm font-bold ${gradeText}`}>{pct}%</span>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {evaluation.summary}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                {evaluation.overallScore}/{evaluation.maxPossible} pts
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {evaluation.requirementsCovered}/{evaluation.requirementsTotal}{" "}
                requirements
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {evaluation.wordCount} words
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria breakdown */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 pt-4 pb-2.5 border-b border-gray-100 dark:border-gray-800">
          <BarChart3 className="h-4 w-4 text-violet-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Criteria Breakdown
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {evaluation.criteriaScores.map((cs) => {
            const pct =
              cs.maxScore > 0 ? Math.round((cs.score / cs.maxScore) * 100) : 0;
            const barColor =
              pct >= 70
                ? "bg-emerald-500"
                : pct >= 40
                ? "bg-amber-500"
                : "bg-red-400";
            const textColor =
              pct >= 70
                ? "text-emerald-600 dark:text-emerald-400"
                : pct >= 40
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400";
            return (
              <div key={cs.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {cs.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cs.description}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ${textColor}`}
                  >
                    {cs.score}/{cs.maxScore}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evaluation.strengths.length > 0 && (
          <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-4 pb-2.5 border-b border-emerald-100 dark:border-emerald-800/30">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Strengths
              </h3>
            </div>
            <ul className="p-5 space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.improvements.length > 0 && (
          <div className="rounded-2xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-4 pb-2.5 border-b border-amber-100 dark:border-amber-800/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Areas to Improve
              </h3>
            </div>
            <ul className="p-5 space-y-2">
              {evaluation.improvements.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Missed requirements */}
      {evaluation.requirementsMissed.length > 0 && (
        <div className="rounded-2xl border border-red-200/50 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-4 pb-2.5 border-b border-red-100 dark:border-red-800/30">
            <XCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
              Missed Requirements
            </h3>
          </div>
          <ul className="p-5 space-y-2">
            {evaluation.requirementsMissed.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={state.handleBackToSetup}>
          <RotateCcw className="h-4 w-4 mr-1.5" /> New Test
        </Button>
        <Button variant="secondary" onClick={state.handleShowHistory}>
          View All Tests
        </Button>
      </div>
    </div>
  );
}
