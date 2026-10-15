import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { TechnicalTest, TechTestRating } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { useSelfReviewTechTest } from "@careerportal/web/data-access";
import { ActionError, SectionTitle } from "../../interview-prep/components/common";
import { formatShortDate } from "../../interview-prep/meta";

const RATINGS: { value: TechTestRating; label: string }[] = [
  { value: 0, label: "Not addressed" },
  { value: 1, label: "Partly" },
  { value: 2, label: "Mostly" },
  { value: 3, label: "Fully" },
];

const MAX_NOTES = 5000;

/** Free self-review: rate the submission 0-3 against each of the scenario's criteria. */
export function SelfReviewForm({ test }: { test: TechnicalTest }) {
  const criteria = test.scenario?.evaluationCriteria ?? [];
  const saved = test.evaluation?.selfReview ?? null;
  const mutation = useSelfReviewTechTest();

  const [ratings, setRatings] = useState<Partial<Record<number, TechTestRating>>>(() =>
    Object.fromEntries((saved?.ratings ?? []).map((r) => [r.criterionIndex, r.score])),
  );
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [justSaved, setJustSaved] = useState(false);

  if (criteria.length === 0) return null;

  const rated = criteria.filter((_, i) => ratings[i] !== undefined).length;
  const complete = rated === criteria.length;
  const total = criteria.reduce((sum, _, i) => sum + (ratings[i] ?? 0), 0);

  const save = () => {
    if (!complete || mutation.isPending) return;
    setJustSaved(false);
    mutation.mutate(
      {
        testId: test.id,
        ratings: criteria.map((_, i) => ({ criterionIndex: i, score: ratings[i] ?? 0 })),
        notes: notes.trim() ? notes.trim() : undefined,
      },
      { onSuccess: () => setJustSaved(true) },
    );
  };

  return (
    <section className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-4" aria-labelledby="self-review-heading">
      <div>
        <SectionTitle icon={ClipboardCheck}>
          <span id="self-review-heading">Rate yourself against the rubric</span>
        </SectionTitle>
        <p className="text-xs text-text-secondary -mt-1">
          Be honest — it's the fastest way to see what to practise. Your ratings are only visible to you.
        </p>
      </div>

      <div className="space-y-4">
        {criteria.map((criterion, index) => (
          <fieldset key={`${criterion.name}-${index}`} className="rounded-xl border border-border p-3">
            <legend className="px-1 text-sm font-semibold text-text-primary">{criterion.name}</legend>
            {criterion.description && <p className="text-xs text-text-secondary mb-2">{criterion.description}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RATINGS.map((option) => {
                const checked = ratings[index] === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 ${
                      checked
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300"
                        : "border-border text-text-secondary hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`self-review-${test.id}-${index}`}
                      value={option.value}
                      checked={checked}
                      onChange={() => {
                        setJustSaved(false);
                        setRatings((prev) => ({ ...prev, [index]: option.value }));
                      }}
                      className="sr-only"
                    />
                    <span aria-hidden="true">{option.value}</span> {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div>
        <label htmlFor={`self-review-notes-${test.id}`} className="block text-xs font-semibold text-text-secondary mb-1">
          Notes for next time (optional)
        </label>
        <textarea
          id={`self-review-notes-${test.id}`}
          value={notes}
          onChange={(e) => {
            setJustSaved(false);
            setNotes(e.target.value);
          }}
          maxLength={MAX_NOTES}
          rows={3}
          className="w-full rounded-xl border border-border bg-bg-primary p-3 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          placeholder="What would you do differently?"
        />
      </div>

      <ActionError error={mutation.error} title="Couldn't save your self-review" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-secondary" role="status">
          {justSaved
            ? "Self-review saved."
            : saved && rated === criteria.length
              ? `Saved ${formatShortDate(saved.reviewedAt)} · ${total}/${criteria.length * 3}`
              : `${rated} of ${criteria.length} rated${complete ? ` · ${total}/${criteria.length * 3}` : ""}`}
        </p>
        <Button onClick={save} loading={mutation.isPending} disabled={!complete}>
          {saved ? "Update self-review" : "Save self-review"}
        </Button>
      </div>
    </section>
  );
}
