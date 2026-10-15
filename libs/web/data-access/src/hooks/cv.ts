import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  AiFullCvResult,
  AiWritingAction,
  ApiResponse,
  ApplyCvContentRequest,
  CvSection,
  CvVersion,
  UpdateCvVersionRequest,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, PDF_TIMEOUT_MS, api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

type VersionsData = ApiResponse<CvVersion[]>;
type SectionsData = ApiResponse<CvSection[]>;

const byOrder = (a: CvSection, b: CvSection) => a.order - b.order;

/** Replace one version in the cached list (merging, so fields the response omits survive). */
function mergeVersion(qc: QueryClient, version: CvVersion) {
  qc.setQueryData<VersionsData>(
    queryKeys.cvVersions,
    (old) =>
      old && {
        ...old,
        data: old.data.map((v) => (v.id === version.id ? { ...v, ...version } : v)),
      },
  );
}

/** Write a version's sections into both the sections query and the embedded copy in the versions list. */
function setVersionSections(
  qc: QueryClient,
  versionId: string,
  update: (sections: CvSection[]) => CvSection[],
) {
  qc.setQueryData<SectionsData>(
    queryKeys.cvSections(versionId),
    (old) => old && { ...old, data: update(old.data) },
  );
  qc.setQueryData<VersionsData>(
    queryKeys.cvVersions,
    (old) =>
      old && {
        ...old,
        data: old.data.map((v) =>
          v.id === versionId ? { ...v, sections: update(v.sections ?? []) } : v,
        ),
      },
  );
}

function refreshPreview(qc: QueryClient, versionId: string) {
  return qc.invalidateQueries({ queryKey: queryKeys.cvHtmlPreview(versionId) });
}

/** After a whole-version write (apply content / restore snapshot). */
function storeFullVersion(qc: QueryClient, version: CvVersion) {
  mergeVersion(qc, version);
  if (version.sections) {
    qc.setQueryData<SectionsData>(queryKeys.cvSections(version.id), (old) => ({
      ...(old ?? {}),
      data: [...version.sections].sort(byOrder),
    }));
  }
  void refreshPreview(qc, version.id);
  void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
}

// === Versions ===

export function useCvVersions() {
  return useQuery({
    queryKey: queryKeys.cvVersions,
    queryFn: ({ signal }) => api.get<VersionsData>("/cv/versions", { signal }),
  });
}

export function useCreateCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string }) =>
      api.post<ApiResponse<CvVersion>>("/cv/versions", data),
    onSuccess: () => {
      void invalidateUsage(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      return qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
    },
  });
}

export function useUpdateCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateCvVersionRequest) =>
      api.patch<ApiResponse<CvVersion>>(`/cv/versions/${id}`, data),
    onSuccess: (res, vars) => {
      if (vars.isActive !== undefined) {
        // The server toggles the other versions' isActive too.
        void qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
      } else {
        mergeVersion(qc, res.data);
      }
      void refreshPreview(qc, vars.id);
      if (vars.title !== undefined) {
        // Titles appear on job cards, insights and recent activity.
        void qc.invalidateQueries({ queryKey: queryKeys.jobs });
        void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      }
    },
  });
}

export function useDeleteCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cv/versions/${id}`),
    onSuccess: (_res, id) => {
      qc.setQueryData<VersionsData>(
        queryKeys.cvVersions,
        (old) => old && { ...old, data: old.data.filter((v) => v.id !== id) },
      );
      qc.removeQueries({ queryKey: queryKeys.cvSections(id) });
      qc.removeQueries({ queryKey: queryKeys.cvHtmlPreview(id) });
      void invalidateUsage(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs });
      return qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
    },
  });
}

export function useDuplicateCvVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ApiResponse<CvVersion>>(`/cv/versions/${id}/duplicate`),
    onSuccess: () => {
      void invalidateUsage(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      return qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
    },
  });
}

/**
 * PUT /cv/versions/:id/content — replace contact + all sections in one
 * transaction (the previous content becomes the undo snapshot).
 */
export function useApplyCvContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, ...data }: { versionId: string } & ApplyCvContentRequest) =>
      api.put<ApiResponse<CvVersion>>(`/cv/versions/${versionId}/content`, data),
    onSuccess: (res) => storeFullVersion(qc, res.data),
  });
}

/** POST /cv/versions/:id/restore-snapshot — undo the last apply (404 when there is none). */
export function useRestoreCvSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      api.post<ApiResponse<CvVersion>>(`/cv/versions/${versionId}/restore-snapshot`),
    onSuccess: (res) => storeFullVersion(qc, res.data),
  });
}

// === Sections ===

export function useCvSections(versionId: string | null) {
  return useQuery({
    queryKey: queryKeys.cvSections(versionId),
    queryFn: ({ signal }) =>
      api.get<SectionsData>(`/cv/versions/${versionId}/sections`, { signal }),
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
      api.post<ApiResponse<CvSection>>(`/cv/versions/${versionId}/sections`, data),
    onSuccess: (res, vars) => {
      setVersionSections(qc, vars.versionId, (sections) =>
        [...sections.filter((s) => s.id !== res.data.id), res.data].sort(byOrder),
      );
      void refreshPreview(qc, vars.versionId);
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
    onSuccess: (res) => {
      const section = res.data;
      setVersionSections(qc, section.cvVersionId, (sections) =>
        sections.map((s) => (s.id === section.id ? { ...s, ...section } : s)),
      );
      void refreshPreview(qc, section.cvVersionId);
    },
  });
}

/** The version a cached section belongs to (sections are deleted by id alone). */
function findSectionVersionId(qc: QueryClient, sectionId: string): string | null {
  for (const [, data] of qc.getQueriesData<SectionsData>({
    queryKey: queryKeys.cvSectionsAll,
  })) {
    const match = data?.data?.find((s) => s.id === sectionId);
    if (match) return match.cvVersionId;
  }
  return null;
}

export function useDeleteCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cv/sections/${id}`),
    onSuccess: (_res, id) => {
      const versionId = findSectionVersionId(qc, id);
      if (!versionId) {
        void qc.invalidateQueries({ queryKey: queryKeys.cvSectionsAll });
        void qc.invalidateQueries({ queryKey: queryKeys.cvHtmlPreviewAll });
        return;
      }
      setVersionSections(qc, versionId, (sections) =>
        sections.filter((s) => s.id !== id),
      );
      void refreshPreview(qc, versionId);
    },
  });
}

