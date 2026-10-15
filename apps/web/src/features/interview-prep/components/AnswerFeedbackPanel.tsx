import { forwardRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  MessageSquare,
  Trophy,
  XCircle,
} from "lucide-react";
import { Alert, Button } from "@careerportal/web/ui";
import { getErrorMessage } from "@careerportal/web/data-access";
import { correctIndicesOf, formatOptionLetters, selectedIndicesOf } from "../answer";
import type { AnsweredQuestion } from "../hooks/useInterviewRun";
import { ReviewedChoices } from "./AnswerChoices";
import { BulletList, ScoreBar } from "./common";
import { RichText } from "./RichText";

interface AnswerFeedbackPanelProps {
  answered: AnsweredQuestion;
  isLoadingNext: boolean;
  nextError: unknown;
  onRetryNext: () => void;
  isCompleted: boolean;
  onNext: () => void;
  onViewReport: () => void;
}

/** Feedback for the answer just submitted; the heading receives focus so it is announced. */
export const AnswerFeedbackPanel = forwardRef<HTMLHeadingElement, AnswerFeedbackPanelProps>(
  function AnswerFeedbackPanel(
    { answered, isLoadingNext, nextError, onRetryNext, isCompleted, onNext, onViewReport },
    headingRef,
  ) {
    const { feedback } = answered;
    const correct = correctIndicesOf(feedback);
    const selected = selectedIndicesOf(feedback);

    return (
      <section className="space-y-4" aria-labelledby="feedback-heading">
        <div
          className={`rounded-2xl border-2 p-5 flex items-center gap-4 ${
            feedback.isCorrect
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
          }`}
        >
          {feedback.isCorrect ? (
            <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <XCircle className="h-8 w-8 shrink-0 text-red-500 dark:text-red-400" aria-hidden="true" />
          )}
          <div>
            <h2
              id="feedback-heading"
              ref={headingRef}
              tabIndex={-1}
              className={`text-lg font-bold focus:outline-none ${
                feedback.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              {feedback.isCorrect ? "Correct!" : "Not quite"}
            </h2>
            {!feedback.isCorrect && correct.length > 0 && (
              <p className="text-sm text-red-700/80 dark:text-red-300/80">
                {answered.multiSelect ? "Correct answers" : "Correct answer"}: {formatOptionLetters(correct)}
                {!answered.multiSelect && feedback.correctAnswer ? `. ${feedback.correctAnswer}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-3">
          <RichText text={answered.prompt} className="text-sm font-medium text-text-primary leading-relaxed" />
          <ReviewedChoices options={answered.options} correct={correct} selected={selected} />
        </div>

        {feedback.personaResponse && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-5 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-muted" aria-hidden="true">
              <MessageSquare className="h-4 w-4 text-accent" />
            </span>
            <div>
              <h3 className="text-xs font-semibold text-text-tertiary mb-1 uppercase tracking-wider">Interviewer</h3>
              <p className="text-sm text-text-primary leading-relaxed">{feedback.personaResponse}</p>
            </div>
          </div>
        )}

        {feedback.criteriaScores.length > 0 && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-3">
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Score breakdown</h3>
            {feedback.criteriaScores.map((cs, i) => (
              <ScoreBar
                key={`${cs.name}-${i}`}
                label={cs.name}
                percentage={cs.maxScore > 0 ? (cs.score / cs.maxScore) * 100 : 0}
                valueText={`${cs.score}/${cs.maxScore}`}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BulletList icon={CheckCircle2} title="Covered" items={feedback.pointsHit} tone="emerald" />
          <BulletList icon={XCircle} title="Missed" items={feedback.pointsMissed} tone="amber" />
        </div>
        <BulletList icon={AlertTriangle} title="Red flags" items={feedback.redFlagsTriggered} tone="red" />
        <BulletList icon={Lightbulb} title="Suggestions" items={feedback.suggestions} tone="blue" />

        {nextError ? (
          <Alert
            variant="error"
            title="Couldn't load the next question"
            action={
              <Button size="sm" variant="outline" onClick={onRetryNext}>
                Try again
              </Button>
            }
          >
            {getErrorMessage(nextError)}
          </Alert>
        ) : isCompleted ? (
          <Button size="lg" onClick={onViewReport} className="w-full">
            <Trophy className="h-4 w-4" aria-hidden="true" /> View results
          </Button>
        ) : (
          <Button size="lg" onClick={onNext} loading={isLoadingNext} className="w-full">
            {isLoadingNext ? "Loading next question…" : "Next question"}
            {!isLoadingNext && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        )}
      </section>
    );
  },
);
