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
  MatchJobRequest,
  MatchResult,
  MatchTextRequest,
  TailorApplicationRequest,
  TailorApplicationResult,
  UpdateJobRequest,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

type JobsData = ApiResponse<Job[]>;

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
  qc.setQueryData<ApiResponse<Job>>(
    queryKeys.job(id),
    (old) => old && { ...old, data: { ...old.data, ...patch } },
  );
}

/** GET /jobs — list without job descriptions (see `hasJobDescription`). */
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
    queryFn: ({ signal }) => api.get<ApiResponse<Job>>(`/jobs/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobRequest) => api.post<ApiResponse<Job>>("/jobs", data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      if (vars.coverLetterId) {
        void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      }
      return qc.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

/** PATCH /jobs/:id — the response replaces the cached job, so the list is not refetched. */
export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateJobRequest) =>
      api.patch<ApiResponse<Job>>(`/jobs/${id}`, data),
    onSuccess: (res, vars) => {
      patchJob(qc, res.data.id, res.data);
      void qc.invalidateQueries({ queryKey: queryKeys.jobInsights });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      if (vars.coverLetterId !== undefined) {
        void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      }
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: (_res, id) => {
      qc.setQueryData<JobsData>(
        queryKeys.jobs,
        (old) => old && { ...old, data: old.data.filter((j) => j.id !== id) },
      );
      qc.removeQueries({ queryKey: queryKeys.job(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      return qc.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

/** POST /jobs/:id/match — deterministic keyword match; persists the score on the job. */
export function useMatchJob() {
  const qc = useQueryClient();
  return useMutation({
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
export function useMatchText() {
  return useMutation({
    mutationFn: (data: MatchTextRequest) =>
      api.post<ApiResponse<MatchResult>>("/jobs/match-text", data),
  });
}

/** POST /jobs/analyze — AI extraction of company/role/skills from a job ad (1 AI action). */
export function useAnalyzeJobDescription() {
  const qc = useQueryClient();
  return useMutation({
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
export function useTailorApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, ...data }: { jobId: string } & TailorApplicationRequest) =>
      api.post<ApiResponse<TailorApplicationResult>>(`/jobs/${jobId}/tailor`, data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
      void qc.invalidateQueries({ queryKey: queryKeys.coverLetters });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      return qc.invalidateQueries({ queryKey: queryKeys.jobs });
    },
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}
