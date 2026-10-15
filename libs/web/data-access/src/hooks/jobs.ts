import { useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  ApiResponse,
  CreateJobRequest,
  Job,
  JobDescriptionAnalysis,
  JobInsights,
  JobStatus,
  MatchJobRequest,
  MatchResult,
  MatchTextRequest,
  TailorApplicationRequest,
  TailorApplicationResult,
  UpdateJobRequest,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";
import type { MutationUiOptions } from "./cv";

type JobsData = ApiResponse<Job[]>;
type JobData = ApiResponse<Job>;

const uiMeta = (options: MutationUiOptions = {}) =>
  options.silent ? { silent: true } : undefined;

const noop = () => undefined;

/** List entries never carry the description text (GET /jobs returns it as null). */
function toListItem(job: Job): Job {
  return { ...job, jobDescription: null };
}

/**
 * Write a job returned by the API into the cached list and detail queries
 * (merging, so fields a response omits survive). A response without the
 * description text keeps the cached one.
 */
function writeJob(qc: QueryClient, job: Job) {
  qc.setQueryData<JobsData>(
    queryKeys.jobs,
    (old) =>
      old && {
        ...old,
        data: old.data.map((j) => (j.id === job.id ? { ...j, ...toListItem(job) } : j)),
      },
  );
  qc.setQueryData<JobData>(queryKeys.job(job.id), (old) => {
    if (!old) return old;
    const jobDescription =
      job.jobDescription ?? (job.hasJobDescription ? old.data.jobDescription : null);
    return { ...old, data: { ...old.data, ...job, jobDescription } };
  });
}

/** Patch one job in the cached list and its detail query. */
function patchJob(qc: QueryClient, id: string, patch: Partial<Job>) {
  qc.setQueryData<JobsData>(
    queryKeys.jobs,
    (old) =>
      old && {
        ...old,
        data: old.data.map((j) => (j.id === id ? { ...j, ...patch } : j)),
      },
  );
  qc.setQueryData<JobData>(
    queryKeys.job(id),
    (old) => old && { ...old, data: { ...old.data, ...patch } },
  );
}

/** Aggregates that change with any job write: insights, dashboard counts and the follow-up badge. */
function invalidateJobAggregates(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.jobInsights });
  void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
}

/** GET /jobs — most recently updated first, without job descriptions (see `hasJobDescription`). */
export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: ({ signal }) => api.get<JobsData>("/jobs", { signal }),
  });
}

/** GET /jobs/:id — full job including `jobDescription`. */
export function useJob(id: string | null) {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: ({ signal }) => api.get<JobData>(`/jobs/${id}`, { signal }),
    enabled: !!id,
  });
}

/**
 * POST /jobs — the response (a full job) goes to the top of the cached list,
 * which is newest-first, so the list is not refetched.
 */
export function useCreateJob(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: (data: CreateJobRequest) => api.post<JobData>("/jobs", data),
    onSuccess: (res, vars) => {
      qc.setQueryData<JobsData>(
        queryKeys.jobs,
        (old) =>
          old && {
            ...old,
            data: [toListItem(res.data), ...old.data.filter((j) => j.id !== res.data.id)],
          },
      );
      invalidateJobAggregates(qc);
      if (vars.coverLetterId) {
        void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      }
    },
  });
}

/**
 * PATCH /jobs/:id — send only the changed fields; `null` clears a nullable
 * field. The response replaces the cached job, so the list is not refetched.
 */
export function useUpdateJob(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: ({ id, ...data }: { id: string } & UpdateJobRequest) =>
      api.patch<JobData>(`/jobs/${id}`, data),
    onSuccess: (res, vars) => {
      writeJob(qc, res.data);
      invalidateJobAggregates(qc);
      if (vars.coverLetterId !== undefined) {
        void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      }
    },
  });
}

export interface MoveJobVariables {
  id: string;
  status: JobStatus;
}

interface MoveJobContext {
  previousStatus: JobStatus | null;
  version: number;
}

function setCachedStatus(qc: QueryClient, id: string, status: JobStatus) {
  patchJob(qc, id, { status });
}

const MOVE_JOB_KEY = ["jobs", "move"] as const;

