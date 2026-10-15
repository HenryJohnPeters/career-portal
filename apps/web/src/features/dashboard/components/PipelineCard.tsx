import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Kanban, Plus } from "lucide-react";
import type { DashboardSummary } from "@careerportal/shared/types";
import { Card } from "@careerportal/web/ui";
import { PIPELINE_COLUMNS } from "../../tracker/constants";

/** Applications per stage, as bars relative to the busiest stage. */
export function PipelineCard({ pipeline }: { pipeline: Partial<DashboardSummary["pipeline"]> }) {
  const headingId = useId();
  const rows = PIPELINE_COLUMNS.map((column) => ({ column, count: pipeline[column.id] ?? 0 }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Card className="p-5">
      <section aria-labelledby={headingId}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Kanban className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            Pipeline
          </h2>
          {total > 0 && (
            <Link
              to="/app/jobs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline"
            >
              Open tracker <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {total === 0 ? (
          <div className="text-center">
            <p className="text-sm text-text-secondary">No applications yet. Every job you track shows up here by stage.</p>
            <Link
              to="/app/jobs?new=1"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add your first job
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rows.map(({ column, count }) => (
              <li key={column.id}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className={count > 0 ? "font-medium text-text-secondary" : "text-text-tertiary"}>{column.label}</span>
                  <span className="font-semibold tabular-nums text-text-primary">{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${column.bar}`}
                    style={{ width: `${count > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  );
}