/** Store the full ordered list the move/reorder endpoints return. */
function storeOrderedSections(qc: QueryClient, sections: CvSection[], versionId?: string) {
  const id = versionId ?? sections[0]?.cvVersionId;
  if (!id) {
    void qc.invalidateQueries({ queryKey: queryKeys.cvSectionsAll });
    void qc.invalidateQueries({ queryKey: queryKeys.cvHtmlPreviewAll });
    return;
  }
  setVersionSections(qc, id, () => [...sections].sort(byOrder));
  void refreshPreview(qc, id);
}

export function useMoveCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) =>
      api.post<ApiResponse<CvSection[]>>(`/cv/sections/${id}/move`, {
        direction,
      }),
    onSuccess: (res) => storeOrderedSections(qc, res.data),
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
        { sectionIds },
      ),
    // Optimistic: show the new order immediately so drag-and-drop doesn't snap back.
    onMutate: async ({ versionId, sectionIds }) => {
      await qc.cancelQueries({ queryKey: queryKeys.cvSections(versionId) });
      const previous = qc.getQueryData<SectionsData>(queryKeys.cvSections(versionId));
      const position = new Map(sectionIds.map((id, index) => [id, index]));
      setVersionSections(qc, versionId, (sections) =>
        sections
          .map((s) => (position.has(s.id) ? { ...s, order: position.get(s.id)! } : s))
          .sort(byOrder),
      );
      return { previous };
    },
    onError: (_err, { versionId }, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.cvSections(versionId), context.previous);
      }
      void qc.invalidateQueries({ queryKey: queryKeys.cvVersions });
    },
    onSuccess: (res, vars) => storeOrderedSections(qc, res.data, vars.versionId),
  });
}

// === Preview & PDF ===

export function useCvHtmlPreview(versionId: string | null) {
  return useQuery({
    queryKey: queryKeys.cvHtmlPreview(versionId),
    queryFn: ({ signal }) =>
      api.getText(`/pdf/cv/${versionId}/html`, { signal, timeoutMs: PDF_TIMEOUT_MS }),
    enabled: !!versionId,
    staleTime: 0,
  });
}

/** GET /pdf/cv/:id?download=1 → PDF Blob plus the server's "<Name> - CV.pdf" filename. */
export function useDownloadCvPdf() {
  return useMutation({
    mutationFn: async (versionId: string): Promise<{ blob: Blob; filename: string }> => {
      const { blob, filename } = await api.getBlobWithFilename(
        `/pdf/cv/${versionId}?download=1`,
        { timeoutMs: PDF_TIMEOUT_MS },
      );
      return { blob, filename: filename ?? "CV.pdf" };
    },
  });
}

// === AI ===

export function useAiGenerateCvSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      ...data
    }: {
      sectionId: string;
      action: AiWritingAction;
      jobTitle?: string;
      jobDescription?: string;
      /** The editor text (≤15000); the server prefers it over the saved content. */
      currentContent?: string;
    }) =>
      api.post<ApiResponse<{ content: string }>>(
        `/cv/sections/${sectionId}/ai-generate`,
        data,
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}

/** Generates a full CV from pasted text; nothing is saved until the result is applied (useApplyCvContent). */
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
      jobDescription?: string;
    }) =>
      api.post<ApiResponse<AiFullCvResult>>(
        `/cv/versions/${versionId}/ai-generate-full`,
        data,
        { timeoutMs: AI_TIMEOUT_MS },
      ),
    onSettled: () => {
      void invalidateUsage(qc);
    },
  });
}
