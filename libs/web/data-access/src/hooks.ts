import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api-client";
import { supabase } from "./supabase";
import { queryKeys } from "./query-keys";
import type {
  ApiResponse,
  User,
  DashboardSummary,
  CvVersion,
  CvSection,
  ThemeConfig,
  Question,
  QuestionAnswer,
  CoverLetter,
  Job,
  InterviewSession,
  NextQuestionResponse,
  CreateInterviewSessionRequest,
  InterviewOptionsCatalog,
  PracticeQuestion,
  PracticeCheckResult,
  PracticeQuizFilters,
  PracticeUsageStatus,
  TechnicalTest,
  CreateTechnicalTestRequest,
  SubscriptionStatus,
  AiUsageStatus,
  AiFullCvResult,
} from "@careerportal/shared/types";

// === Auth ===
export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<ApiResponse<User>>("/auth/me"),
    retry: false,
    enabled,
  });
}

// === Dashboard ===
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => api.get<ApiResponse<DashboardSummary>>("/dashboard/summary"),
  });
}

// === CV ===
export function useCvVersions() {
  return useQuery({
    queryKey: queryKeys.cvVersions,
    queryFn: () => api.get<ApiResponse<CvVersion[]>>("/cv/versions"),
  });
}

export function useCreateCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string }) =>
      api.post<ApiResponse<CvVersion>>("/cv/versions", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cvVersions }),
  });
}

export function useUpdateCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      isActive?: boolean;
      templateId?: string;
      themeConfig?: Partial<ThemeConfig> | Record<string, unknown>;
      headerLayout?: string;
      name?: string;
      email?: string;
      photoUrl?: string;
      phone?: string;
      location?: string;
      website?: string;
      linkedin?: string;
      github?: string;
    }) => api.patch<ApiResponse<CvVersion>>(`/cv/versions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
    },
  });
}

export function useDeleteCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cv/versions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cvVersions }),
  });
}

export function useDuplicateCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ApiResponse<CvVersion>>(`/cv/versions/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cvVersions }),
  });
}

export function useCvSections(versionId: string | null) {
  return useQuery({
    queryKey: queryKeys.cvSections(versionId),
    queryFn: () =>
      api.get<ApiResponse<CvSection[]>>(`/cv/versions/${versionId}/sections`),
    enabled: !!versionId,
  });
}

export function useCreateCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      versionId,
      ...data
    }: {
      versionId: string;
      title: string;
      content?: string;
      sectionType?: string;
    }) =>
      api.post<ApiResponse<CvSection>>(
        `/cv/versions/${versionId}/sections`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cv-sections"] });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
    },
  });
}

export function useUpdateCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      content?: string;
      sectionType?: string;
    }) => api.patch<ApiResponse<CvSection>>(`/cv/sections/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cv-sections"] });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
    },
  });
}

export function useDeleteCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cv/sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cv-sections"] });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
    },
  });
}

export function useMoveCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) =>
      api.post<ApiResponse<CvSection[]>>(`/cv/sections/${id}/move`, {
        direction,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cv-sections"] });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
    },
  });
}

export function useReorderCvSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      versionId,
      sectionIds,
    }: {
      versionId: string;
      sectionIds: string[];
    }) =>
      api.post<ApiResponse<CvSection[]>>(
        `/cv/versions/${versionId}/sections/reorder`,
        { sectionIds }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cv-sections"] });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
    },
  });
}

export function useCvHtmlPreview(versionId: string | null) {
  return useQuery({
    queryKey: queryKeys.cvHtmlPreview(versionId),
    queryFn: async () => {
      const API_URL =
        (typeof import.meta !== "undefined" &&
          (import.meta as any).env?.VITE_API_URL) ||
        "http://localhost:3000";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/pdf/cv/${versionId}/html`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to load preview");
      return res.text();
    },
    enabled: !!versionId,
    staleTime: 0,
  });
}

