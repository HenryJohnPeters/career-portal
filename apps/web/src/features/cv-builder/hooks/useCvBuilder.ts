import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  useCvVersions,
  useCreateCvVersion,
  useUpdateCvVersion,
  useDeleteCvVersion,
  useDuplicateCvVersion,
  useCvSections,
  useCreateCvSection,
  useUpdateCvSection,
  useDeleteCvSection,
  useMoveCvSection,
  useReorderCvSections,
  useCvHtmlPreview,
} from "@careerportal/web/data-access";
import { supabase } from "@careerportal/web/data-access";
import type {
  CvVersion,
  CvSection,
  ThemeConfig,
  TemplateId,
} from "@careerportal/shared/types";
import {
  DEFAULT_THEME_CONFIG,
  inferSectionType,
} from "@careerportal/shared/types/cv-templates";
import type { SectionTemplate } from "../sectionTemplates";

export type { SectionTemplate };

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ── Auto-save debounce helper ────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ── Main hook ────────────────────────────────────── */
export function useCvBuilder() {
  // ── Version state ──
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [newVersionTitle, setNewVersionTitle] = useState("");
  const [renamingVersionId, setRenamingVersionId] = useState<string | null>(
    null
  );
  const [renameTitle, setRenameTitle] = useState("");
  const [showCreateVersion, setShowCreateVersion] = useState(false);

  // ── Section state ──
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEdits, setSectionEdits] = useState<{
    title: string;
    content: string;
  }>({ title: "", content: "" });
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [showTemplates, setShowTemplates] = useState(false);

  // ── Design tab state ──
  const [designTab, setDesignTab] = useState<
    "sections" | "design" | "contact" | "html"
  >("sections");

  // ── Preview state ──
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editedHtml, setEditedHtml] = useState<string>("");

  // ── Confirmation dialog state ──
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "danger",
    onConfirm: () => {},
  });

  // ── Auto-save ──
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const debouncedEdits = useDebounce(sectionEdits, 1500);
  const lastSavedRef = useRef<string>("");

  // ── Queries & mutations ──
  const {
    data: versionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCvVersions();
  const createVersion = useCreateCvVersion();
  const updateVersion = useUpdateCvVersion();
  const deleteVersion = useDeleteCvVersion();
  const duplicateVersion = useDuplicateCvVersion();

  const { data: sectionsData } = useCvSections(selectedVersionId);
  const createSection = useCreateCvSection();
  const updateSection = useUpdateCvSection();
  const deleteSection = useDeleteCvSection();
  const moveSection = useMoveCvSection();
  const reorderSections = useReorderCvSections();

  const {
    data: previewHtml,
    isLoading: isPreviewLoading,
    isFetching: isPreviewFetching,
    refetch: refetchPreview,
  } = useCvHtmlPreview(selectedVersionId);

  // ── Derived data ──
  const versions: CvVersion[] = versionsData?.data || [];
  const sections: CvSection[] = sectionsData?.data || [];
  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) ?? null;

  // ── Resolve theme config from selected version ──
  const resolvedThemeConfig: ThemeConfig = useMemo(() => {
    if (!selectedVersion) return DEFAULT_THEME_CONFIG;
    const tc = selectedVersion.themeConfig as Partial<ThemeConfig> | undefined;
    return { ...DEFAULT_THEME_CONFIG, ...tc };
  }, [selectedVersion]);

  // ── Completeness ──
  const completeness = useMemo(() => {
    if (!sections.length) return 0;
    const filled = sections.filter((s) => s.content.trim().length > 20).length;
    return Math.round((filled / sections.length) * 100);
  }, [sections]);

  // ── Preview src doc – fit content to width ──
  const previewSrcDoc = useMemo(() => {
    if (!previewHtml) return "";
    return previewHtml.replace(
      "</style>",
      `
      body {
        width: 100%;
        overflow-x: hidden;
      }
      </style>`
    );
  }, [previewHtml]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.scrollTo(0, 0);
    }
  }, [previewSrcDoc]);

  // ── Auto-save effect ──
  useEffect(() => {
    if (!editingSectionId) return;
    const key = `${editingSectionId}:${debouncedEdits.title}:${debouncedEdits.content}`;
    if (key === lastSavedRef.current) return;
    if (!debouncedEdits.title.trim()) return;

    setAutoSaveStatus("saving");
    updateSection
      .mutateAsync({ id: editingSectionId, ...debouncedEdits })
      .then(() => {
        lastSavedRef.current = key;
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      })
      .catch(() => setAutoSaveStatus("idle"));
  }, [debouncedEdits, editingSectionId]);

  // ── Version handlers ──
  const handleCreateVersion = async () => {
    if (!newVersionTitle.trim()) return;
    const res = await createVersion.mutateAsync({ title: newVersionTitle });
    setNewVersionTitle("");
    setSelectedVersionId(res.data.id);
    setShowCreateVersion(false);
  };

  const handleRename = async (id: string) => {
    if (!renameTitle.trim()) return;
    await updateVersion.mutateAsync({ id, title: renameTitle });
    setRenamingVersionId(null);
    setRenameTitle("");
  };

  const handleSetActive = (id: string) =>
    updateVersion.mutate({ id, isActive: true });

  const handleDeleteVersion = (id: string) => {
    const version = versions.find((v) => v.id === id);
    setConfirmDialog({
      open: true,
      title: "Delete CV Version",
      message: `Are you sure you want to delete "${
        version?.title || "this version"
      }"? This action cannot be undone and all sections will be permanently lost.`,
      variant: "danger",
      onConfirm: async () => {
        await deleteVersion.mutateAsync(id);
        if (selectedVersionId === id) setSelectedVersionId(null);
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleDuplicateVersion = async (id: string) => {
    const res = await duplicateVersion.mutateAsync(id);
    setSelectedVersionId(res.data.id);
  };

  // ── Template / Theme / Contact handlers ──
  const handleUpdateTemplate = useCallback(
    (templateId: TemplateId) => {
      if (!selectedVersionId) return;
      updateVersion.mutate({ id: selectedVersionId, templateId });
    },
    [selectedVersionId, updateVersion]
  );

  const handleUpdateTheme = useCallback(
    (partial: Partial<ThemeConfig>) => {
      if (!selectedVersionId) return;
      const merged = { ...resolvedThemeConfig, ...partial };
      updateVersion.mutate({ id: selectedVersionId, themeConfig: merged });
    },
    [selectedVersionId, resolvedThemeConfig, updateVersion]
  );

  const handleUpdateContact = useCallback(
    (fields: Record<string, string>) => {
      if (!selectedVersionId) return;
      updateVersion.mutate({ id: selectedVersionId, ...fields });
    },
    [selectedVersionId, updateVersion]
  );

  // ── Section handlers ──
  const handleAddSection = async () => {
    if (!selectedVersionId || !newSectionTitle.trim()) return;
    const sectionType = inferSectionType(newSectionTitle);
    await createSection.mutateAsync({
      versionId: selectedVersionId,
      title: newSectionTitle,
      sectionType,
    });
    setNewSectionTitle("");
  };

  const handleAddFromTemplate = async (template: SectionTemplate) => {
    if (!selectedVersionId) return;
    await createSection.mutateAsync({
      versionId: selectedVersionId,
      title: template.title,
      content: template.content,
      sectionType: template.sectionType,
    });
    setShowTemplates(false);
  };

  const startEditSection = (s: CvSection) => {
    if (editingSectionId && editingSectionId !== s.id) {
      const key = `${editingSectionId}:${sectionEdits.title}:${sectionEdits.content}`;
      if (key !== lastSavedRef.current && sectionEdits.title.trim()) {
        updateSection.mutate({ id: editingSectionId, ...sectionEdits });
      }
    }
    setEditingSectionId(s.id);
    setSectionEdits({ title: s.title, content: s.content });
    lastSavedRef.current = `${s.id}:${s.title}:${s.content}`;
  };

  const handleSaveSection = async () => {
    if (!editingSectionId) return;
    await updateSection.mutateAsync({ id: editingSectionId, ...sectionEdits });
    lastSavedRef.current = `${editingSectionId}:${sectionEdits.title}:${sectionEdits.content}`;
    setEditingSectionId(null);
    setAutoSaveStatus("idle");
  };

  const handleCancelEditSection = () => {
    setEditingSectionId(null);
    setAutoSaveStatus("idle");
  };

  const handleDeleteSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    setConfirmDialog({
      open: true,
      title: "Delete Section",
      message: `Delete "${
        section?.title || "this section"
      }"? This cannot be undone.`,
      variant: "danger",
      onConfirm: async () => {
        await deleteSection.mutateAsync(id);
        if (editingSectionId === id) setEditingSectionId(null);
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };

  const toggleSectionCollapse = useCallback((id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleReorderSections = async (newOrder: string[]) => {
    if (!selectedVersionId) return;
    await reorderSections.mutateAsync({
      versionId: selectedVersionId,
      sectionIds: newOrder,
    });
  };

  // ── PDF handlers ──
  const handlePreviewPdf = async () => {
    if (!selectedVersionId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`${API_BASE_URL}/pdf/cv/${selectedVersionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (!win) alert("Please allow pop-ups to preview the PDF.");
    } catch (e) {
      console.error("PDF preview error", e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedVersionId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `${API_BASE_URL}/pdf/cv/${selectedVersionId}?download=1`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv-${selectedVersionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      console.error("PDF download error", e);
    }
  };

  return {
    // Loading / error
    isLoading,
    isError,
    error,
    refetch,

    // Versions
    versions,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
    newVersionTitle,
    setNewVersionTitle,
    showCreateVersion,
    setShowCreateVersion,
    renamingVersionId,
    setRenamingVersionId,
    renameTitle,
    setRenameTitle,
    createVersionPending: createVersion.isPending,
    handleCreateVersion,
    handleRename,
    handleSetActive,
    handleDeleteVersion,
    handleDuplicateVersion,

    // Sections
    sections,
    editingSectionId,
    sectionEdits,
    setSectionEdits,
    newSectionTitle,
    setNewSectionTitle,
    createSectionPending: createSection.isPending,
    updateSectionPending: updateSection.isPending,
    handleAddSection,
    handleAddFromTemplate,
    startEditSection,
    handleSaveSection,
    handleCancelEditSection,
    handleDeleteSection,
    deleteSection,
    moveSection,
    handleReorderSections,
    collapsedSections,
    toggleSectionCollapse,
    showTemplates,
    setShowTemplates,

    // Template / Theme / Contact
    designTab,
    setDesignTab,
    resolvedThemeConfig,
    handleUpdateTemplate,
    handleUpdateTheme,
    handleUpdateContact,

    // Auto-save
    autoSaveStatus,

    // Completeness
    completeness,

    // Preview
    showPreview,
    setShowPreview,
    iframeRef,
    previewHtml,
    previewSrcDoc,
    isPreviewLoading,
    isPreviewFetching,
    refetchPreview,
    editedHtml,
    setEditedHtml,

    // PDF
    handlePreviewPdf,
    handleDownloadPdf,

    // Confirmation dialog
    confirmDialog,
    setConfirmDialog,
  };
}