/**
 * Kanban moves: PATCH /jobs/:id { status } with an instant board update.
 *
 * - In-flight list fetches are cancelled first, so a stale response cannot
 *   move the card back.
 * - Moves of the same job are sent one after another, so the server ends on
 *   the last status the user picked.
 * - A failed move is rolled back only if it is still the latest move of that
 *   job. Once no move is pending, the list is refetched to resync with the
 *   server (not earlier: that fetch could read the server before a newer
 *   move's PATCH lands and put the card back).
 *
 * Errors are not toasted globally (`meta.silent`): the caller awaits
 * `mutateAsync` per move and reports failures with the job's name.
 */
export function useMoveJob() {
  const qc = useQueryClient();
  const versions = useRef(new Map<string, number>());
  const queues = useRef(new Map<string, Promise<void>>());
  const needsResync = useRef(false);

  return useMutation<JobData, Error, MoveJobVariables, MoveJobContext>({
    mutationKey: MOVE_JOB_KEY,
    meta: { silent: true },
    mutationFn: ({ id, status }) => {
      const previous = queues.current.get(id) ?? Promise.resolve();
      const request = previous.then(() => api.patch<JobData>(`/jobs/${id}`, { status }));
      const settled = request.then(noop, noop);
      queues.current.set(id, settled);
      void settled.then(() => {
        if (queues.current.get(id) === settled) queues.current.delete(id);
      });
      return request;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.jobs, exact: true });
      const previousStatus =
        qc.getQueryData<JobsData>(queryKeys.jobs)?.data.find((j) => j.id === id)?.status ?? null;
      const version = (versions.current.get(id) ?? 0) + 1;
      versions.current.set(id, version);
      setCachedStatus(qc, id, status);
      return { previousStatus, version };
    },
    onSuccess: (res, { id }, context) => {
      // An older move's response must not overwrite a newer optimistic status.
      if (versions.current.get(id) === context.version) writeJob(qc, res.data);
    },
    onError: (_err, { id }, context) => {
      if (context && context.previousStatus && versions.current.get(id) === context.version) {
        setCachedStatus(qc, id, context.previousStatus);
      }
      needsResync.current = true;
    },
    onSettled: () => {
      // This move still counts as pending here; wait for the last one of a burst.
      if (qc.isMutating({ mutationKey: MOVE_JOB_KEY }) > 1) return;
      if (needsResync.current) {
        needsResync.current = false;
        void qc.invalidateQueries({ queryKey: queryKeys.jobs, exact: true });
      }
      invalidateJobAggregates(qc);
    },
  });
}

export function useDeleteJob(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: (_res, id) => {
      qc.setQueryData<JobsData>(
        queryKeys.jobs,
        (old) => old && { ...old, data: old.data.filter((j) => j.id !== id) },
      );
      qc.removeQueries({ queryKey: queryKeys.job(id) });
      invalidateJobAggregates(qc);
      // A letter written for this job loses its job link (ON DELETE SET NULL).
      void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
    },
  });
}

/** POST /jobs/:id/match — deterministic keyword match; persists the score on the job. */
export function useMatchJob(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: ({ jobId, ...data }: { jobId: string } & MatchJobRequest) =>
      api.post<ApiResponse<MatchResult>>(`/jobs/${jobId}/match`, data),
    onSuccess: (res, vars) => {
      patchJob(qc, vars.jobId, {
        matchScore: res.data.score,
        matchCheckedAt: res.data.checkedAt,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
}

/** POST /jobs/match-text — match a CV against pasted text (nothing saved). */
export function useMatchText(options: MutationUiOptions = {}) {
  return useMutation({
    meta: uiMeta(options),
    mutationFn: (data: MatchTextRequest) =>
      api.post<ApiResponse<MatchResult>>("/jobs/match-text", data),
  });
}

/** POST /jobs/analyze — AI extraction of company/role/skills from a job ad (1 AI action). */
export function useAnalyzeJobDescription(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: (data: { jobDescription: string }) =>
      api.post<ApiResponse<JobDescriptionAnalysis>>("/jobs/analyze", data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

/** GET /jobs/insights — funnel, rates, weekly volume; per-CV breakdown is Premium. */
export function useJobInsights(enabled = true) {
  return useQuery({
    queryKey: queryKeys.jobInsights,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<JobInsights>>("/jobs/insights", { signal }),
    enabled,
  });
}

/**
 * POST /jobs/:id/tailor (Premium) — creates a tailored CV version and an
 * optional cover letter, both linked to the job.
 */
export function useTailorApplication(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: ({ jobId, ...data }: { jobId: string } & TailorApplicationRequest) =>
      api.post<ApiResponse<TailorApplicationResult>>(`/jobs/${jobId}/tailor`, data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
      void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs });
    },
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}
