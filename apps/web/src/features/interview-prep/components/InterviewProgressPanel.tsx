import { useId } from "react";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Lock,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { getTechTagLabel, isKnownTag, type InterviewProgress } from "@careerportal/shared/types";
import { Button, ErrorState, Spinner } from "@careerportal/web/ui";
import { getErrorMessage, requestUpgrade, useInterviewProgress } from "@careerportal/web/data-access";
import { StatCard } from "../../shared";
import { buildSparkline } from "../sparkline";
import { clampPercent, formatShortDate } from "../meta";
import { ScoreBar, SectionTitle } from "./common";

interface InterviewProgressPanelProps {
  /** "Practise this": pre-fill the setup with one topic. */
  onPracticeTopic: (tag: string) => void;
}

/**
 * Progress tab. Every plan gets totals and the top-3 weak topics; Premium
 * gets the per-topic/per-type breakdown and the weekly trend.
 */
export function InterviewProgressPanel({ onPracticeTopic }: InterviewProgressPanelProps) {
  const { data, isPending, isError, error, refetch } = useInterviewProgress();

  if (isPending) return <Spinner label="Loading your progress" />;
  if (isError) {
    return <ErrorState message={getErrorMessage(error, "Couldn't load your progress.")} onRetry={() => void refetch()} />;
  }

  const progress = data.data;
  const { totals } = progress;

  if (totals.answered === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Target className="mx-auto h-8 w-8 text-text-tertiary mb-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-text-primary">No answers yet</p>
        <p className="text-xs text-text-secondary mt-1">
          Finish a few questions and your accuracy by topic shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon={BarChart3} value={totals.sessions} label="Sessions" />
        <StatCard icon={Trophy} value={totals.completedSessions} label="Completed" />
        <StatCard icon={CheckCircle2} value={totals.answered} label="Answered" />
        <StatCard
          icon={Target}
          value={totals.accuracy === null ? "—" : `${clampPercent(totals.accuracy)}%`}
          label="Accuracy"
        />
      </div>

      <WeakTopics progress={progress} onPracticeTopic={onPracticeTopic} />

      {progress.locked ? <LockedBreakdown /> : <Breakdown progress={progress} onPracticeTopic={onPracticeTopic} />}

      <p className="text-[11px] text-text-tertiary">Based on your answers from the last 12 months.</p>
    </div>
  );
}

