import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flag,
  Play,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import type { InterviewReport as InterviewReportData, InterviewSession } from "@careerportal/shared/types";
import { Button, ErrorState, IconButton, Spinner } from "@careerportal/web/ui";
import {
  getErrorMessage,
  isApiError,
  useCompleteInterviewSession,
  useInterviewSession,
} from "@careerportal/web/data-access";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { ProgressRing, StatCard } from "../../shared";
import { getInterviewerById } from "../interviewer-configs";
import { SCORE_TONE_TEXT, clampPercent, formatShortDate, getTrackMeta, scoreTone } from "../meta";
import { ActionError, BulletList, LevelBadge, ScoreBar, TrackBadge } from "./common";
import { richTextSummary } from "../rich-text";
import { InlineRichText } from "./RichText";

interface InterviewReportViewProps {
  sessionId: string;
  onBack: () => void;
  onResume: () => void;
}

/** ?session=<id>&view=report — loads (and refreshes) the session, then shows its report. */
export function InterviewReportView({ sessionId, onBack, onResume }: InterviewReportViewProps) {
  const { data, isPending, isFetching, isError, error, refetch } = useInterviewSession(sessionId);
  const session = data?.data;

  if (isPending || (isFetching && !session?.report)) return <Spinner label="Loading your report" />;
  if (isError || !session) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <div className="space-y-4">
        <ErrorState
          message={notFound ? "We couldn't find that interview." : getErrorMessage(error, "Couldn't load this report.")}
          onRetry={notFound ? undefined : () => void refetch()}
        />
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to practice
          </Button>
        </div>
      </div>
    );
  }

  if (!session.report) return <UnfinishedSession session={session} onBack={onBack} onResume={onResume} />;
  return <InterviewReport session={session} report={session.report} onBack={onBack} />;
}

function UnfinishedSession({
  session,
  onBack,
  onResume,
}: {
  session: InterviewSession;
  onBack: () => void;
  onResume: () => void;
}) {
  const complete = useCompleteInterviewSession();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const answered = (session.questions ?? []).filter((q) => q.userAnswer !== null).length;

  return (
    <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted" aria-hidden="true">
        <BarChart3 className="h-7 w-7 text-accent" />
      </span>
      <h1 className="text-lg font-semibold text-text-primary">This interview isn't finished yet</h1>
      <p className="text-sm text-text-secondary">
        {answered > 0
          ? `You've answered ${answered} question${answered === 1 ? "" : "s"}. Resume to finish it, or end it now to get a report on what you've answered.`
          : "Resume it to answer the first question."}
      </p>
      <ActionError error={complete.error} title="Couldn't end the interview" className="text-left" />
      <div className="flex flex-wrap justify-center gap-3">
        {session.status !== "completed" && (
          <Button onClick={onResume}>
            <Play className="h-4 w-4" aria-hidden="true" /> Resume interview
          </Button>
        )}
        {answered > 0 && (
          <Button variant="outline" onClick={() => setConfirmEnd(true)} loading={complete.isPending}>
            <Flag className="h-4 w-4" aria-hidden="true" /> End and see report
          </Button>
        )}
        <Button variant="ghost" onClick={onBack}>
          Back to practice
        </Button>
      </div>
      <ConfirmDialog
        open={confirmEnd}
        title="End the interview now?"
        description={`Your report will cover the ${answered} question${answered === 1 ? "" : "s"} you've answered.`}
        confirmLabel="End and see report"
        onConfirm={() => {
          setConfirmEnd(false);
          complete.mutate(session.id);
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  );
}

function InterviewReport({
  session,
  report,
  onBack,
}: {
  session: InterviewSession;
  report: InterviewReportData;
  onBack: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pct = clampPercent(report.percentage);
  const tone = scoreTone(pct);
  const interviewer = getInterviewerById(session.interviewerId);
  const breakdown = report.questionBreakdown ?? [];
  const questionCount = breakdown.length;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <IconButton label="Back to practice" onClick={onBack} className="border border-border bg-bg-elevated">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-text-primary focus:outline-none">
            Interview report
          </h1>
          <TrackBadge track={session.track} />
          <LevelBadge level={session.level} />
          <span className="text-xs text-text-tertiary">
            {formatShortDate(session.createdAt)}
            {interviewer && interviewer.id !== "none" ? ` · with ${interviewer.name}` : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <StatCard icon={Trophy} value={report.grade} label="Grade" />
        <StatCard icon={Star} value={`${report.overallScore}/${report.maxPossibleScore}`} label="Points" />
        <StatCard icon={Target} value={`${pct}%`} label="Score" />
        <StatCard icon={CheckCircle2} value={questionCount} label="Questions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4 min-w-0">
          <section className="rounded-2xl border border-border bg-bg-elevated overflow-hidden shadow-sm" aria-labelledby="summary-heading">
            <div className={`h-1 ${getTrackMeta(session.track).accent}`} />
            <div className="p-6">
              <h2 id="summary-heading" className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                Summary
              </h2>
              <p className="text-sm text-text-primary leading-relaxed">{report.trackSummary}</p>
            </div>
          </section>

          <div className="grid sm:grid-cols-2 gap-3">
            <BulletList icon={CheckCircle2} title="Strengths" items={report.strengths} tone="emerald" />
            <BulletList icon={AlertTriangle} title="Weaknesses" items={report.weaknesses} tone="amber" />
          </div>
          <BulletList icon={BookOpen} title="Suggested study areas" items={report.suggestedStudyAreas} tone="blue" />

          {questionCount > 0 && (
            <section className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-4" aria-labelledby="breakdown-heading">
              <h2 id="breakdown-heading" className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Question by question
              </h2>
              <ol className="space-y-4">
                {breakdown.map((q, i) => (
                  <li key={`${q.questionId}-${i}`}>
                    <ScoreBar
                      label={
                        <>
                          <span className="font-semibold text-text-primary">Q{i + 1}.</span>{" "}
                          <InlineRichText text={richTextSummary(q.prompt)} />
                        </>
                      }
                      percentage={q.maxScore > 0 ? (q.score / q.maxScore) * 100 : 0}
                      valueText={`${q.score}/${q.maxScore}`}
                    />
                  </li>
                ))}
              </ol>
            </section>
          )}

          <Button size="lg" onClick={onBack} className="w-full">
            <Play className="h-4 w-4" aria-hidden="true" /> Start another interview
          </Button>
        </div>

        <aside className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-4 h-fit lg:sticky lg:top-6" aria-label="Score overview">
          <ProgressRing percentage={pct} size={96} strokeWidth={7} label={report.grade} />
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-text-tertiary">Score</dt>
            <dd className="text-right font-bold text-text-primary tabular-nums">
              {report.overallScore}/{report.maxPossibleScore}
            </dd>
            <dt className="text-text-tertiary">Percentage</dt>
            <dd className={`text-right font-bold tabular-nums ${SCORE_TONE_TEXT[tone]}`}>{pct}%</dd>
            <dt className="text-text-tertiary">Questions</dt>
            <dd className="text-right font-bold text-text-primary tabular-nums">{questionCount}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