export function useAiGenerateCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      ...data
    }: {
      sectionId: string;
      action: "generate" | "improve" | "tailor";
      jobTitle?: string;
      jobDescription?: string;
    }) =>
      api.post<ApiResponse<{ content: string }>>(
        `/cv/sections/${sectionId}/ai-generate`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aiUsage });
    },
  });
}

export function useAiGenerateFullCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      versionId,
      ...data
    }: {
      versionId: string;
      rawText: string;
      jobTitle?: string;
    }) =>
      api.post<ApiResponse<AiFullCvResult>>(
        `/cv/versions/${versionId}/ai-generate-full`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
      qc.invalidateQueries({ queryKey: ["cv-sections"] });
      qc.invalidateQueries({ queryKey: ["cv-html-preview"] });
      qc.invalidateQueries({ queryKey: queryKeys.aiUsage });
    },
  });
}

// === Questions ===
export function useQuestions(category?: string) {
  return useQuery({
    queryKey: queryKeys.questions(category),
    queryFn: () =>
      api.get<ApiResponse<Question[]>>(
        `/questions${category ? `?category=${category}` : ""}`
      ),
  });
}

export function useQuestionAnswers() {
  return useQuery({
    queryKey: queryKeys.questionAnswers,
    queryFn: () => api.get<ApiResponse<QuestionAnswer[]>>("/questions/answers"),
  });
}

export function useAnswerQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      answerText?: string;
      selectedOptionId?: string;
      skipped?: boolean;
    }) => api.put<ApiResponse<QuestionAnswer>>(`/questions/${id}/answer`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.questionAnswers });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });
}

export function usePracticeUsage() {
  return useQuery({
    queryKey: queryKeys.practiceUsage,
    queryFn: () =>
      api.get<ApiResponse<PracticeUsageStatus>>("/questions/practice/usage"),
  });
}

export function usePracticeNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filters: PracticeQuizFilters) =>
      api.post<ApiResponse<PracticeQuestion | null>>(
        "/questions/practice/next",
        filters
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.practiceUsage });
    },
  });
}

export function usePracticeCheck() {
  return useMutation({
    mutationFn: (data: {
      questionId: string;
      selectedOptionIndex?: number;
      selectedOptionIndices?: number[];
    }) =>
      api.post<ApiResponse<PracticeCheckResult>>(
        "/questions/practice/check",
        data
      ),
  });
}

export function usePracticeOptions() {
  return useQuery({
    queryKey: queryKeys.practiceOptions,
    queryFn: () =>
      api.get<ApiResponse<InterviewOptionsCatalog>>("/interview-prep/options"),
  });
}

// === Cover Letters ===
export function useCoverLetters() {
  return useQuery({
    queryKey: queryKeys.coverLetters,
    queryFn: () => api.get<ApiResponse<CoverLetter[]>>("/cover-letters"),
  });
}

export function useCreateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body?: string; jobId?: string }) =>
      api.post<ApiResponse<CoverLetter>>("/cover-letters", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coverLetters }),
  });
}

export function useUpdateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      body?: string;
      jobId?: string;
    }) => api.patch<ApiResponse<CoverLetter>>(`/cover-letters/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coverLetters }),
  });
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cover-letters/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coverLetters }),
  });
}

export function useSuggestCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ApiResponse<string[]>>(`/cover-letters/${id}/suggest`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aiUsage });
    },
  });
}

export function useRewriteCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      tone,
    }: {
      id: string;
      tone?: "professional" | "friendly";
    }) =>
      api.post<ApiResponse<string>>(`/cover-letters/${id}/rewrite`, { tone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aiUsage });
    },
  });
}

export function useAiGenerateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      action: "generate" | "improve" | "tailor";
      jobTitle?: string;
      companyName?: string;
      companyUrl?: string;
      jobDescription?: string;
      tone?: "professional" | "friendly";
    }) =>
      api.post<ApiResponse<{ content: string }>>(
        `/cover-letters/${id}/ai-generate`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aiUsage });
    },
  });
}

// === Jobs ===
export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => api.get<ApiResponse<Job[]>>("/jobs"),
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      company: string;
      role: string;
      status?: string;
      url?: string;
      notes?: string;
    }) => api.post<ApiResponse<Job>>("/jobs", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      company?: string;
      role?: string;
      status?: string;
      url?: string;
      notes?: string;
      cvVersionId?: string;
      coverLetterId?: string;
      followUpDate?: string;
    }) => api.patch<ApiResponse<Job>>(`/jobs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

// === Interview Prep ===
export function useInterviewOptions() {
  return useQuery({
    queryKey: queryKeys.interviewOptions,
    queryFn: () =>
      api.get<ApiResponse<InterviewOptionsCatalog>>("/interview-prep/options"),
  });
}

export function useInterviewSessions() {
  return useQuery({
    queryKey: queryKeys.interviewSessions,
    queryFn: () =>
      api.get<ApiResponse<InterviewSession[]>>("/interview-prep/sessions"),
  });
}

export function useInterviewSession(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.interviewSession(sessionId),
    queryFn: () =>
      api.get<ApiResponse<InterviewSession>>(
        `/interview-prep/sessions/${sessionId}`
      ),
    enabled: !!sessionId,
  });
}

