import { Button, Spinner } from "@careerportal/web/ui";
import {
  Send,
  ChevronRight,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Zap,
  BookOpen,
  Target,
  Sparkles,
  Filter,
} from "lucide-react";
import {
  BackButton,
  ResultBanner,
  AnswerOption,
  StatCard,
  ProgressRing,
  TRACK_META,
  LEVEL_META,
  LEVEL_BADGE_STYLES,
} from "../../shared";
import type { InterviewSessionProps } from "../types";

export function InterviewSession({
  nextQuestion,
  nextLoading,
  lastFeedback,
  selectedOptionIndex,
  isSubmitting,
  activeSession,
  onSelectOption,
  onSubmitAnswer,
  onNextQuestion,
  onViewReport,
  onBackToSetup,
}: InterviewSessionProps) {
  if (nextLoading) return <Spinner />;

  const isCompleted =
    nextQuestion?.sessionStatus === "completed" ||
    !nextQuestion?.sessionQuestion;
  const sq = nextQuestion?.sessionQuestion;
  const progress = nextQuestion?.progress ?? { answered: 0, total: 0 };
  const progressPct =
    progress.total > 0
      ? Math.round((progress.answered / progress.total) * 100)
      : 0;

  const trackMeta =
    TRACK_META[activeSession?.track ?? "frontend"] ?? TRACK_META.frontend;
  const levelMeta = LEVEL_META[activeSession?.level ?? "mid"] ?? LEVEL_META.mid;

  if (isCompleted && !lastFeedback) {
    return (
      <div className="w-full">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border-2 border-primary-500/30 bg-primary-500/5 p-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted mb-4">
              <Trophy className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Interview Complete! 🎉
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              You've answered all {progress.total} questions. View your detailed
              report to see how you did.
            </p>
            <div className="flex justify-center gap-3">
              <Button size="lg" onClick={onViewReport}>
                <BarChart3 className="h-4 w-4 mr-2" /> View Report
              </Button>
              <Button variant="ghost" onClick={onBackToSetup}>
                New Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSetup}
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
              LEVEL_BADGE_STYLES[activeSession?.level ?? "mid"] ?? ""
            }`}
          >
            {levelMeta.icon} {levelMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {progress.answered}/{progress.total}
          </span>
          <div className="w-32 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={CheckCircle2}
          value={progress.answered}
          label="Answered"
        />
        <StatCard icon={BookOpen} value={progress.total} label="Total" />
        <StatCard
          icon={Target}
          value={progress.total - progress.answered}
          label="Remaining"
        />
        <StatCard icon={Trophy} value={`${progressPct}%`} label="Progress" />
      </div>

      {/* Progress bar */}
      {progress.answered > 0 && (
        <div className="mb-6">
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-primary-600"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {/* Feedback from last answer */}
          {lastFeedback && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ResultBanner
                isCorrect={lastFeedback.isCorrect}
                incorrectHint={`Correct: ${String.fromCharCode(
                  65 + lastFeedback.correctOptionIndex
                )}. ${lastFeedback.correctAnswer}`}
              />

              <FeedbackCard
                icon={<MessageSquare className="h-4 w-4 text-accent" />}
                iconBg="bg-accent-muted"
                label="Interviewer"
                text={lastFeedback.personaResponse}
              />

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Score Breakdown
                </p>
                {lastFeedback.criteriaScores.map((cs, i) => {
                  const pct =
                    cs.maxScore > 0 ? (cs.score / cs.maxScore) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {cs.name}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {cs.score}/{cs.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
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
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lastFeedback.pointsHit.length > 0 && (
                  <BulletList
                    icon={<CheckCircle2 className="h-3 w-3" />}
                    label="Covered"
                    items={lastFeedback.pointsHit}
                    color="emerald"
                  />
                )}
                {lastFeedback.pointsMissed.length > 0 && (
                  <BulletList
                    icon={<XCircle className="h-3 w-3" />}
                    label="Missed"
                    items={lastFeedback.pointsMissed}
                    color="amber"
                  />
                )}
              </div>

              {lastFeedback.redFlagsTriggered.length > 0 && (
                <BulletList
                  icon={<AlertTriangle className="h-3 w-3" />}
                  label="Red Flags"
                  items={lastFeedback.redFlagsTriggered}
                  color="red"
                />
              )}

              {lastFeedback.suggestions.length > 0 && (
                <BulletList
                  icon={<Lightbulb className="h-3 w-3" />}
                  label="Suggestions"
                  items={lastFeedback.suggestions}
                  color="blue"
                />
              )}

              <Button size="lg" onClick={onNextQuestion} className="w-full">
                {isCompleted ? (
                  <>
                    <Trophy className="h-4 w-4 mr-2" /> View Results
                  </>
                ) : (
                  <>
                    Next Question <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading */}
          {!lastFeedback && !sq && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted mb-4 animate-pulse">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Loading next question…
              </p>
            </div>
          )}

          {/* Current question */}
          {!lastFeedback && sq && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                <div className={`h-1 ${trackMeta.solid}`} />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      Q{progress.answered + 1}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {sq.question.type}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                      Difficulty {sq.question.difficulty}/5
                    </span>
                    {sq.isFollowUp && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <Zap className="h-3 w-3" /> Follow-up
                      </span>
                    )}
                    {sq.question.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                    {sq.question.prompt}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {((sq.question.options ?? []) as string[]).map(
                  (option, idx) => (
                    <AnswerOption
                      key={idx}
                      index={idx}
                      text={option}
                      selected={selectedOptionIndex === idx}
                      onSelect={() => onSelectOption(idx)}
                    />
                  )
                )}
              </div>

              <Button
                size="lg"
                onClick={onSubmitAnswer}
                loading={isSubmitting}
                disabled={selectedOptionIndex === null}
                className="w-full disabled:opacity-40"
              >
                <Send className="h-4 w-4 mr-2" /> Submit Answer
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Session Progress
              </p>
              <ProgressRing percentage={progressPct} />
              <div className="space-y-2.5">
                <SidebarStat
                  label="Answered"
                  value={progress.answered}
                  className="text-blue-600 dark:text-blue-400"
                />
                <SidebarStat
                  label="Remaining"
                  value={progress.total - progress.answered}
                  className="text-gray-500 dark:text-gray-400"
                />
                <SidebarStat
                  label="Total"
                  value={progress.total}
                  className="text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Configuration
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
                {activeSession?.persona && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>🎭</span>
                    <span className="capitalize">
                      {activeSession.persona} interviewer
                    </span>
                  </div>
                )}
                {activeSession?.interviewType && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>💻</span>
                    <span className="capitalize">
                      {activeSession.interviewType}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onBackToSetup}
                className="mt-3 w-full text-xs font-medium text-accent hover:underline flex items-center justify-center gap-1"
              >
                <Filter className="h-3 w-3" /> Back to Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Local helpers ── */

function FeedbackCard({
  icon,
  iconBg,
  label,
  text,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarStat({
  label,
  value,
  className,
  icon,
}: {
  label: string;
  value: number;
  className: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-bold ${className} flex items-center gap-1`}>
        {icon}
        {value}
      </span>
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
  red: {
    border: "border-red-200 dark:border-red-800/50",
    bg: "bg-red-50/50 dark:bg-red-900/10",
    label: "text-red-600",
    text: "text-red-600 dark:text-red-400",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-800/50",
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
    label: "text-blue-600",
    text: "text-blue-700 dark:text-blue-400",
  },
};

function BulletList({
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
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
      <p
        className={`text-[10px] font-semibold ${c.label} uppercase tracking-wider mb-2 flex items-center gap-1`}
      >
        {icon} {label}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={`text-xs ${c.text}`}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
