import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResponse,
  CreateInterviewSessionRequest,
  InterviewOptionsCatalog,
  InterviewProgress,
  InterviewSession,
  InterviewSessionSummary,
  NextQuestionResponse,
  SubmitInterviewAnswerResponse,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

/** GET /interview-prep/options — static catalogue, fetched once per page load. */
export function useInterviewOptions() {
  return useQuery({
    queryKey: queryKeys.interviewOptions,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<InterviewOptionsCatalog>>("/interview-prep/options", {
        signal,
      }),
    staleTime: Infinity,
  });
}

/** GET /interview-prep/sessions — history (newest first, ≤100). */
export function useInterviewSessions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.interviewSessions,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<InterviewSessionSummary[]>>("/interview-prep/sessions", {
        signal,
      }),
    enabled,
  });
}

/** GET /interview-prep/progress — free: totals + top-3 weak topics; Premium: full breakdown. */
export function useInterviewProgress(enabled = true) {
  return useQuery({
    queryKey: queryKeys.interviewProgress,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<InterviewProgress>>("/interview-prep/progress", {
        signal,
      }),
    enabled,
  });
}

export function useInterviewSession(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.interviewSession(sessionId),
    queryFn: ({ signal }) =>
      api.get<ApiResponse<InterviewSession>>(
        `/interview-prep/sessions/${sessionId}`,
        { signal },
      ),
    enabled: !!sessionId,
  });
}

export function useCreateInterviewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterviewSessionRequest) =>
      api.post<ApiResponse<InterviewSession>>("/interview-prep/sessions", data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.interviewSession(res.data.id), res);
      void qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
      void qc.invalidateQueries({ queryKey: queryKeys.interviewProgress });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

export function useNextInterviewQuestion(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.interviewNextQuestion(sessionId),
    queryFn: ({ signal }) =>
      api.get<ApiResponse<NextQuestionResponse>>(
        `/interview-prep/sessions/${sessionId}/next`,
        { signal },
      ),
    enabled: !!sessionId,
  });
}

export function useSubmitInterviewAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      questionId,
      answer,
    }: {
      sessionId: string;
      questionId: string;
      answer: string;
    }) =>
      api.post<ApiResponse<SubmitInterviewAnswerResponse>>(
        `/interview-prep/sessions/${sessionId}/questions/${questionId}/answer`,
        { answer },
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.interviewNextQuestion(vars.sessionId),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.interviewSession(vars.sessionId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
      void qc.invalidateQueries({ queryKey: queryKeys.interviewProgress });
      void invalidateUsage(qc);
    },
  });
}
