import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BarChart3, Flag, RotateCcw, Send, Sparkles, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import { getTechTagLabel, type InterviewSession as InterviewSessionData } from "@careerportal/shared/types";
import { Alert, Button, ErrorState, IconButton, Spinner } from "@careerportal/web/ui";
import { getErrorMessage, isApiError, useInterviewSession } from "@careerportal/web/data-access";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { getInterviewerById, hasPersona, type InterviewerConfig } from "../interviewer-configs";
import { useInterviewRun, type InterviewRunState } from "../hooks/useInterviewRun";
import type { QuestionShortfall } from "../hooks/useInterviewSetup";
import { getTrackMeta } from "../meta";
import { ActionError, LevelBadge, TrackBadge, requestQuotaUpgrade } from "./common";
import { AnswerChoices } from "./AnswerChoices";
import { AnswerFeedbackPanel } from "./AnswerFeedbackPanel";
import { InterviewerAvatar, type InterviewerAvatarHandle } from "./InterviewerAvatar";

interface InterviewSessionProps {
  sessionId: string;
  voiceMuted: boolean;
  onToggleVoiceMute: () => void;
  /** Free plan: this month's practice questions are used up. */
  questionsExhausted: boolean;
  /** This new session has fewer questions than the interviewer offers. */
  shortfall?: QuestionShortfall | null;
  onDismissShortfall?: () => void;
  onViewReport: () => void;
  onLeave: () => void;
}

export function InterviewSession({
  sessionId,
  voiceMuted,
  onToggleVoiceMute,
  questionsExhausted,
  shortfall = null,
  onDismissShortfall,
  onViewReport,
  onLeave,
}: InterviewSessionProps) {
  const sessionQuery = useInterviewSession(sessionId);
  const run = useInterviewRun(sessionId, onViewReport);
  const session = sessionQuery.data?.data;

  if (sessionQuery.isPending) return <Spinner label="Loading your interview" />;
  // Only a failed first load replaces the view; a failed background refetch keeps the interview on screen.
  if (!session) {
    const notFound = isApiError(sessionQuery.error) && sessionQuery.error.status === 404;
    return (
      <div className="space-y-4">
        <ErrorState
          message={notFound ? "We couldn't find that interview." : getErrorMessage(sessionQuery.error, "Couldn't load this interview.")}
          onRetry={notFound ? undefined : () => void sessionQuery.refetch()}
        />
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onLeave}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to practice
          </Button>
        </div>
      </div>
    );
  }

  if (session.status === "completed" && !run.answered) {
    return (
      <CompletedCard
        answered={run.progress?.answered ?? null}
        total={run.progress?.total ?? null}
        onViewReport={onViewReport}
        onLeave={onLeave}
      />
    );
  }

  return (
    <SessionRunner
      session={session}
      run={run}
      interviewer={getInterviewerById(session.interviewerId) ?? null}
      voiceMuted={voiceMuted}
      onToggleVoiceMute={onToggleVoiceMute}
      questionsExhausted={questionsExhausted}
      shortfall={shortfall}
      onDismissShortfall={onDismissShortfall}
      onViewReport={onViewReport}
      onLeave={onLeave}
    />
  );
}

