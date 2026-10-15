import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, Download, Eye, Plus, SearchX, Sparkles } from "lucide-react";
import {
  isActivePremium,
  type ApiResponse,
  type Job,
  type JobStatus,
} from "@careerportal/shared/types";
import {
  downloadBlob,
  getErrorMessage,
  queryKeys,
  useCoverLetterSummaries,
  useCvVersions,
  useDashboardSummary,
  useJobs,
  useMoveJob,
  usePlanUsage,
} from "@careerportal/web/data-access";
import { Alert, Button, ErrorState, Spinner } from "@careerportal/web/ui";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { PageHero } from "../shared";
import { JOB_LIST_CAP, isClosedStatus, statusLabel } from "./constants";
import { EMPTY_FILTERS, filterJobs, hasActiveFilters, type TrackerFilterState } from "./lib/board";
import { buildJobsCsv, jobsCsvFilename } from "./lib/csv";
import { localDateKey } from "./lib/follow-up";
import { useColumnConfig } from "./hooks/useColumnConfig";
import { AddJobModal } from "./components/AddJobModal";
import { ColumnManager } from "./components/ColumnManager";
import { InsightsStrip } from "./components/InsightsStrip";
import { KanbanBoard } from "./components/KanbanBoard";
import { MoveUndoBar, type LastMove } from "./components/MoveUndoBar";
import { TrackerDrawer } from "./components/TrackerDrawer";
import { TrackerFilters } from "./components/TrackerFilters";
import type { DocumentOption } from "./components/drawer/DrawerSection";

const NO_JOBS: readonly Job[] = [];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Job tracker. URL state:
 *   ?job=<id>  opens that application's details drawer (deep-linkable)
 *   ?new=1     opens the "Add an application" dialog
 */
