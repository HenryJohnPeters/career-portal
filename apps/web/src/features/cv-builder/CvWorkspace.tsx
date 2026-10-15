import { useCallback, useState } from "react";
import { LayoutList, List, Palette, Target, User } from "lucide-react";
import type { CvSection, CvVersion } from "@careerportal/shared/types";
import {
  useCvHtmlPreview,
  useCvSections,
  useDeleteCvSection,
  useDownloadCvPdf,
} from "@careerportal/web/data-access";
import { ConfirmDialog } from "@careerportal/web/ui";
import { useAuth } from "../../lib/auth";
import { usePlanStatus } from "../ai-assist";
import { useCvDesign } from "./hooks/useCvDesign";
import { usePdfExport } from "./hooks/usePdfExport";
import { useSectionDraft } from "./hooks/useSectionDraft";
import { useUnsavedChangesGuard } from "./hooks/useUnsavedChangesGuard";
import { ContactPanel } from "./components/ContactPanel";
import { LivePreview } from "./components/LivePreview";
import { MatchPanel } from "./components/MatchPanel";
import { RawTextCvPanel } from "./components/RawTextCvPanel";
import { SectionEditor } from "./components/SectionEditor";
import { TabBar, tabPanelProps, type TabItem } from "./components/TabBar";
import { TemplateSelector } from "./components/TemplateSelector";
import { ThemeCustomiser } from "./components/ThemeCustomiser";
import { VersionToolbar } from "./components/VersionToolbar";

type WorkspaceTab = "content" | "design" | "match";
type ContentTab = "contact" | "sections";

const WORKSPACE_TABS: readonly TabItem<WorkspaceTab>[] = [
  { key: "content", label: "Content", icon: List },
  { key: "design", label: "Design", icon: Palette },
  { key: "match", label: "Match", icon: Target },
];

const CONTENT_TABS: readonly TabItem<ContentTab>[] = [
  { key: "contact", label: "Contact info", icon: User },
  { key: "sections", label: "Sections", icon: LayoutList },
];

const PANEL_CLASS =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5";

/**
 * Editor + live preview for one CV version. Rendered with `key={version.id}`,
 * so switching versions unmounts it, which saves every pending edit.
 */
