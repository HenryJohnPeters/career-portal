import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ApiResponse,
  CreateInterviewSessionRequest,
  InterviewProgress,
  InterviewSession,
  InterviewSessionSummary,
  NextQuestionResponse,
  SubmitInterviewAnswerResponse,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

/*
 * Interview prep (PLAN §2.9). The create/answer/complete mutations are
 * `meta.silent`: the practice page renders their errors inline and opens the
 * upgrade prompt itself, so the global handler must not toast them too.
 */

const sessionPath = (sessionId: string | null) =>
  `/interview-prep/sessions/${encodeURIComponent(sessionId ?? "")}`;

/** GET /interview-prep/sessions — for `queryClient.fetchQuery` outside a component. */
export const interviewSessionsQueryOptions = queryOptions({
  queryKey: queryKeys.interviewSessions,
  queryFn: ({ signal }) =>
    api.get<ApiResponse<InterviewSessionSummary[]>>("/interview-prep/sessions", {
      signal,
    }),
});

/** GET /interview-prep/sessions — summaries, newest first (≤100). */
export function useInterviewSessions(enabled = true) {
  return useQuery({ ...interviewSessionsQueryOptions, enabled });
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

/**
 * GET /interview-prep/sessions/:id — session header + report. Answer keys are
 * only included for answered questions. Not refetched after every answer:
 * the answer mutation marks it stale and the report view refetches it.
 */
export function useInterviewSession(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.interviewSession(sessionId),
    queryFn: ({ signal }) =>
      api.get<ApiResponse<InterviewSession>>(sessionPath(sessionId), { signal }),
    enabled: !!sessionId,
  });
}

/** POST /interview-prep/sessions — may wait for question-bank work, hence the long timeout. */
export function useCreateInterviewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterviewSessionRequest) =>
      api.post<ApiResponse<InterviewSession>>("/interview-prep/sessions", data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    meta: { silent: true },
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.interviewSession(res.data.id), res);
      void qc.invalidateQueries({ queryKey: queryKeys.interviewProgress });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
    onSettled: () => {
      // Also after a timeout: the server may still have created the session.
      void qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
      void invalidateUsage(qc);
    },
  });
}

/** GET /interview-prep/sessions/:id/next — the next unanswered question (answer key stripped). */
export function useNextInterviewQuestion(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.interviewNextQuestion(sessionId),
    queryFn: ({ signal }) =>
      api.get<ApiResponse<NextQuestionResponse>>(`${sessionPath(sessionId)}/next`, {
        signal,
      }),
    enabled: !!sessionId,
    meta: { silent: true },
  });
}

export interface SubmitInterviewAnswerVariables {
  sessionId: string;
  /** The session-question id (`NextQuestionResponse.sessionQuestion.id`). */
  questionId: string;
  /** Option index as a string ("2"); multi-select: comma-separated ("0,2"). */
  answer: string;
}

/** POST …/questions/:questionId/answer. Re-answering returns 409. */
export function useSubmitInterviewAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, questionId, answer }: SubmitInterviewAnswerVariables) =>
      api.post<ApiResponse<SubmitInterviewAnswerResponse>>(
        `${sessionPath(sessionId)}/questions/${encodeURIComponent(questionId)}/answer`,
        { answer },
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    meta: { silent: true },
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.interviewProgress });
      void qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
      // The session (status/report) only matters once it is finished; the
      // report view refetches it, so mark it stale without a refetch now.
      void qc.invalidateQueries({
        queryKey: queryKeys.interviewSession(vars.sessionId),
        refetchType: "none",
      });
    },
    onSettled: (_res, _err, vars) => {
      // Also after a 409 (already answered): move on to the real next question.
      void qc.invalidateQueries({
        queryKey: queryKeys.interviewNextQuestion(vars.sessionId),
      });
      void invalidateUsage(qc);
    },
  });
}

/** POST /interview-prep/sessions/:id/complete — finish early; the report covers the answered questions. */
export function useCompleteInterviewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<ApiResponse<InterviewSession>>(`${sessionPath(sessionId)}/complete`),
    meta: { silent: true },
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.interviewSession(res.data.id), res);
      void qc.invalidateQueries({
        queryKey: queryKeys.interviewNextQuestion(res.data.id),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
      void qc.invalidateQueries({ queryKey: queryKeys.interviewProgress });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
}
