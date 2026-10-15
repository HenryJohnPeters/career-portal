import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  AiWritingAction,
  ApiResponse,
  CoverLetter,
  CoverLetterAiContext,
  CoverLetterSummary,
  CoverLetterTone,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, PDF_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";
import type { MutationUiOptions } from "./cv";

type LettersData = ApiResponse<CoverLetter[]>;

const uiMeta = (options: MutationUiOptions = {}) =>
  options.silent ? { silent: true } : undefined;

/** Letters appear in pickers, on job cards and in recent activity. */
function invalidateLetterViews(qc: QueryClient, opts: { jobs?: boolean } = {}) {
  void qc.invalidateQueries({ queryKey: queryKeys.coverLetterSummaries });
  void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
  if (opts.jobs) void qc.invalidateQueries({ queryKey: queryKeys.jobs });
}

/** Path of a cover-letter PDF. `cvVersionId` picks the CV whose theme/contact is used as letterhead. */
export function coverLetterPdfPath(
  id: string,
  opts: { cvVersionId?: string | null; download?: boolean; html?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (opts.cvVersionId) params.set("cvVersionId", opts.cvVersionId);
  if (opts.download) params.set("download", "1");
  const query = params.toString();
  return `/pdf/cover-letter/${id}${opts.html ? "/html" : ""}${query ? `?${query}` : ""}`;
}

/** GET /cover-letters — full letters (with bodies). */
export function useCoverLetters() {
  return useQuery({
    queryKey: queryKeys.coverLetters,
    queryFn: ({ signal }) => api.get<LettersData>("/cover-letters", { signal }),
  });
}

/** GET /cover-letters?summary=1 — id/title/jobId/updatedAt only, for pickers. */
export function useCoverLetterSummaries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.coverLetterSummaries,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<CoverLetterSummary[]>>("/cover-letters?summary=1", {
        signal,
      }),
    enabled,
  });
}

export function useCreateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body?: string; jobId?: string | null }) =>
      api.post<ApiResponse<CoverLetter>>("/cover-letters", data),
    onSuccess: (res, vars) => {
      // Show the new letter straight away (the editor opens it from the cache).
      qc.setQueryData<LettersData>(
        queryKeys.coverLetters,
        (old) =>
          old && {
            ...old,
            data: [res.data, ...old.data.filter((l) => l.id !== res.data.id)],
          },
      );
      void invalidateUsage(qc);
      invalidateLetterViews(qc, { jobs: !!vars.jobId });
      return qc.invalidateQueries({ queryKey: queryKeys.coverLetters, exact: true });
    },
  });
}

/** PATCH /cover-letters/:id. Saves run one at a time, in the order they were made. */
export function useUpdateCoverLetter(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    scope: { id: "cover-letter-save" },
    meta: uiMeta(options),
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      body?: string;
      /** null unlinks the job */
      jobId?: string | null;
    }) => api.patch<ApiResponse<CoverLetter>>(`/cover-letters/${id}`, data),
    onSuccess: (res, vars) => {
      qc.setQueryData<LettersData>(
        queryKeys.coverLetters,
        (old) =>
          old && {
            ...old,
            data: old.data.map((l) => (l.id === res.data.id ? { ...l, ...res.data } : l)),
          },
      );
      void qc.invalidateQueries({
        queryKey: [...queryKeys.coverLetterHtmlPreviewAll, vars.id],
      });
      invalidateLetterViews(qc, {
        jobs: vars.jobId !== undefined || vars.title !== undefined,
      });
    },
  });
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cover-letters/${id}`),
    onSuccess: (_res, id) => {
      qc.setQueryData<LettersData>(
        queryKeys.coverLetters,
        (old) => old && { ...old, data: old.data.filter((l) => l.id !== id) },
      );
      qc.removeQueries({ queryKey: [...queryKeys.coverLetterHtmlPreviewAll, id] });
      void invalidateUsage(qc);
      invalidateLetterViews(qc, { jobs: true });
      return qc.invalidateQueries({ queryKey: queryKeys.coverLetters, exact: true });
    },
  });
}

// === AI ===

/** POST /cover-letters/:id/suggest — accepts the id alone or the id plus editor context. */
export function useSuggestCoverLetter(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: (arg: string | ({ id: string } & CoverLetterAiContext)) => {
      const { id, ...context } = typeof arg === "string" ? { id: arg } : arg;
      return api.post<ApiResponse<string[]>>(
        `/cover-letters/${id}/suggest`,
        Object.keys(context).length > 0 ? context : undefined,
        { timeoutMs: AI_TIMEOUT_MS },
      );
    },
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

export function useRewriteCoverLetter(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: ({
      id,
      ...data
    }: { id: string; tone?: CoverLetterTone } & CoverLetterAiContext) =>
      api.post<ApiResponse<string>>(`/cover-letters/${id}/rewrite`, data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

export function useAiGenerateCoverLetter(options: MutationUiOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    meta: uiMeta(options),
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      action: AiWritingAction;
      jobTitle?: string;
      companyName?: string;
      companyUrl?: string;
      jobDescription?: string;
      tone?: CoverLetterTone;
      cvVersionId?: string;
    } & CoverLetterAiContext) =>
      api.post<ApiResponse<{ content: string }>>(
        `/cover-letters/${id}/ai-generate`,
        data,
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

// === Preview & PDF ===

/** GET /pdf/cover-letter/:id/html — letterhead uses `cvVersionId`'s theme/contact when given. */
export function useCoverLetterHtmlPreview(
  id: string | null,
  cvVersionId?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.coverLetterHtmlPreview(id, cvVersionId),
    queryFn: ({ signal }) =>
      api.getText(coverLetterPdfPath(id as string, { cvVersionId, html: true }), {
        signal,
        timeoutMs: PDF_TIMEOUT_MS,
      }),
    enabled: !!id,
  });
}

/** GET /pdf/cover-letter/:id?download=1 → PDF Blob plus the server's filename. */
export function useDownloadCoverLetterPdf() {
  return useMutation({
    mutationFn: async ({
      id,
      cvVersionId,
    }: {
      id: string;
      cvVersionId?: string | null;
    }): Promise<{ blob: Blob; filename: string }> => {
      const { blob, filename } = await api.getBlobWithFilename(
        coverLetterPdfPath(id, { cvVersionId, download: true }),
        { timeoutMs: PDF_TIMEOUT_MS },
      );
      return { blob, filename: filename ?? "Cover Letter.pdf" };
    },
  });
}