function SessionRunner({
  session,
  run,
  interviewer,
  voiceMuted,
  onToggleVoiceMute,
  questionsExhausted,
  shortfall,
  onDismissShortfall,
  onViewReport,
  onLeave,
}: {
  session: InterviewSessionData;
  run: InterviewRunState;
  interviewer: InterviewerConfig | null;
  voiceMuted: boolean;
  onToggleVoiceMute: () => void;
  questionsExhausted: boolean;
  shortfall: QuestionShortfall | null;
  onDismissShortfall?: () => void;
  onViewReport: () => void;
  onLeave: () => void;
}) {
  const avatarRef = useRef<InterviewerAvatarHandle>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackHeadingRef = useRef<HTMLHeadingElement>(null);
  const spokenIdRef = useRef<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const { question, answered, progress } = run;
  const withPersona = hasPersona(interviewer);
  const answeredCount = progress?.answered ?? 0;
  const total = progress?.total ?? session.questionCount;
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const questionId = !answered ? question?.id ?? null : null;

  // Read each new question aloud once.
  useEffect(() => {
    if (!questionId || !question || voiceMuted || !withPersona) return;
    if (spokenIdRef.current === questionId) return;
    spokenIdRef.current = questionId;
    avatarRef.current?.speak(question.question.prompt);
  }, [questionId, question, voiceMuted, withPersona]);

  // Move focus to the new question / the feedback so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (questionId) questionHeadingRef.current?.focus();
  }, [questionId]);

  useEffect(() => {
    if (!answered) return;
    avatarRef.current?.stop();
    feedbackHeadingRef.current?.focus();
  }, [answered]);

  const replay = () => {
    if (question) avatarRef.current?.speak(question.question.prompt);
  };

  const canEndEarly = answeredCount > 0 && !run.isCompleted;
  const eliminated = question?.fiftyFiftyEliminated ?? [];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <IconButton label="Leave interview" onClick={() => setConfirmLeave(true)} className="border border-border bg-bg-elevated">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <TrackBadge track={session.track} />
          <LevelBadge level={session.level} />
          {interviewer && withPersona && (
            <span className="text-xs text-text-secondary">with {interviewer.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-text-secondary tabular-nums" id="session-progress-label">
            {answeredCount} of {total} answered
          </span>
          <div
            role="progressbar"
            aria-labelledby="session-progress-label"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answeredCount}
            className="w-24 sm:w-40 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden"
          >
            <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0 space-y-4">
          {shortfall && (
            <Alert
              variant="info"
              action={
                onDismissShortfall && (
                  <Button variant="ghost" size="sm" onClick={onDismissShortfall}>
                    Got it
                  </Button>
                )
              }
            >
              Only {shortfall.questionCount} questions are available for this track, level and tech stack so far, so
              this session has {shortfall.questionCount} instead of {shortfall.requested}. Choosing fewer technologies
              usually gives you more.
            </Alert>
          )}
          {run.skippedNotice && (
            <Alert variant="info">That question had already been answered, so here's the next one.</Alert>
          )}

          {answered ? (
            <AnswerFeedbackPanel
              ref={feedbackHeadingRef}
              answered={answered}
              isLoadingNext={run.isLoadingNext}
              nextError={run.nextError}
              onRetryNext={run.retryNext}
              isCompleted={run.isCompleted}
              onNext={run.goToNext}
              onViewReport={onViewReport}
            />
          ) : run.nextError && !question ? (
            <ErrorState message={getErrorMessage(run.nextError, "Couldn't load the next question.")} onRetry={run.retryNext} />
          ) : run.isCompleted ? (
            <CompletedCard answered={answeredCount} total={total} onViewReport={onViewReport} onLeave={onLeave} inline />
          ) : !question ? (
            <div className="rounded-2xl border border-border bg-bg-elevated p-16 text-center" role="status">
              <Sparkles className="mx-auto h-7 w-7 text-accent mb-3 motion-safe:animate-pulse" aria-hidden="true" />
              <p className="text-sm font-medium text-text-secondary">Loading the next question…</p>
              {!run.isLoadingNext && (
                <Button size="sm" variant="outline" className="mt-4" onClick={run.retryNext}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
                </Button>
              )}
            </div>
          ) : (
            <section aria-labelledby="question-heading" className="space-y-4">
              <div className="rounded-2xl border border-border bg-bg-elevated overflow-hidden shadow-sm">
                <div className={`h-1 ${getTrackMeta(session.track).accent}`} />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-text-secondary">
                      Question {answeredCount + 1} of {total}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-text-secondary capitalize">
                      {question.question.type.replace(/-/g, " ")}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-text-secondary">
                      Difficulty {question.question.difficulty}/5
                    </span>
                    {question.isFollowUp && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                        <Zap className="h-3 w-3" aria-hidden="true" /> Follow-up
                      </span>
                    )}
                    {eliminated.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                        <Zap className="h-3 w-3" aria-hidden="true" /> 50/50 hint
                      </span>
                    )}
                    {question.question.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[11px] font-medium text-text-tertiary bg-neutral-50 dark:bg-neutral-800/50 px-2 py-0.5 rounded-md">
                        {getTechTagLabel(tag)}
                      </span>
                    ))}
                  </div>
                  <h2
                    id="question-heading"
                    ref={questionHeadingRef}
                    tabIndex={-1}
                    className="text-lg font-semibold text-text-primary leading-relaxed focus:outline-none"
                  >
                    {question.question.prompt}
                  </h2>
                  {withPersona && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={onToggleVoiceMute} aria-pressed={voiceMuted}>
                        {voiceMuted ? <VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        {voiceMuted ? "Voice muted" : "Voice on"}
                      </Button>
                      {!voiceMuted && (
                        <Button size="sm" variant="ghost" onClick={replay}>
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Replay question
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <AnswerChoices
                options={question.question.options}
                multiSelect={run.multiSelect}
                selected={run.selected}
                onChoose={run.choose}
                eliminated={eliminated}
                disabled={run.isSubmitting}
              />

              <ActionError error={run.submitError} title="Couldn't submit your answer" />

              {questionsExhausted && (
                <Alert
                  variant="warning"
                  title="You've used this month's free practice questions"
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => requestQuotaUpgrade("questions")}>
                        See upgrade options
                      </Button>
                      {canEndEarly && (
                        <Button size="sm" variant="outline" onClick={() => setConfirmEnd(true)}>
                          See report for answered questions
                        </Button>
                      )}
                    </div>
                  }
                >
                  This session is saved — you can finish it when your allowance resets.
                </Alert>
              )}

              <Button
                size="lg"
                onClick={run.submitAnswer}
                loading={run.isSubmitting}
                disabled={run.selected.length === 0 || questionsExhausted}
                className="w-full"
              >
                <Send className="h-4 w-4" aria-hidden="true" /> Submit answer
              </Button>
            </section>
          )}
        </div>

        <aside className="space-y-4" aria-label="Interview details">
          {interviewer && withPersona && (
            <InterviewerAvatar ref={avatarRef} interviewer={interviewer} muted={voiceMuted} />
          )}

          <div className="rounded-2xl border border-border bg-bg-elevated p-4 space-y-3">
            <h2 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">This interview</h2>
            <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
              <dt className="text-text-tertiary">Answered</dt>
              <dd className="text-right font-semibold text-text-primary tabular-nums">{answeredCount}</dd>
              <dt className="text-text-tertiary">Remaining</dt>
              <dd className="text-right font-semibold text-text-primary tabular-nums">{Math.max(0, total - answeredCount)}</dd>
              {session.tags.length > 0 && (
                <>
                  <dt className="text-text-tertiary">Focus</dt>
                  <dd className="text-right text-text-secondary">{session.tags.slice(0, 4).map(getTechTagLabel).join(", ")}</dd>
                </>
              )}
            </dl>
            <p className="text-[11px] text-text-tertiary">Your answers are saved as you go — you can leave and resume later.</p>
            {canEndEarly && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setConfirmEnd(true)}>
                <Flag className="h-3.5 w-3.5" aria-hidden="true" /> End now and see report
              </Button>
            )}
            <ActionError error={run.completeError} title="Couldn't end the interview" />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Leave this interview?"
        description="Your answers so far are saved. You can resume from “Your sessions” on the practice page."
        confirmLabel="Leave"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmLeave(false);
          avatarRef.current?.stop();
          onLeave();
        }}
        onCancel={() => setConfirmLeave(false)}
      />

      <ConfirmDialog
        open={confirmEnd}
        title="End the interview now?"
        description={`Your report will cover the ${answeredCount} question${answeredCount === 1 ? "" : "s"} you've answered. You won't be able to answer the rest.`}
        confirmLabel="End and see report"
        cancelLabel="Keep going"
        loading={run.isEnding}
        onConfirm={() => {
          setConfirmEnd(false);
          avatarRef.current?.stop();
          run.endSession();
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  );
}

function CompletedCard({
  answered,
  total,
  onViewReport,
  onLeave,
  inline = false,
}: {
  answered: number | null;
  total: number | null;
  onViewReport: () => void;
  onLeave: () => void;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "" : "max-w-2xl mx-auto"}>
      <div className="rounded-2xl border-2 border-primary-500/30 bg-primary-500/5 p-8 text-center" role="status">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted mb-4" aria-hidden="true">
          <Trophy className="h-8 w-8 text-accent" />
        </span>
        <h2 className="text-xl font-bold text-text-primary mb-2">Interview complete</h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
          {answered !== null && total !== null
            ? `You answered ${answered} of ${total} questions. `
            : ""}
          Your report shows how you did and what to practise next.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onViewReport}>
            <BarChart3 className="h-4 w-4" aria-hidden="true" /> View report
          </Button>
          <Button variant="ghost" onClick={onLeave}>
            Back to practice
          </Button>
        </div>
      </div>
    </div>
  );
}
