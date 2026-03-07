import { FileText, List, Palette, Code2 } from "lucide-react";
import { Spinner, ErrorState, ConfirmDialog } from "@careerportal/web/ui";
import { PageHero } from "../shared";
import { useAuth } from "../../lib/auth";
import { useCvBuilder } from "./hooks/useCvBuilder";
import { VersionSidebar } from "./components/VersionSidebar";
import { VersionToolbar } from "./components/VersionToolbar";
import { LivePreview } from "./components/LivePreview";
import { HtmlEditor } from "./components/HtmlEditor";
import { HtmlPreview } from "./components/HtmlPreview";
import { SectionEditor } from "./components/SectionEditor";
import { EmptyVersionState } from "./components/EmptyVersionState";
import { TemplateSelector } from "./components/TemplateSelector";
import { ThemeCustomiser } from "./components/ThemeCustomiser";
import { ContactPanel } from "./components/ContactPanel";
import { RawTextCvPanel } from "./components/RawTextCvPanel";

const DESIGN_TABS = [
  { key: "sections" as const, label: "Sections", icon: List },
  { key: "design" as const, label: "Design", icon: Palette },
  { key: "html" as const, label: "HTML", icon: Code2 },
] as const;

export function CvBuilderPage() {
  const cv = useCvBuilder();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;

  if (cv.isLoading) return <Spinner />;
  if (cv.isError)
    return (
      <ErrorState message={(cv.error as Error).message} onRetry={cv.refetch} />
    );

  const sidebarSpan =
    cv.selectedVersion && cv.showPreview ? "lg:col-span-2" : "lg:col-span-3";
  const editorSpan =
    cv.selectedVersion && cv.showPreview ? "lg:col-span-5" : "lg:col-span-9";

  return (
    <div className="space-y-6">
      <PageHero
        icon={FileText}
        title="CV Builder"
        subtitle="Create and manage multiple CV versions. Organize your sections, reorder content, and keep your resume polished."
        stats={[
          {
            value: cv.versions.length,
            label: `Version${cv.versions.length !== 1 ? "s" : ""}`,
          },
          {
            value: cv.versions.filter((v) => v.isActive).length,
            label: "Active",
          },
        ]}
      />

      {cv.selectedVersion && (
        <VersionToolbar
          version={cv.selectedVersion}
          sections={cv.sections}
          showPreview={cv.showPreview}
          onTogglePreview={() => cv.setShowPreview((p) => !p)}
          onPreviewPdf={cv.handlePreviewPdf}
          onDownloadPdf={cv.handleDownloadPdf}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Version sidebar */}
        <div className={`${sidebarSpan} space-y-4`}>
          <VersionSidebar
            versions={cv.versions}
            selectedVersionId={cv.selectedVersionId}
            showCreateVersion={cv.showCreateVersion}
            newVersionTitle={cv.newVersionTitle}
            createVersionPending={cv.createVersionPending}
            renamingVersionId={cv.renamingVersionId}
            renameTitle={cv.renameTitle}
            isPremium={isPremium}
            onSelectVersion={cv.setSelectedVersionId}
            onNewVersionTitleChange={cv.setNewVersionTitle}
            onShowCreateVersion={cv.setShowCreateVersion}
            onCreateVersion={cv.handleCreateVersion}
            onRenameTitleChange={cv.setRenameTitle}
            onRenameSubmit={cv.handleRename}
            onRenameCancel={() => {
              cv.setRenamingVersionId(null);
              cv.setRenameTitle("");
            }}
            onStartRename={(v) => {
              cv.setRenamingVersionId(v.id);
              cv.setRenameTitle(v.title);
            }}
            onSetActive={cv.handleSetActive}
            onDelete={cv.handleDeleteVersion}
            onDuplicate={cv.handleDuplicateVersion}
          />
        </div>

        {/* Main editor area */}
        <div className={editorSpan}>
          {cv.selectedVersion ? (
            <div className="space-y-4">
              {/* Tab bar */}
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-1 gap-1">
                {DESIGN_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => cv.setDesignTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        cv.designTab === tab.key
                          ? "bg-gradient-to-br from-accent-dark/10 to-accent/10 dark:from-accent-dark/20 dark:to-accent/20 text-accent-dark dark:text-accent shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Sections tab */}
              {cv.designTab === "sections" && (
                <div className="space-y-4">
                  <RawTextCvPanel
                    versionId={cv.selectedVersion.id}
                    existingSections={cv.sections}
                    onComplete={() => cv.refetchPreview()}
                  />
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5">
                    <ContactPanel
                      name={cv.selectedVersion.name || user?.name || ""}
                      email={cv.selectedVersion.email || user?.email || ""}
                      photoUrl={cv.selectedVersion.photoUrl || ""}
                      phone={cv.selectedVersion.phone || ""}
                      location={cv.selectedVersion.location || ""}
                      website={cv.selectedVersion.website || ""}
                      linkedin={cv.selectedVersion.linkedin || ""}
                      github={cv.selectedVersion.github || ""}
                      headerLayout={cv.selectedVersion.headerLayout || "split"}
                      onUpdateContact={cv.handleUpdateContact}
                    />
                  </div>
                  <SectionEditor
                    selectedVersion={cv.selectedVersion}
                    sections={cv.sections}
                    editingSectionId={cv.editingSectionId}
                    sectionEdits={cv.sectionEdits}
                    newSectionTitle={cv.newSectionTitle}
                    createSectionPending={cv.createSectionPending}
                    updateSectionPending={cv.updateSectionPending}
                    autoSaveStatus={cv.autoSaveStatus}
                    collapsedSections={cv.collapsedSections}
                    showTemplates={cv.showTemplates}
                    onNewSectionTitleChange={cv.setNewSectionTitle}
                    onAddSection={cv.handleAddSection}
                    onAddFromTemplate={cv.handleAddFromTemplate}
                    onEditChange={cv.setSectionEdits}
                    onStartEdit={cv.startEditSection}
                    onSaveSection={cv.handleSaveSection}
                    onCancelEdit={cv.handleCancelEditSection}
                    onDeleteSection={cv.handleDeleteSection}
                    onMoveSection={(id, direction) =>
                      cv.moveSection.mutate({ id, direction })
                    }
                    onReorderSections={cv.handleReorderSections}
                    onToggleCollapse={cv.toggleSectionCollapse}
                    onShowTemplates={cv.setShowTemplates}
                  />
                </div>
              )}

              {/* Design tab */}
              {cv.designTab === "design" && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 space-y-6">
                  <TemplateSelector
                    selectedTemplate={
                      cv.selectedVersion.templateId || "classic"
                    }
                    onSelectTemplate={cv.handleUpdateTemplate}
                    isPremium={isPremium}
                  />
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                  <ThemeCustomiser
                    themeConfig={cv.resolvedThemeConfig}
                    onUpdateTheme={cv.handleUpdateTheme}
                  />
                </div>
              )}

              {/* HTML tab */}
              {cv.designTab === "html" && (
                <HtmlEditor
                  html={cv.previewHtml}
                  isLoading={cv.isPreviewLoading}
                  isFetching={cv.isPreviewFetching}
                  onRefresh={() => cv.refetchPreview()}
                  onHtmlChange={(html) => cv.setEditedHtml(html)}
                />
              )}
            </div>
          ) : (
            <EmptyVersionState />
          )}
        </div>

        {/* Right preview column */}
        {cv.selectedVersion && cv.showPreview && (
          <div className="lg:col-span-5">
            {cv.designTab === "html" ? (
              <HtmlPreview
                iframeRef={cv.iframeRef}
                html={cv.editedHtml || cv.previewHtml || ""}
                isLoading={cv.isPreviewLoading}
                isFetching={cv.isPreviewFetching}
                onRefresh={() => cv.refetchPreview()}
                onFullPreview={cv.handlePreviewPdf}
              />
            ) : (
              <LivePreview
                iframeRef={cv.iframeRef}
                previewHtml={cv.previewHtml}
                previewSrcDoc={cv.previewSrcDoc}
                isPreviewLoading={cv.isPreviewLoading}
                isPreviewFetching={cv.isPreviewFetching}
                onRefresh={() => cv.refetchPreview()}
                onFullPreview={cv.handlePreviewPdf}
              />
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cv.confirmDialog.open}
        title={cv.confirmDialog.title}
        message={cv.confirmDialog.message}
        variant={cv.confirmDialog.variant}
        onConfirm={cv.confirmDialog.onConfirm}
        onCancel={() => cv.setConfirmDialog((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
