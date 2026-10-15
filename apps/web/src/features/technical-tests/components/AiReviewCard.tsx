import { Bot, CheckCircle2, Crown, Lightbulb, Lock } from "lucide-react";
import type { TechnicalTest, TechTestAiReview } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { requestUpgrade, requestUpgradeForError, useAiReviewTechTest } from "@careerportal/web/data-access";
import { ActionError, BulletList, ScoreBar, SectionTitle } from "../../interview-prep/components/common";
import { formatShortDate } from "../../interview-prep/meta";

interface AiReviewCardProps {
  test: TechnicalTest;
  /** Premium (or trial): AI review is available. */
  canUseAiReview: boolean;
}

/** Premium AI code review of a submitted test (one per test, 1 AI action). */
export function AiReviewCard({ test, canUseAiReview }: AiReviewCardProps) {
  const review = test.evaluation?.aiReview ?? null;
  const mutation = useAiReviewTechTest();

  if (review) return <AiReview review={review} />;

  if (!canUseAiReview) {
    return (
      <section className="rounded-2xl border border-border bg-bg-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4" aria-labelledby="ai-review-heading">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400 text-white" aria-hidden="true">
          <Lock className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 id="ai-review-heading" className="text-sm font-semibold text-text-primary">
            AI review of your solution
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Get specific feedback on each rubric criterion, with strengths and concrete improvements.
          </p>
        </div>
        <Button onClick={() => requestUpgrade({ reason: "premium_required", feature: "aiTechReview" })}>
          <Crown className="h-4 w-4" aria-hidden="true" /> Unlock with Premium
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-3" aria-labelledby="ai-review-heading">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white" aria-hidden="true">
          <Bot className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 id="ai-review-heading" className="text-sm font-semibold text-text-primary">
            Get an AI review
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {mutation.isPending
              ? "Reviewing your submission — this can take up to a minute…"
              : "Feedback on each rubric criterion with strengths and improvements. Uses 1 AI action; one review per test."}
          </p>
        </div>
        <Button
          onClick={() => mutation.mutate(test.id, { onError: (err) => requestUpgradeForError(err) })}
          loading={mutation.isPending}
        >
          Get AI review
        </Button>
      </div>
      <ActionError error={mutation.error} title="Couldn't get the AI review" />
    </section>
  );
}

function AiReview({ review }: { review: TechTestAiReview }) {
  return (
    <section className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-4" aria-labelledby="ai-review-heading">
      <div>
        <SectionTitle icon={Bot}>
          <span id="ai-review-heading">AI review</span>
        </SectionTitle>
        <p className="text-sm text-text-primary leading-relaxed">{review.summary}</p>
        <p className="text-[11px] text-text-tertiary mt-1">
          Reviewed {formatShortDate(review.reviewedAt)} · AI feedback can be wrong — use your judgement.
        </p>
      </div>

      {review.criteria.length > 0 && (
        <ul className="space-y-3">
          {review.criteria.map((c, i) => (
            <li key={`${c.criterion}-${i}`} className="space-y-1">
              <ScoreBar label={c.criterion} percentage={(c.score / 3) * 100} valueText={`${c.score}/3`} />
              {c.comment && <p className="text-xs text-text-secondary leading-relaxed">{c.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BulletList icon={CheckCircle2} title="Strengths" items={review.strengths} tone="emerald" />
        <BulletList icon={Lightbulb} title="Improvements" items={review.improvements} tone="amber" />
      </div>
    </section>
  );
}
