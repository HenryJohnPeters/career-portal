import { Button } from "@careerportal/web/ui";
import type { InterviewReport as InterviewReportType } from "@careerportal/shared/types";
import {
  Play,
  Star,
  Target,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  Trophy,
  BarChart3,
} from "lucide-react";
import {
  StatCard,
  ProgressRing,
  TRACK_META,
  LEVEL_META,
  LEVEL_BADGE_STYLES,
} from "../../shared";
import type { InterviewReportProps } from "../types";

export function InterviewReport({
  activeSession,
  onStartNew,
}: InterviewReportProps) {
  const report = activeSession.report as InterviewReportType | null;
  const trackMeta = TRACK_META[activeSession.track] ?? TRACK_META.frontend;
  const levelMeta = LEVEL_META[activeSession.level] ?? LEVEL_META.mid;

  if (!report) {
    return (
      <div className="w-full">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted mb-4">
            <BarChart3 className="h-7 w-7 text-accent" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
            No report available for this session.
          </p>
          <Button variant="ghost" onClick={onStartNew}>
            ← Back to Setup
          </Button>
        </div>
      </div>
    );
  }

  const pct = report.percentage;

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onStartNew}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-sm"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${trackMeta.solid} ${trackMeta.solidText}`}
          >
            {trackMeta.icon} {trackMeta.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
              LEVEL_BADGE_STYLES[activeSession.level] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(activeSession.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <StatCard icon={Trophy} value={report.grade} label="Grade" />
        <StatCard
          icon={Star}
          value={`${report.overallScore}/${report.maxPossibleScore}`}
          label="Points"
        />
        <StatCard
          icon={Target}
          value={report.strengths.length}
          label="Strengths"
        />
        <StatCard
          icon={AlertTriangle}
          value={report.weaknesses.length}
          label="Weaknesses"
        />
      </div>

      {/* Accuracy bar */}
      <div className="mb-6">
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              pct >= 70
                ? "bg-emerald-500"
                : pct >= 40
                ? "bg-amber-500"
                : "bg-red-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            <div className={`h-1 ${trackMeta.solid}`} />
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Summary
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {report.trackSummary}
              </p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-3">
            {report.strengths.length > 0 && (
              <InfoList
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="Strengths"
                items={report.strengths}
                color="emerald"
              />
            )}
            {report.weaknesses.length > 0 && (
              <InfoList
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="Weaknesses"
                items={report.weaknesses}
                color="amber"
              />
            )}
          </div>

          {/* Suggested study areas */}
          {report.suggestedStudyAreas.length > 0 && (
            <InfoList
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Suggested Study Areas"
              items={report.suggestedStudyAreas}
              color="blue"
            />
          )}

          {/* Per-question breakdown */}
          {report.questionBreakdown.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Per-Question Breakdown
              </p>
              {report.questionBreakdown.map((q, i) => {
                const qPct =
                  q.maxScore > 0 ? Math.round((q.score / q.maxScore) * 100) : 0;
                return (
                  <div key={q.questionId ?? i} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug flex-1">
                        <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-1.5">
                          Q{i + 1}
                        </span>
                        {q.prompt}
                      </p>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          qPct >= 70
                            ? "text-emerald-600 dark:text-emerald-400"
                            : qPct >= 40
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {q.score}/{q.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          qPct >= 70
                            ? "bg-emerald-500"
                            : qPct >= 40
                            ? "bg-amber-500"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${qPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div>
            <Button size="lg" onClick={onStartNew} className="w-full">
              <Play className="h-4 w-4 mr-2" /> New Interview
            </Button>
          </div>
        </div>

        {/* Mobile score summary */}
        <div className="lg:hidden">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                percentage={pct}
                size={60}
                strokeWidth={5}
                label={report.grade}
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Score</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{report.overallScore}/{report.maxPossibleScore}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Questions</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{report.questionBreakdown.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Score Overview
              </p>
              <ProgressRing
                percentage={pct}
                size={80}
                strokeWidth={6}
                label={report.grade}
              />
              <div className="space-y-2.5">
                <SidebarStat
                  label="Score"
                  value={`${report.overallScore}/${report.maxPossibleScore}`}
                  className="text-blue-600 dark:text-blue-400"
                />
                <SidebarStat
                  label="Percentage"
                  value={`${pct}%`}
                  className={
                    pct >= 70
                      ? "text-emerald-600 dark:text-emerald-400"
                      : pct >= 40
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-500 dark:text-red-400"
                  }
                />
                <SidebarStat
                  label="Questions"
                  value={String(report.questionBreakdown.length)}
                  className="text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Session Details
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{trackMeta.icon}</span>
                  <span>{trackMeta.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{levelMeta.icon}</span>
                  <span>{levelMeta.label}</span>
                </div>
                {activeSession.persona && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>🎭</span>
                    <span className="capitalize">
                      {activeSession.persona} interviewer
                    </span>
                  </div>
                )}
                {activeSession.interviewType && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>💻</span>
                    <span className="capitalize">
                      {activeSession.interviewType}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>📅</span>
                  <span>
                    {new Date(activeSession.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Local helpers ── */

function SidebarStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-bold ${className}`}>{value}</span>
    </div>
  );
}

const COLOR_MAP: Record<
  string,
  { border: string; bg: string; label: string; text: string }
> = {
  emerald: {
    border: "border-emerald-200 dark:border-emerald-800/50",
    bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
    label: "text-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-800/50",
    bg: "bg-amber-50/50 dark:bg-amber-900/10",
    label: "text-amber-600",
    text: "text-amber-700 dark:text-amber-400",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-800/50",
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
    label: "text-blue-600",
    text: "text-blue-700 dark:text-blue-400",
  },
};

function InfoList({
  icon,
  label,
  items,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  color: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
      <p
        className={`text-xs font-semibold ${c.label} uppercase tracking-wider mb-3 flex items-center gap-1.5`}
      >
        {icon} {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className={`text-sm ${c.text}`}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
