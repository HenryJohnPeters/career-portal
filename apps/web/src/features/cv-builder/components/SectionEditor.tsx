import { useState } from "react";
import { Plus, Sparkles, LayoutTemplate, ChevronsUpDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@careerportal/web/ui";
import type { CvVersion, CvSection } from "@careerportal/shared/types";
import { SectionCard } from "./SectionCard";
import { SectionTemplatePanel } from "./SectionTemplatePanel";
import { SECTION_TEMPLATES } from "../sectionTemplates";
import type { SectionTemplate } from "../sectionTemplates";

/* ── Sortable wrapper ─────────────────────────────── */
function SortableSectionCard(props: {
  section: CvSection;
  index: number;
  totalSections: number;
  isEditing: boolean;
  isCollapsed: boolean;
  sectionEdits: { title: string; content: string };
  updatePending: boolean;
  autoSaveStatus: "idle" | "saving" | "saved";
  onEditChange: (edits: { title: string; content: string }) => void;
  onStartEdit: (section: CvSection) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onToggleCollapse: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SectionCard
        {...props}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

/* ── Props ─────────────────────────────────────────── */
interface SectionEditorProps {
  selectedVersion: CvVersion;
  sections: CvSection[];
  editingSectionId: string | null;
  sectionEdits: { title: string; content: string };
  newSectionTitle: string;
  createSectionPending: boolean;
  updateSectionPending: boolean;
  autoSaveStatus: "idle" | "saving" | "saved";
  collapsedSections: Set<string>;
  showTemplates: boolean;
  onNewSectionTitleChange: (value: string) => void;
  onAddSection: () => void;
  onAddFromTemplate: (template: SectionTemplate) => void;
  onEditChange: (edits: { title: string; content: string }) => void;
  onStartEdit: (section: CvSection) => void;
  onSaveSection: () => void;
  onCancelEdit: () => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onReorderSections: (newOrder: string[]) => void;
  onToggleCollapse: (id: string) => void;
  onShowTemplates: (show: boolean) => void;
}

export function SectionEditor({
  selectedVersion,
  sections,
  editingSectionId,
  sectionEdits,
  newSectionTitle,
  createSectionPending,
  updateSectionPending,
  autoSaveStatus,
  collapsedSections,
  showTemplates,
  onNewSectionTitleChange,
  onAddSection,
  onAddFromTemplate,
  onEditChange,
  onStartEdit,
  onSaveSection,
  onCancelEdit,
  onDeleteSection,
  onMoveSection,
  onReorderSections,
  onToggleCollapse,
  onShowTemplates,
}: SectionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorderSections(reordered.map((s) => s.id));
  };

  const [allCollapsed, setAllCollapsed] = useState(false);
  const toggleAll = () => {
    if (allCollapsed) {
      sections.forEach((s) => {
        if (collapsedSections.has(s.id)) onToggleCollapse(s.id);
      });
    } else {
      sections.forEach((s) => {
        if (!collapsedSections.has(s.id)) onToggleCollapse(s.id);
      });
    }
    setAllCollapsed(!allCollapsed);
  };

  return (
    <div className="space-y-4">
      {/* ── Section list with drag-and-drop ────────── */}
      {sections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
            <Sparkles className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No sections yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">
            Add sections manually or choose from templates below
          </p>
          <Button size="sm" onClick={() => onShowTemplates(true)}>
            <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
            Browse Templates
          </Button>
        </div>
      ) : (
        <>
          {/* Collapse all toggle */}
          {/* {sections.length > 2 && (
            <div className="flex justify-end">
              <button
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronsUpDown className="h-3 w-3" />
                {allCollapsed ? "Expand All" : "Collapse All"}
              </button>
            </div>
          )} */}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map((s, idx) => (
                  <SortableSectionCard
                    key={s.id}
                    section={s}
                    index={idx}
                    totalSections={sections.length}
                    isEditing={editingSectionId === s.id}
                    isCollapsed={collapsedSections.has(s.id)}
                    sectionEdits={sectionEdits}
                    updatePending={updateSectionPending}
                    autoSaveStatus={
                      editingSectionId === s.id ? autoSaveStatus : "idle"
                    }
                    onEditChange={onEditChange}
                    onStartEdit={onStartEdit}
                    onSave={onSaveSection}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDeleteSection}
                    onMove={onMoveSection}
                    onToggleCollapse={onToggleCollapse}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* ── Template panel ─────────────────────────── */}
      {showTemplates && (
        <SectionTemplatePanel
          templates={SECTION_TEMPLATES}
          onSelect={onAddFromTemplate}
          onClose={() => onShowTemplates(false)}
        />
      )}

      {/* ── Add section bar ────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400">
            <Plus className="h-4 w-4" />
          </div>
          <input
            value={newSectionTitle}
            onChange={(e) => onNewSectionTitleChange(e.target.value)}
            placeholder="Add a new section (e.g. Work Experience, Skills, Education…)"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && onAddSection()}
          />
          <div className="flex items-center gap-1.5">
            {!showTemplates && (
              <button
                onClick={() => onShowTemplates(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-accent-dark dark:hover:text-accent hover:border-accent-muted dark:hover:border-accent-muted/60 hover:bg-accent-muted/10 transition-all"
                title="Browse section templates"
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Templates</span>
              </button>
            )}
            <Button
              onClick={onAddSection}
              size="sm"
              loading={createSectionPending}
              disabled={!newSectionTitle.trim()}
              className={!newSectionTitle.trim() ? "opacity-50" : ""}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
