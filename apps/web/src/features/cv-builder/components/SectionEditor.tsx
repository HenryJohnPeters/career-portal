import { memo, useCallback, useRef, useState, type HTMLAttributes } from "react";
import { LayoutTemplate, Plus, Sparkles } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CV_LIMITS, type CvSection } from "@careerportal/shared/types";
import { inferSectionType } from "@careerportal/shared/types/cv-templates";
import {
  useCreateCvSection,
  useMoveCvSection,
  useReorderCvSections,
} from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import type { SectionDraftSaver } from "../hooks/useSectionDraft";
import { useStoreSelector } from "../hooks/useStoreSelector";
import { SECTION_TEMPLATES, type SectionTemplate } from "../sectionTemplates";
import { SectionCard } from "./SectionCard";
import { SectionEditCard } from "./SectionEditCard";
import { SectionTemplatePanel } from "./SectionTemplatePanel";

interface SortableItemProps {
  section: CvSection;
  index: number;
  totalSections: number;
  isEditing: boolean;
  isCollapsed: boolean;
  moveDisabled: boolean;
  drafts: SectionDraftSaver;
  onStartEdit: (section: CvSection) => void;
  onDelete: (section: CvSection) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onToggleCollapse: (id: string) => void;
}

/** Memoised: typing in the open section must not re-render every other card. */
const SortableSection = memo(function SortableSection({
  isEditing,
  drafts,
  ...props
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.section.id,
    disabled: isEditing,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" : undefined,
      }}
    >
      {isEditing ? (
        <SectionEditCard section={props.section} index={props.index} drafts={drafts} />
      ) : (
        <SectionCard
          {...props}
          isDragging={isDragging}
          dragHandleProps={{ ...attributes, ...listeners } as HTMLAttributes<HTMLButtonElement>}
        />
      )}
    </li>
  );
});

interface SectionEditorProps {
  versionId: string;
  sections: CvSection[];
  drafts: SectionDraftSaver;
  onDelete: (section: CvSection) => void;
}

/** Section list (drag to reorder), the open section's editor, and "add section". */
export function SectionEditor({ versionId, sections, drafts, onDelete }: SectionEditorProps) {
  const editingId = useStoreSelector(drafts, (s) => s.draft?.id ?? null);
  const createSection = useCreateCvSection();
  const adding = useRef(false);
  const moveSection = useMoveCvSection();
  const reorderSections = useReorderCvSections();

  const [newTitle, setNewTitle] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  const atSectionLimit = sections.length >= CV_LIMITS.maxSectionsPerVersion;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const startEdit = useCallback(
    (section: CvSection) =>
      drafts.open(section.id, { title: section.title, content: section.content }),
    [drafts],
  );

  const moveMutate = moveSection.mutate;
  const move = useCallback(
    (id: string, direction: "up" | "down") => moveMutate({ id, direction }),
    [moveMutate],
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    if (from === -1 || to === -1) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    reorderSections.mutate({ versionId, sectionIds: reordered.map((s) => s.id) });
  };

  const addSection = async (input: { title: string; content?: string; sectionType: string }) => {
    // A ref, not mutation state: a double click lands before the re-render.
    if (atSectionLimit || adding.current) return false;
    adding.current = true;
    try {
      const res = await createSection.mutateAsync({ versionId, ...input });
      startEdit(res.data);
      return true;
    } catch {
      return false; // Toasted by the global handler.
    } finally {
      adding.current = false;
    }
  };

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    if (await addSection({ title, sectionType: inferSectionType(title) })) setNewTitle("");
  };

  const handleAddTemplate = async (template: SectionTemplate) => {
    const added = await addSection({
      title: template.title,
      content: template.content,
      sectionType: template.sectionType,
    });
    if (added) setShowTemplates(false);
  };

  const moveDisabled = moveSection.isPending || reorderSections.isPending;

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
            <Sparkles className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No sections yet</p>
          <p className="text-xs text-text-tertiary mt-1 mb-4">
            Add sections below, start from a template, or use the AI brain dump above.
          </p>
          <Button size="sm" onClick={() => setShowTemplates(true)}>
            <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
            Browse templates
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2" aria-label="CV sections">
              {sections.map((section, index) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  index={index}
                  totalSections={sections.length}
                  isEditing={editingId === section.id}
                  isCollapsed={collapsed.has(section.id)}
                  moveDisabled={moveDisabled}
                  drafts={drafts}
                  onStartEdit={startEdit}
                  onDelete={onDelete}
                  onMove={move}
                  onToggleCollapse={toggleCollapse}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {showTemplates && (
        <SectionTemplatePanel
          templates={SECTION_TEMPLATES}
          disabled={atSectionLimit || createSection.isPending}
          onSelect={(template) => void handleAddTemplate(template)}
          onClose={() => setShowTemplates(false)}
        />
      )}

      <form
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
      >
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </div>
          <label htmlFor={`new-section-${versionId}`} className="sr-only">
            New section title
          </label>
          <input
            id={`new-section-${versionId}`}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={CV_LIMITS.sectionTitle}
            disabled={atSectionLimit}
            placeholder={
              atSectionLimit
                ? `A CV can have up to ${CV_LIMITS.maxSectionsPerVersion} sections`
                : "Add a section (e.g. Work Experience, Skills, Education…)"
            }
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            {!showTemplates && (
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-accent-dark dark:hover:text-accent hover:border-accent-muted transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Browse section templates"
              >
                <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Templates</span>
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              loading={createSection.isPending}
              disabled={!newTitle.trim() || atSectionLimit}
            >
              {!createSection.isPending && <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              Add
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