export function useCreateInterviewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterviewSessionRequest) =>
      api.post<ApiResponse<InterviewSession>>("/interview-prep/sessions", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.interviewSessions }),
  });
}

export function useNextInterviewQuestion(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.interviewNextQuestion(sessionId),
    queryFn: () =>
      api.get<ApiResponse<NextQuestionResponse>>(
        `/interview-prep/sessions/${sessionId}/next`
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
      api.post<ApiResponse<any>>(
        `/interview-prep/sessions/${sessionId}/questions/${questionId}/answer`,
        { answer }
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.interviewNextQuestion(vars.sessionId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.interviewSession(vars.sessionId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
    },
  });
}

export function useCompleteInterviewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<ApiResponse<InterviewSession>>(
        `/interview-prep/sessions/${sessionId}/complete`
      ),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: queryKeys.interviewSession(sessionId) });
      qc.invalidateQueries({ queryKey: queryKeys.interviewSessions });
    },
  });
}

// === Technical Tests ===
export function useTechnicalTests() {
  return useQuery({
    queryKey: queryKeys.technicalTests,
    queryFn: () => api.get<ApiResponse<TechnicalTest[]>>("/technical-tests"),
  });
}

export function useTechnicalTest(testId: string | null) {
  return useQuery({
    queryKey: queryKeys.technicalTest(testId),
    queryFn: () =>
      api.get<ApiResponse<TechnicalTest>>(`/technical-tests/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTechnicalTestRequest) =>
      api.post<ApiResponse<TechnicalTest>>("/technical-tests", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.technicalTests }),
  });
}

export function useStartTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      api.post<ApiResponse<TechnicalTest>>(`/technical-tests/${testId}/start`),
    onSuccess: (_, testId) => {
      qc.invalidateQueries({ queryKey: queryKeys.technicalTest(testId) });
      qc.invalidateQueries({ queryKey: queryKeys.technicalTests });
    },
  });
}

export function useSubmitTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      testId,
      submission,
    }: {
      testId: string;
      submission: string;
    }) =>
      api.post<ApiResponse<TechnicalTest>>(
        `/technical-tests/${testId}/submit`,
        {
          submission,
        }
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.technicalTest(vars.testId) });
      qc.invalidateQueries({ queryKey: queryKeys.technicalTests });
    },
  });
}

export function useDeleteTechnicalTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => api.delete(`/technical-tests/${testId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.technicalTests }),
  });
}

// === AI Usage ===
export function useAiUsage() {
  return useQuery({
    queryKey: queryKeys.aiUsage,
    queryFn: () => api.get<ApiResponse<AiUsageStatus>>("/auth/ai-usage"),
  });
}

// === Billing ===
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: queryKeys.subscriptionStatus,
    queryFn: () => api.get<ApiResponse<SubscriptionStatus>>("/billing/status"),
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: () =>
      api.post<ApiResponse<{ url: string }>>("/billing/checkout"),
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () => api.post<ApiResponse<{ url: string }>>("/billing/portal"),
  });
}
