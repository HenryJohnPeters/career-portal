import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  ApiResponse,
  CreateTechnicalTestRequest,
  TechnicalTest,
  TechTestSelfReviewRequest,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

/** Store a full test returned by a mutation and refresh the history list. */
function storeTest(qc: QueryClient, res: ApiResponse<TechnicalTest>) {
  qc.setQueryData(queryKeys.technicalTest(res.data.id), res);
  void qc.invalidateQueries({ queryKey: queryKeys.technicalTests, exact: true });
}

/**
 * GET /technical-tests. PLAN §2.10: the API returns `TechnicalTestSummary[]`
 * (no scenario/submission/evaluation) once api-techtests lands — switch the
 * generic to `TechnicalTestSummary` and load details with useTechnicalTest(id).
 */
export function useTechnicalTests() {
  return useQuery({
    queryKey: queryKeys.technicalTests,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<TechnicalTest[]>>("/technical-tests", { signal }),
  });
}

/** GET /technical-tests/:id — full test (scenario, submission, evaluation). */
export function useTechnicalTest(id: string | null) {
  return useQuery({
    queryKey: queryKeys.technicalTest(id),
    queryFn: ({ signal }) =>
      api.get<ApiResponse<TechnicalTest>>(`/technical-tests/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useCreateTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTechnicalTestRequest) =>
      api.post<ApiResponse<TechnicalTest>>("/technical-tests", data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
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
      api.post<ApiResponse<TechnicalTest>>(`/technical-tests/${testId}/start`),
    onSuccess: (res) => storeTest(qc, res),
  });
}

export function useSubmitTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, submission }: { testId: string; submission: string }) =>
      api.post<ApiResponse<TechnicalTest>>(
        `/technical-tests/${testId}/submit`,
        { submission },
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    onSuccess: (res) => {
      storeTest(qc, res);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
}

/** PUT /technical-tests/:id/self-review — free rubric rating (0-3 per criterion). */
export function useSelfReviewTechTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, ...data }: { testId: string } & TechTestSelfReviewRequest) =>
      api.put<ApiResponse<TechnicalTest>>(`/technical-tests/${testId}/self-review`, data),
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
        `/technical-tests/${testId}/ai-review`,
        undefined,
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    onSuccess: (res) => storeTest(qc, res),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

/** DELETE /technical-tests/:id — soft delete; still counts toward the monthly free quota. */
export function useDeleteTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => api.delete(`/technical-tests/${testId}`),
    onSuccess: (_res, testId) => {
      qc.setQueryData<ApiResponse<{ id: string }[]>>(
        queryKeys.technicalTests,
        (old) => old && { ...old, data: old.data.filter((t) => t.id !== testId) },
      );
      qc.removeQueries({ queryKey: queryKeys.technicalTest(testId) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      return qc.invalidateQueries({ queryKey: queryKeys.technicalTests, exact: true });
    },
  });
}
