import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, ListChecks, PartyPopper, X } from "lucide-react";
import type { OnboardingStep } from "@careerportal/shared/types";
import { useDismissOnboarding } from "@careerportal/web/data-access";
import { Button, Card, IconButton } from "@careerportal/web/ui";
import { onboardingProgress } from "../lib/summary";

/** "Get set up" checklist; every step deep-links to where it gets done. */
export function OnboardingChecklist({ steps }: { steps: readonly OnboardingStep[] }) {
  const headingId = useId();
  const dismiss = useDismissOnboarding();
  const progress = onboardingProgress(steps);
  if (progress.total === 0) return null;

  const complete = progress.next === null;
  const percent = Math.round((progress.done / progress.total) * 100);

  return (
    <Card className="p-5">
      <section aria-labelledby={headingId}>
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          >
            {complete ? <PartyPopper className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="text-sm font-semibold text-text-primary">
              {complete ? "You're all set up" : "Get set up"}
            </h2>
            <p className="text-xs text-text-secondary">
              {complete
                ? "You've tried every part of your toolkit. Keep your tracker up to date and check back here each day."
                : `${progress.done} of ${progress.total} done — a few minutes each.`}
            </p>
          </div>
          <IconButton label="Hide checklist" size="sm" onClick={() => dismiss.mutate()} disabled={dismiss.isPending}>
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-valuetext={`${progress.done} of ${progress.total} steps done`}
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        >
          <div
            className="h-full rounded-full bg-primary-500 transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>

        {complete ? (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => dismiss.mutate()} loading={dismiss.isPending}>
            Hide checklist
          </Button>
        ) : (
          <ol className="mt-4 divide-y divide-border">
            {progress.steps.map((step) => {
              const isNext = step.key === progress.next;
              return (
                <li key={step.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        step.done ? "text-text-tertiary line-through decoration-text-tertiary/50" : "text-text-primary"
                      }`}
                    >
                      {step.title}
                      <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
                    </p>
                    {!step.done && <p className="text-xs text-text-secondary">{step.description}</p>}
                  </div>
                  {!step.done && (
                    <Link
                      to={step.href}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        isNext
                          ? "bg-primary-600 text-white hover:bg-primary-700"
                          : "text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30"
                      }`}
                    >
                      {step.cta}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </Card>
  );
}