function WeakTopics({
  progress,
  onPracticeTopic,
}: {
  progress: InterviewProgress;
  onPracticeTopic: (tag: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-elevated p-5" aria-labelledby="weak-topics-heading">
      <SectionTitle icon={Zap}>
        <span id="weak-topics-heading">Topics to work on</span>
      </SectionTitle>
      {progress.weakTopics.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Answer at least 3 questions on a topic to see where you're weakest.
        </p>
      ) : (
        <ul className="space-y-3">
          {progress.weakTopics.map((topic) => {
            const label = getTechTagLabel(topic.tag);
            return (
              <li key={topic.tag} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <ScoreBar
                    label={`${label} · ${topic.answered} answered`}
                    percentage={topic.accuracy}
                  />
                </div>
                {isKnownTag(topic.tag) && (
                  <Button size="sm" variant="secondary" onClick={() => onPracticeTopic(topic.tag)} aria-label={`Practise ${label}`}>
                    Practise
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Free plan: a blurred sample of the Premium breakdown with an upgrade prompt. */
function LockedBreakdown() {
  return (
    <section className="relative min-h-[240px] overflow-hidden rounded-2xl border border-border bg-bg-elevated p-5" aria-labelledby="breakdown-locked-heading">
      <div className="pointer-events-none select-none blur-sm opacity-60 space-y-3" aria-hidden="true">
        {[72, 55, 38, 81].map((pct, i) => (
          <div key={i}>
            <div className="h-2 w-24 rounded bg-neutral-200 dark:bg-neutral-700 mb-1.5" />
            <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-primary-400" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-elevated/70 p-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400 text-white" aria-hidden="true">
          <Lock className="h-5 w-5" />
        </span>
        <h3 id="breakdown-locked-heading" className="text-sm font-semibold text-text-primary">
          Full breakdown and weekly trend
        </h3>
        <p className="text-xs text-text-secondary max-w-xs">
          See your accuracy for every topic and question type, and how it changes week by week.
        </p>
        <Button size="sm" onClick={() => requestUpgrade({ reason: "premium_required", feature: "progressBreakdown" })}>
          <Crown className="h-3.5 w-3.5" aria-hidden="true" /> Unlock with Premium
        </Button>
      </div>
    </section>
  );
}

function Breakdown({
  progress,
  onPracticeTopic,
}: {
  progress: InterviewProgress;
  onPracticeTopic: (tag: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {progress.weeklyTrend && progress.weeklyTrend.length > 0 && (
        <section className="rounded-2xl border border-border bg-bg-elevated p-5 lg:col-span-2" aria-labelledby="trend-heading">
          <SectionTitle icon={TrendingUp}>
            <span id="trend-heading">Weekly accuracy</span>
          </SectionTitle>
          <WeeklyTrend points={progress.weeklyTrend} />
        </section>
      )}

      {progress.byTag && progress.byTag.length > 0 && (
        <section className="rounded-2xl border border-border bg-bg-elevated p-5" aria-labelledby="by-topic-heading">
          <SectionTitle icon={Target}>
            <span id="by-topic-heading">By topic</span>
          </SectionTitle>
          <ul className="space-y-3">
            {progress.byTag.map((row) => {
              const bar = (
                <ScoreBar label={`${getTechTagLabel(row.tag)} · ${row.correct}/${row.answered}`} percentage={row.accuracy} />
              );
              return (
                <li key={row.tag}>
                  {isKnownTag(row.tag) ? (
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(row.tag)}
                      className="w-full text-left rounded-lg p-1 -m-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                      aria-label={`${getTechTagLabel(row.tag)}: ${clampPercent(row.accuracy)}% from ${row.answered} answers. Practise this topic`}
                    >
                      {bar}
                    </button>
                  ) : (
                    bar
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {progress.byType && progress.byType.length > 0 && (
        <section className="rounded-2xl border border-border bg-bg-elevated p-5" aria-labelledby="by-type-heading">
          <SectionTitle icon={BarChart3}>
            <span id="by-type-heading">By question type</span>
          </SectionTitle>
          <ul className="space-y-3">
            {progress.byType.map((row) => (
              <li key={row.type}>
                <ScoreBar label={`${capitalize(row.type)} · ${row.correct}/${row.answered}`} percentage={row.accuracy} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const TREND_WIDTH = 600;
const TREND_HEIGHT = 120;

function WeeklyTrend({ points }: { points: NonNullable<InterviewProgress["weeklyTrend"]> }) {
  const titleId = useId();
  const { path, points: dots } = buildSparkline(
    points.map((p) => p.accuracy),
    TREND_WIDTH,
    TREND_HEIGHT,
    100,
    6,
  );
  const latest = [...points].reverse().find((p) => p.accuracy !== null);
  const summary = latest
    ? `Latest week (from ${formatShortDate(latest.weekStart)}): ${clampPercent(latest.accuracy ?? 0)}% accuracy from ${latest.answered} answers.`
    : "No answers in the last weeks.";

  return (
    <figure>
      <svg
        viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
        className="w-full h-28 text-primary-500"
        role="img"
        aria-labelledby={titleId}
        preserveAspectRatio="none"
      >
        <title id={titleId}>{summary}</title>
        <line x1="0" x2={TREND_WIDTH} y1={TREND_HEIGHT / 2} y2={TREND_HEIGHT / 2} className="stroke-neutral-200 dark:stroke-neutral-800" strokeDasharray="4 4" />
        {path && <path d={path} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
        {dots.map((d) => (
          <circle key={d.index} cx={d.x} cy={d.y} r={3.5} className="fill-current" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between text-[11px] text-text-tertiary">
        <span>{points[0] ? formatShortDate(points[0].weekStart) : ""}</span>
        <span>{summary}</span>
      </figcaption>
    </figure>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/-/g, " ");
}
