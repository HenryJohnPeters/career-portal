import { Button } from "@careerportal/web/ui";
import type { InterviewReport } from "@careerportal/shared/types";
import {
  Mic,
  Play,
  ChevronRight,
  Trophy,
  Clock,
  BarChart3,
  Sparkles,
  Target,
  Star,
} from "lucide-react";
import {
  PageHero,
  EmptyFeatureState,
  StatCard,
  TRACK_META,
  LEVEL_META,
  LEVEL_BADGE_STYLES,
} from "../../shared";
import type { InterviewHomeProps } from "../types";

export function InterviewHome({
  sessions,
  onStartSetup,
  onResumeSession,
  onViewReport,
}: InterviewHomeProps) {
  const inProgress = sessions.filter((s) => s.status === "in_progress");
  const completed = sessions.filter((s) => s.status === "completed");

  const totalCompleted = completed.length;
  const avgScore =
    totalCompleted > 0
      ? Math.round(
          completed.reduce((sum, s) => {
            const r = s.report as InterviewReport | null;
            return sum + (r?.percentage ?? 0);
          }, 0) / totalCompleted
        )
      : 0;
  const bestGrade =
    completed.reduce((best, s) => {
      const r = s.report as InterviewReport | null;
      return (r?.percentage ?? 0) > (best?.percentage ?? 0) ? r : best;
    }, null as InterviewReport | null)?.grade ?? "—";

  return (
    <div className="w-full space-y-8">
      <PageHero
        icon={Mic}
        title="Interview Prep"
        subtitle="Simulate real technical interviews · Adaptive questions · Detailed feedback"
        action={
          <Button
            size="lg"
            onClick={onStartSetup}
            className="bg-accent hover:bg-accent-dark text-white border-0 shadow-sm"
          >
            <Play className="h-4 w-4 mr-2" /> New Interview
          </Button>
        }
      />

      {/* Stats overview */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={Target}
            value={sessions.length}
            label="Total Sessions"
          />
          <StatCard icon={Trophy} value={totalCompleted} label="Completed" />
          <StatCard icon={BarChart3} value={`${avgScore}%`} label="Avg Score" />
          <StatCard icon={Star} value={bestGrade} label="Best Grade" />
        </div>
      )}

      {/* Mobile start button */}
      <div className="sm:hidden">
        <Button size="lg" onClick={onStartSetup} className="w-full">
          <Play className="h-4 w-4 mr-2" /> New Interview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* In-progress sessions */}
          {inProgress.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  In Progress
                </h2>
                <span className="text-[10px] font-bold text-accent bg-accent-muted px-1.5 py-0.5 rounded-md">
                  {inProgress.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {inProgress.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onClick={() => onResumeSession(s)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed sessions */}
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted">
                  <Trophy className="h-3.5 w-3.5 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Completed
                </h2>
                <span className="text-[10px] font-bold text-accent bg-accent-muted px-1.5 py-0.5 rounded-md">
                  {completed.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {completed.map((s) => {
                  const report = s.report as InterviewReport | null;
                  return (
                    <CompletedCard
                      key={s.id}
                      session={s}
                      report={report}
                      onClick={() => onViewReport(s)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {sessions.length === 0 && (
            <EmptyFeatureState
              title="No interviews yet"
              subtitle="Start your first mock interview to practice"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="h-2 bg-primary-600" />
              <div className="p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Quick Start
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Create a new interview session with custom settings tailored
                  to your preparation goals.
                </p>
                <Button size="lg" onClick={onStartSetup} className="w-full">
                  <Play className="h-4 w-4 mr-2" /> New Interview
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-accent-muted bg-accent-muted/50 p-4">
              <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> How it works
              </p>
              <ul className="space-y-1.5">
                {[
                  "Choose your track, level & interview style",
                  "Answer adaptive multiple-choice questions",
                  "Get detailed feedback from an AI interviewer",
                  "Review reports to track your progress",
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

/* ── Local sub-components ── */

function SessionCard({
  session: s,
  onClick,
}: {
  session: InterviewHomeProps["sessions"][number];
  onClick: () => void;
}) {
  const progress = s.questions.filter((q) => q.userAnswer).length;
  const pct =
    s.questions.length > 0
      ? Math.round((progress / s.questions.length) * 100)
      : 0;
  const meta = TRACK_META[s.track] ?? TRACK_META.frontend;
  const levelMeta = LEVEL_META[s.level] ?? LEVEL_META.mid;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-all group overflow-hidden shadow-sm hover:shadow-md"
    >
      <div className={`h-1 -mt-5 -mx-5 mb-4 ${meta.solid}`} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${meta.solid} ${meta.solidText}`}
          >
            {meta.icon} {meta.label}
          </span>
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              LEVEL_BADGE_STYLES[s.level] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
        {s.tags.slice(0, 4).join(", ")} · {s.persona} interviewer
      </p>
      <div
        className={`w-full ${meta.solid} opacity-20 rounded-full h-1.5 overflow-hidden`}
      >
        <div
          className={`${meta.solid} h-1.5 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-gray-400">
          {progress}/{s.questions.length} answered
        </p>
        <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">
          {pct}%
        </p>
      </div>
    </button>
  );
}

function CompletedCard({
  session: s,
  report,
  onClick,
}: {
  session: InterviewHomeProps["sessions"][number];
  report: InterviewReport | null;
  onClick: () => void;
}) {
  const meta = TRACK_META[s.track] ?? TRACK_META.frontend;
  const levelMeta = LEVEL_META[s.level] ?? LEVEL_META.mid;
  const pct = report?.percentage ?? 0;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group overflow-hidden shadow-sm hover:shadow-md"
    >
      <div className={`h-1 -mt-5 -mx-5 mb-4 ${meta.solid}`} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${meta.solid} ${meta.solidText}`}
          >
            {meta.icon} {meta.label}
          </span>
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              LEVEL_BADGE_STYLES[s.level] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
        </div>
        <span
          className={`text-lg font-bold ${
            pct >= 70
              ? "text-emerald-600 dark:text-emerald-400"
              : pct >= 40
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-500 dark:text-red-400"
          }`}
        >
          {report?.grade ?? "—"}
        </span>
      </div>

      {report && (
        <>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className={`h-1.5 rounded-full transition-all ${
                pct >= 70
                  ? "bg-emerald-500"
                  : pct >= 40
                  ? "bg-amber-500"
                  : "bg-red-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              {report.overallScore}/{report.maxPossibleScore} pts
            </p>
            <p
              className={`text-[10px] font-semibold ${
                pct >= 70
                  ? "text-emerald-500"
                  : pct >= 40
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
            >
              {pct}%
            </p>
          </div>
        </>
      )}

      <p className="text-[10px] text-gray-400 mt-2">
        {new Date(s.createdAt).toLocaleDateString()}
      </p>
    </button>
  );
}
