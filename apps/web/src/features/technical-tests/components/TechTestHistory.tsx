import { Button } from "@careerportal/web/ui";
import {
  ArrowLeft,
  ClipboardCheck,
  Trash2,
  Eye,
  Clock,
  Plus,
  BarChart3,
} from "lucide-react";
import { LEVEL_META } from "../../shared";
import {
  ROLE_FOCUS_ITEMS,
  DIFFICULTY_ITEMS,
} from "../../interview-prep/constants";
import type {
  TechnicalTest,
  TechTestEvaluation,
} from "@careerportal/shared/types";
import type { useTechTestState } from "../hooks/useTechTestState";

interface TechTestHistoryProps {
  state: ReturnType<typeof useTechTestState>;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  submitted: {
    label: "Submitted",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  evaluated: {
    label: "Evaluated",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
};

export function TechTestHistory({ state }: TechTestHistoryProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={state.handleBackToSetup}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Past Technical Tests
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {state.tests.length} test{state.tests.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={state.handleBackToSetup}>
          <Plus className="h-4 w-4 mr-1.5" /> New Test
        </Button>
      </div>

      {/* List */}
      {state.isLoadingTests ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-600">
          Loading…
        </div>
      ) : state.tests.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-20 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
            <ClipboardCheck className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            No tests yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-5">
            Generate your first scenario to get started
          </p>
          <Button onClick={state.handleBackToSetup}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Test
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {state.tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onView={() => state.handleViewTest(test)}
              onDelete={() => state.handleDelete(test.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({
  test,
  onView,
  onDelete,
}: {
  test: TechnicalTest;
  onView: () => void;
  onDelete: () => void;
}) {
  const levelMeta = LEVEL_META[test.level] ?? LEVEL_META.mid;
  const roleMeta = ROLE_FOCUS_ITEMS.find((r) => r.key === test.roleFocus);
  const diffMeta = DIFFICULTY_ITEMS.find((d) => d.key === test.difficulty);
  const statusMeta = STATUS_META[test.status] ?? STATUS_META.not_started;
  const evaluation = test.evaluation as TechTestEvaluation | null;
  const date = new Date(test.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const gradePct = evaluation?.percentage ?? null;
  const gradeColor =
    gradePct === null
      ? "text-gray-400"
      : gradePct >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : gradePct >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-md hover:-translate-y-px transition-all duration-200">
      {/* Top accent for evaluated */}
      {test.status === "evaluated" && gradePct !== null && (
        <div
          className={`h-0.5 ${
            gradePct >= 70
              ? "bg-emerald-500"
              : gradePct >= 40
              ? "bg-amber-500"
              : "bg-red-400"
          }`}
        />
      )}
      <div className="flex items-center gap-3 p-4">
        {/* Grade badge */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          {evaluation ? (
            <div className="text-center">
              <span
                className={`text-lg font-black leading-none block ${gradeColor}`}
              >
                {evaluation.grade}
              </span>
              <span
                className={`text-[10px] font-bold ${gradeColor} tabular-nums`}
              >
                {evaluation.percentage}%
              </span>
            </div>
          ) : (
            <ClipboardCheck className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {test.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${statusMeta.color}`}
            >
              {statusMeta.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {roleMeta?.icon} {roleMeta?.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {levelMeta.icon} {levelMeta.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {diffMeta?.icon} {diffMeta?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-gray-300 dark:text-gray-600" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {date}
            </span>
            {evaluation && (
              <>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {evaluation.requirementsCovered}/
                  {evaluation.requirementsTotal} requirements
                </span>
              </>
            )}
            {test.tags.length > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <div className="flex gap-1 flex-wrap">
                  {test.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[9px] font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400 px-1.5 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                  {test.tags.length > 3 && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-500">
                      +{test.tags.length - 3}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="secondary" size="sm" onClick={onView}>
            <Eye className="h-3 w-3 sm:mr-1.5" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