export function JobsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const jobsQuery = useJobs();
  const cvQuery = useCvVersions();
  const lettersQuery = useCoverLetterSummaries();
  const summaryTotal = useDashboardSummary().data?.data.counts?.jobs;
  const features = usePlanUsage().data?.data.features;
  const canTailor = features?.tailorKit ?? isActivePremium(user);
  const { mutateAsync: moveAsync } = useMoveJob();
  const columns = useColumnConfig();

  const jobs = jobsQuery.data?.data ?? NO_JOBS;
  const cvOptions = useMemo<DocumentOption[]>(
    () => (cvQuery.data?.data ?? []).map(({ id, title, isActive }) => ({ id, title, isActive })),
    [cvQuery.data],
  );
  const letterOptions = useMemo<DocumentOption[]>(
    () => (lettersQuery.data?.data ?? []).map(({ id, title }) => ({ id, title })),
    [lettersQuery.data],
  );
  const titles = useMemo(
    () => ({
      cv: new Map(cvOptions.map((o) => [o.id, o.title])),
      letters: new Map(letterOptions.map((o) => [o.id, o.title])),
    }),
    [cvOptions, letterOptions],
  );

  // Filtering waits for typing to settle (useDeferredValue) so the board stays responsive.
  const [filters, setFilters] = useState<TrackerFilterState>(EMPTY_FILTERS);
  const deferredSearch = useDeferredValue(filters.search);
  const today = localDateKey();
  const { status: statusFilter, followUpDue, missingCv, missingCoverLetter } = filters;
  const filteredJobs = useMemo(
    () =>
      filterJobs(
        jobs,
        { search: deferredSearch, status: statusFilter, followUpDue, missingCv, missingCoverLetter },
        today,
      ),
    [jobs, deferredSearch, statusFilter, followUpDue, missingCv, missingCoverLetter, today],
  );
  // Results hidden by the column settings are easy to miss while searching or filtering.
  const filtering = hasActiveFilters(filters);
  const hiddenMatches = useMemo(() => {
    if (!filtering) return { statuses: [] as JobStatus[], count: 0 };
    const visible = new Set<string>(columns.visibleIds);
    const hidden = filteredJobs.filter((j) => !visible.has(j.status));
    return { statuses: [...new Set(hidden.map((j) => j.status))], count: hidden.length };
  }, [filtering, filteredJobs, columns.visibleIds]);

  /* ── Drawer (?job=) and add dialog (?new=1) ─────────────────────── */

  const rawJobId = params.get("job");
  const drawerJobId = rawJobId && UUID_PATTERN.test(rawJobId) ? rawJobId : null;
  const openedFromBoard = (location.state as { fromBoard?: boolean } | null)?.fromBoard === true;

  const openJob = useCallback(
    (jobId: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("job", jobId);
          return next;
        },
        { state: { fromBoard: true } },
      );
    },
    [setParams],
  );

  const closeJob = useCallback(() => {
    // Opened from the board: go back, so the browser's Back button and Close agree.
    if (openedFromBoard) {
      navigate(-1);
      return;
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("job");
        return next;
      },
      { replace: true },
    );
  }, [openedFromBoard, navigate, setParams]);

  const [addOpen, setAddOpen] = useState(false);
  useEffect(() => {
    if (params.get("new") !== "1") return;
    setAddOpen(true);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("new");
        return next;
      },
      { replace: true },
    );
  }, [params, setParams]);

  /* ── Moves with undo ────────────────────────────────────────────── */

  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const dismissMove = useCallback(() => setLastMove(null), []);

  const moveJob = useCallback(
    (jobId: string, status: JobStatus, isUndo = false) => {
      const job = queryClient.getQueryData<ApiResponse<Job[]>>(queryKeys.jobs)?.data.find((j) => j.id === jobId);
      if (!job || job.status === status) return;
      setLastMove(isUndo ? null : { key: Date.now(), jobId, company: job.company, from: job.status, to: status });
      moveAsync({ id: jobId, status }).catch((err: unknown) => {
        setLastMove((current) => (current?.jobId === jobId ? null : current));
        toast(
          "error",
          `Couldn't move ${job.company} to ${statusLabel(status)}. ${getErrorMessage(err, "Please try again.")}`,
        );
      });
    },
    [queryClient, moveAsync, toast],
  );

  const handleMove = useCallback((jobId: string, status: JobStatus) => moveJob(jobId, status), [moveJob]);

  const exportCsv = () => {
    const csv = buildJobsCsv(jobs, titles);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), jobsCsvFilename(today));
  };
  const undoMove = useCallback((move: LastMove) => moveJob(move.jobId, move.from, true), [moveJob]);

  /* ── Render ─────────────────────────────────────────────────────── */

  if (jobsQuery.isPending) return <Spinner label="Loading your applications" />;
  if (!jobsQuery.data) {
    return (
      <ErrorState
        message={getErrorMessage(jobsQuery.error, "Your applications couldn't be loaded.")}
        onRetry={() => void jobsQuery.refetch()}
      />
    );
  }

  const truncated = jobs.length >= JOB_LIST_CAP;
  const total = truncated ? Math.max(summaryTotal ?? 0, jobs.length) : jobs.length;
  const active = jobs.filter((j) => !isClosedStatus(j.status)).length;
  const addButton = (
    <Button onClick={() => setAddOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add application
    </Button>
  );

  return (
    <div className="flex flex-col h-full min-h-0 space-y-5">
      <PageHero
        icon={Briefcase}
        title="Job Tracker"
        subtitle="Track every application. Drag cards between stages; open one for details, follow-ups and your CV match."
        stats={[
          { value: total.toLocaleString(), label: `Application${total === 1 ? "" : "s"}` },
          { value: active.toLocaleString(), label: "In progress" },
        ]}
      />

      {jobs.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <TrackerFilters filters={filters} onChange={setFilters} />
          <div className="flex items-center gap-2 shrink-0">
            <ColumnManager
              visibleColumns={columns.visibleColumns}
              hiddenColumns={columns.hiddenColumns}
              onRemove={columns.removeColumn}
              onAdd={columns.addColumn}
              onMove={columns.moveColumn}
              onReset={columns.resetColumns}
            />
            <Button variant="outline" onClick={exportCsv} title="Download your applications as a spreadsheet (CSV)">
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
              <span className="sr-only sm:hidden">Export CSV</span>
            </Button>
            {addButton}
          </div>
        </div>
      )}

      {jobsQuery.isError && (
        <Alert variant="warning">
          {getErrorMessage(jobsQuery.error, "Your applications couldn't be refreshed.")} Showing the last loaded
          version.
        </Alert>
      )}

      {jobs.length > 0 && <InsightsStrip />}

      {truncated && (
        <Alert variant="info">
          Showing your {JOB_LIST_CAP.toLocaleString()} most recently updated applications.
        </Alert>
      )}

      {hiddenMatches.count > 0 && (
        <Alert
          variant="warning"
          action={
            <Button variant="outline" size="sm" onClick={() => columns.showColumns(hiddenMatches.statuses)}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Show{" "}
              {hiddenMatches.statuses.length === 1
                ? `the ${statusLabel(hiddenMatches.statuses[0])} column`
                : "those columns"}
            </Button>
          }
        >
          {hiddenMatches.count} matching application{hiddenMatches.count === 1 ? " is" : "s are"} in hidden columns.
        </Alert>
      )}

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30">
            <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Track your first application</h2>
          <p className="mt-1 max-w-md text-sm text-text-secondary">
            Paste the job ad to auto-fill the details, check your CV against it, set a follow-up reminder and move it
            along as you hear back.
          </p>
          <div className="mt-5">{addButton}</div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <SearchX className="mb-3 h-6 w-6 text-text-tertiary" aria-hidden="true" />
          <p className="text-sm font-semibold text-text-primary">No applications match your filters</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear search and filters
          </Button>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <KanbanBoard
            jobs={filteredJobs}
            columns={columns.visibleColumns}
            onMove={handleMove}
            onOpen={openJob}
            titles={titles}
            today={today}
          />
        </div>
      )}

      <MoveUndoBar move={lastMove} onUndo={undoMove} onDismiss={dismissMove} />

      {drawerJobId && (
        <TrackerDrawer
          key={drawerJobId}
          jobId={drawerJobId}
          listJob={jobs.find((j) => j.id === drawerJobId)}
          cvOptions={cvOptions}
          letterOptions={letterOptions}
          documentsLoaded={cvQuery.isSuccess && lettersQuery.isSuccess}
          canTailor={canTailor}
          onClose={closeJob}
        />
      )}

      {addOpen && (
        <AddJobModal
          cvOptions={cvOptions}
          letterOptions={letterOptions}
          onClose={() => setAddOpen(false)}
          onCreated={(job) => {
            setAddOpen(false);
            toast("success", `${job.company} added to your tracker.`);
          }}
        />
      )}
    </div>
  );
}
