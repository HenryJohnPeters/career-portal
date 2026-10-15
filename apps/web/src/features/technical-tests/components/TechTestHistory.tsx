import { useState } from "react";
import { ArrowLeft, Bot, ClipboardCheck, Clock, Eye, Plus, Trash2 } from "lucide-react";
import { getTechTagLabel, type TechnicalTestSummary } from "@careerportal/shared/types";
import { Button, ErrorState, IconButton, Spinner } from "@careerportal/web/ui";
import { getErrorMessage, useDeleteTechnicalTest, useTechnicalTests } from "@careerportal/web/data-access";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { MetaChip } from "../../interview-prep/components/common";
import {
  SCORE_TONE_TEXT,
  clampPercent,
  formatShortDate,
  getDifficultyMeta,
  getLevelMeta,
  getRoleFocusMeta,
  scoreTone,
} from "../../interview-prep/meta";

const STATUS_META: Record<string, { label: string; className: string }> = {
  not_started: {
    label: "Not started",
    className: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  in_progress: {
    label: "In progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  submitted: {
    label: "Submitted",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  evaluated: {
    label: "Submitted",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

interface TechTestHistoryProps {
  isPremium: boolean;
  onOpen: (testId: string) => void;
  onBack: () => void;
}

export function TechTestHistory({ isPremium, onOpen, onBack }: TechTestHistoryProps) {
  const { data, isPending, isError, error, refetch } = useTechnicalTests();
  const deleteTest = useDeleteTechnicalTest();
  const [pendingDelete, setPendingDelete] = useState<TechnicalTestSummary | null>(null);
  const tests = data?.data ?? [];

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteTest.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <IconButton label="Back to technical tests" onClick={onBack} className="border border-border bg-bg-elevated">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary">Past technical tests</h1>
          {!isPending && !isError && (
            <p className="text-xs text-text-secondary mt-0.5">
              {tests.length} test{tests.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Button onClick={onBack}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New test
        </Button>
      </div>

      {isPending ? (
        <Spinner label="Loading your tests" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error, "Couldn't load your tests.")} onRetry={() => void refetch()} />
      ) : tests.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-text-tertiary mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-text-primary">No tests yet</p>
          <p className="text-xs text-text-secondary mt-1 mb-5">Generate your first scenario to get started</p>
          <Button onClick={onBack}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create a test
          </Button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} onOpen={() => onOpen(test.id)} onDelete={() => setPendingDelete(test)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        destructive
        title="Delete this test?"
        description={
          isPremium
            ? `“${pendingDelete?.title ?? ""}” and your submission will be removed.`
            : `“${pendingDelete?.title ?? ""}” and your submission will be removed. Deleting doesn't give back a test from this month's free allowance.`
        }
        confirmLabel="Delete test"
        loading={deleteTest.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function TestCard({
  test,
  onOpen,
  onDelete,
}: {
  test: TechnicalTestSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const role = getRoleFocusMeta(test.roleFocus);
  const level = getLevelMeta(test.level);
  const difficulty = getDifficultyMeta(test.difficulty);
  const status = STATUS_META[test.status] ?? STATUS_META.not_started;
  const score = typeof test.score === "number" ? clampPercent(test.score) : null;

  return (
    <li className="rounded-2xl border border-border bg-bg-elevated p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800" aria-hidden="true">
          <ClipboardCheck className="h-5 w-5 text-text-tertiary" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate">{test.title}</h2>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${status.className}`}>{status.label}</span>
            <MetaChip icon={role.icon}>{role.label}</MetaChip>
            <MetaChip icon={level.icon}>{level.label}</MetaChip>
            <MetaChip icon={difficulty.icon}>{difficulty.label}</MetaChip>
            {test.hasAiReview && <MetaChip icon={Bot}>AI reviewed</MetaChip>}
          </div>
          <p className="flex items-center gap-1.5 mt-1.5 text-[11px] text-text-tertiary flex-wrap">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatShortDate(test.createdAt)}
            {test.tags.length > 0 && (
              <span>
                · {test.tags.slice(0, 3).map(getTechTagLabel).join(", ")}
                {test.tags.length > 3 ? ` +${test.tags.length - 3}` : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        {score !== null && (
          <span className={`text-xs font-semibold tabular-nums ${SCORE_TONE_TEXT[scoreTone(score)]}`} title="Automated checklist coverage">
            {score}% coverage
          </span>
        )}
        <Button variant="secondary" size="sm" onClick={onOpen} aria-label={`Open ${test.title}`}>
          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Open
        </Button>
        <IconButton label={`Delete ${test.title}`} size="sm" onClick={onDelete} className="hover:!text-red-600">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </li>
  );
}