export function CvWorkspace({ version, onBack }: { version: CvVersion; onBack: () => void }) {
  const { user } = useAuth();
  const plan = usePlanStatus();
  const { data: sectionsData } = useCvSections(version.id);
  const sections = sectionsData?.data ?? [];
  const preview = useCvHtmlPreview(version.id);
  const deleteSection = useDeleteCvSection();
  const downloadPdf = useDownloadCvPdf();
  const drafts = useSectionDraft();
  const design = useCvDesign(version);

  const [showPreview, setShowPreview] = useState(true);
  const [tab, setTab] = useState<WorkspaceTab>("content");
  const [contentTab, setContentTab] = useState<ContentTab>(
    version.name || (version.sections?.length ?? 0) > 0 ? "sections" : "contact",
  );
  const [pendingDelete, setPendingDelete] = useState<CvSection | null>(null);
  const [leaveBlocked, setLeaveBlocked] = useState(false);

  const flushDesign = design.flush;
  const designUnsaved = design.hasUnsavedChanges;
  /** Save every pending edit (sections, contact, theme). True when the server has it all. */
  const flushAll = useCallback(async () => {
    const [sectionsSaved, designSaved] = await Promise.all([drafts.flush(), flushDesign()]);
    return sectionsSaved && designSaved;
  }, [drafts, flushDesign]);
  const hasUnsavedChanges = useCallback(
    () => drafts.hasUnsavedChanges() || designUnsaved(),
    [drafts, designUnsaved],
  );
  useUnsavedChangesGuard(hasUnsavedChanges, flushAll);

  const downloadMutate = downloadPdf.mutateAsync;
  const fetchPdf = useCallback(() => downloadMutate(version.id), [downloadMutate, version.id]);
  const pdf = usePdfExport(fetchPdf, flushAll);

  const handleBack = async () => {
    if (await flushAll()) onBack();
    else setLeaveBlocked(true);
  };

  const editSection = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      setTab("content");
      setContentTab("sections");
      drafts.open(section.id, { title: section.title, content: section.content });
    },
    [sections, drafts],
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    drafts.forget(pendingDelete.id);
    try {
      await deleteSection.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Toasted; the dialog stays open to retry.
    }
  };

  const hasContent = sections.some((s) => s.content.trim().length > 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      <VersionToolbar
        version={version}
        sections={sections}
        showPreview={showPreview}
        pdfBusy={pdf.busy}
        onBack={() => void handleBack()}
        onTogglePreview={() => setShowPreview((p) => !p)}
        onPreviewPdf={() => void pdf.preview()}
        onDownloadPdf={() => void pdf.download()}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
        <div className={showPreview ? "xl:col-span-5" : "xl:col-span-12"}>
          <div className="space-y-3 sm:space-y-4">
            <RawTextCvPanel
              versionId={version.id}
              hasContent={hasContent}
              hasSnapshot={version.hasSnapshot}
              beforeReplace={flushAll}
              onReplaced={() => drafts.reset()}
            />

            <TabBar tabs={WORKSPACE_TABS} active={tab} onChange={setTab} idPrefix="cv-workspace" label="CV editor" />

            {tab === "content" && (
              <div {...tabPanelProps("cv-workspace", "content")} className="space-y-4">
                <TabBar
                  tabs={CONTENT_TABS}
                  active={contentTab}
                  onChange={setContentTab}
                  idPrefix="cv-content"
                  label="Content"
                  variant="secondary"
                />
                {contentTab === "contact" ? (
                  <div {...tabPanelProps("cv-content", "contact")} className={PANEL_CLASS}>
                    <ContactPanel
                      version={version}
                      accountName={user?.name ?? ""}
                      accountEmail={user?.email ?? ""}
                      buffer={design.contact}
                    />
                  </div>
                ) : (
                  <div {...tabPanelProps("cv-content", "sections")}>
                    <SectionEditor
                      versionId={version.id}
                      sections={sections}
                      drafts={drafts}
                      onDelete={setPendingDelete}
                    />
                  </div>
                )}
              </div>
            )}

            {tab === "design" && (
              <div {...tabPanelProps("cv-workspace", "design")} className={`${PANEL_CLASS} space-y-6`}>
                <TemplateSelector
                  selectedTemplate={version.templateId || "classic"}
                  onSelectTemplate={design.setTemplate}
                  allTemplates={plan.allTemplates}
                />
                <div className="border-t border-gray-200 dark:border-gray-700" />
                <ThemeCustomiser theme={design.resolvedTheme} onChange={design.updateTheme} />
              </div>
            )}

            {tab === "match" && (
              <div {...tabPanelProps("cv-workspace", "match")} className={PANEL_CLASS}>
                <MatchPanel
                  versionId={version.id}
                  sections={sections}
                  prepare={flushAll}
                  onEditSection={editSection}
                />
              </div>
            )}
          </div>
        </div>

        {showPreview && (
          <div className="xl:col-span-7 h-[75vh] xl:h-[calc(100vh-7rem)] xl:sticky xl:top-4">
            <LivePreview
              html={preview.data}
              isLoading={preview.isLoading}
              isFetching={preview.isFetching}
              error={preview.error}
              onRefresh={() => void preview.refetch()}
              onFullPreview={() => void pdf.preview()}
              fullPreviewBusy={pdf.busy !== null}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this section?"
        description={`"${pendingDelete?.title ?? ""}" will be removed from this CV. This can't be undone.`}
        destructive
        loading={deleteSection.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={leaveBlocked}
        title="Leave without saving?"
        description="Some of your latest changes couldn't be saved. If you leave now they'll be lost."
        confirmLabel="Leave anyway"
        cancelLabel="Stay and fix"
        onConfirm={() => {
          setLeaveBlocked(false);
          onBack();
        }}
        onCancel={() => setLeaveBlocked(false)}
      />
    </div>
  );
}
