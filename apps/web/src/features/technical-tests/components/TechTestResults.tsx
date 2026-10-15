import { useEffect } from "react";
import { CheckCircle2, ClipboardList, FileText, History, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import type { TechnicalTest, TechTestEvaluation } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { BulletList, ScoreBar, SectionTitle } from "../../interview-prep/components/common";
import { clampPercent } from "../../interview-prep/meta";
import { removeStorage } from "../../../lib/storage";
import { draftStorageKey } from "../hooks/useSubmissionDraft";
import { countWords } from "../timer";
import { AiReviewCard } from "./AiReviewCard";
import { SelfReviewForm } from "./SelfReviewForm";
import { TestHeader } from "./TestHeader";

interface TechTestResultsProps {
  test: TechnicalTest;
  canUseAiReview: boolean;
  onBack: () => void;
  onShowHistory: () => void;
}

/** A submitted test: automated checklist, self-review rubric and (Premium) AI review. */
export function TechTestResults({ test, canUseAiReview, onBack, onShowHistory }: TechTestResultsProps) {
  const evaluation = test.evaluation;

  // A submitted test no longer needs its local draft (also when submitted from another tab).
  useEffect(() => removeStorage(draftStorageKey(test.id)), [test.id]);

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <TestHeader test={test} onBack={onBack} />

      {evaluation ? (
        <Checklist evaluation={evaluation} />
      ) : (
        <p className="rounded-2xl border border-border bg-bg-elevated p-5 text-sm text-text-secondary">
          This test was submitted before automated checklists were available.
        </p>
      )}

      <SelfReviewForm test={test} />
      <AiReviewCard test={test} canUseAiReview={canUseAiReview} />

      {test.submission && (
        <details className="rounded-2xl border border-border bg-bg-elevated">
          <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-text-primary flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            Your submission ({countWords(test.submission)} words)
          </summary>
          <pre className="border-t border-border px-5 py-4 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-text-primary">
            {test.submission}
          </pre>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onBack}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> New test
        </Button>
        <Button variant="secondary" onClick={onShowHistory}>
          <History className="h-4 w-4" aria-hidden="true" /> All tests
        </Button>
      </div>
    </div>
  );
}

/** The heuristic self-check computed on submit — presented as coverage, not a grade. */
function Checklist({ evaluation }: { evaluation: TechTestEvaluation }) {
  const coverage = clampPercent(evaluation.percentage);
  return (
    <section className="rounded-2xl border border-border bg-bg-elevated p-5 space-y-4" aria-labelledby="checklist-heading">
      <div>
        <SectionTitle icon={ClipboardList}>
          <span id="checklist-heading">Automated checklist</span>
        </SectionTitle>
        <p className="text-xs text-text-secondary -mt-1">
          Counts which requirements and rubric topics your write-up mentions. It's keyword-based — a prompt for your
          self-review, not a grade.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Figure label="Checklist coverage" value={`${coverage}%`} />
        <Figure label="Requirements mentioned" value={`${evaluation.requirementsCovered}/${evaluation.requirementsTotal}`} />
        <Figure label="Words" value={evaluation.wordCount.toLocaleString()} />
      </div>

      {(evaluation.criteriaScores ?? []).length > 0 && (
        <div className="space-y-3">
          {evaluation.criteriaScores.map((cs, i) => (
            <ScoreBar
              key={`${cs.name}-${i}`}
              label={cs.name}
              percentage={cs.maxScore > 0 ? (cs.score / cs.maxScore) * 100 : 0}
            />
          ))}
        </div>
      )}

      <BulletList icon={XCircle} title="Requirements not mentioned" items={evaluation.requirementsMissed} tone="red" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BulletList icon={CheckCircle2} title="Covered well" items={evaluation.strengths} tone="emerald" />
        <BulletList icon={Lightbulb} title="Worth adding" items={evaluation.improvements} tone="amber" />
      </div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-lg font-bold text-text-primary tabular-nums">{value}</p>
      <p className="text-[11px] text-text-tertiary uppercase tracking-wider">{label}</p>
    </div>
  );
}
