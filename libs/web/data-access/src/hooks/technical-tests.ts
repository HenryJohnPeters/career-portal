import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  ApiResponse,
  CreateTechnicalTestRequest,
  SubmitTechnicalTestRequest,
  TechnicalTest,
  TechnicalTestSummary,
  TechTestSelfReviewRequest,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api, isApiError } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

/*
 * Technical tests (PLAN §2.10). Mutations the page renders inline are
 * `meta.silent` (no global toast); delete keeps the global error toast.
 */

const testPath = (testId: string | null) =>
  `/technical-tests/${encodeURIComponent(testId ?? "")}`;

/** Store a full test returned by a mutation and refresh the history list. */
function storeTest(qc: QueryClient, res: ApiResponse<TechnicalTest>) {
  qc.setQueryData(queryKeys.technicalTest(res.data.id), res);
  void qc.invalidateQueries({ queryKey: queryKeys.technicalTests, exact: true });
}

/** 409: the test changed elsewhere (started, submitted or reviewed in another tab) — reload it. */
function refreshOnConflict(qc: QueryClient, err: unknown, testId: string) {
  if (isApiError(err) && err.status === 409) {
    void qc.invalidateQueries({ queryKey: queryKeys.technicalTest(testId) });
    void qc.invalidateQueries({ queryKey: queryKeys.technicalTests, exact: true });
  }
}

/** GET /technical-tests — summaries (no scenario/submission), newest first, ≤100. */
export function useTechnicalTests(enabled = true) {
  return useQuery({
    queryKey: queryKeys.technicalTests,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<TechnicalTestSummary[]>>("/technical-tests", { signal }),
    enabled,
  });
}

/** GET /technical-tests/:id — full test (scenario, submission, evaluation). */
export function useTechnicalTest(id: string | null) {
  return useQuery({
    queryKey: queryKeys.technicalTest(id),
    queryFn: ({ signal }) =>
      api.get<ApiResponse<TechnicalTest>>(testPath(id), { signal }),
    enabled: !!id,
  });
}

/** POST /technical-tests — counts toward the monthly free allowance. */
export function useCreateTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTechnicalTestRequest) =>
      api.post<ApiResponse<TechnicalTest>>("/technical-tests", data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    meta: { silent: true },
    onSuccess: (res) => {
      storeTest(qc, res);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

export function useStartTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      api.post<ApiResponse<TechnicalTest>>(`${testPath(testId)}/start`),
    meta: { silent: true },
    onSuccess: (res) => storeTest(qc, res),
    onError: (err, testId) => refreshOnConflict(qc, err, testId),
  });
}

/** POST /technical-tests/:id/submit — 1..100000 characters; re-submitting returns 409. */
export function useSubmitTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, submission }: { testId: string } & SubmitTechnicalTestRequest) =>
      api.post<ApiResponse<TechnicalTest>>(`${testPath(testId)}/submit`, {
        submission,
      }),
    meta: { silent: true },
    onSuccess: (res) => {
      storeTest(qc, res);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
    onError: (err, vars) => refreshOnConflict(qc, err, vars.testId),
  });
}

/** PUT /technical-tests/:id/self-review — free rubric rating (0-3 per criterion). */
export function useSelfReviewTechTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, ...data }: { testId: string } & TechTestSelfReviewRequest) =>
      api.put<ApiResponse<TechnicalTest>>(`${testPath(testId)}/self-review`, data),
    meta: { silent: true },
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.technicalTest(res.data.id), res);
    },
  });
}

/** POST /technical-tests/:id/ai-review — Premium, 1 AI action, once per submitted test. */
export function useAiReviewTechTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      api.post<ApiResponse<TechnicalTest>>(
        `${testPath(testId)}/ai-review`,
        undefined,
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    meta: { silent: true },
    onSuccess: (res) => storeTest(qc, res),
    onError: (err, testId) => refreshOnConflict(qc, err, testId),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

/** DELETE /technical-tests/:id — soft delete; still counts toward the monthly free allowance. */
export function useDeleteTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => api.delete(testPath(testId)),
    onSuccess: (_res, testId) => {
      qc.setQueryData<ApiResponse<TechnicalTestSummary[]>>(
        queryKeys.technicalTests,
        (old) => old && { ...old, data: old.data.filter((t) => t.id !== testId) },
      );
      qc.removeQueries({ queryKey: queryKeys.technicalTest(testId), exact: true });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      return qc.invalidateQueries({ queryKey: queryKeys.technicalTests, exact: true });
    },
  });
}
