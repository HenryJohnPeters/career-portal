import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Pencil, RotateCcw, Save, Undo2 } from "lucide-react";
import { CV_LIMITS, type CvSection } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import type { SectionDraftSaver } from "../hooks/useSectionDraft";
import { useStoreSelector } from "../hooks/useStoreSelector";
import { BOLD, ITALIC } from "../lib/markdown-format";
import { MarkdownToolbar, formatTextarea } from "./MarkdownToolbar";
import { AiSectionAssist } from "./AiSectionAssist";
import { SaveStatus } from "./SaveStatus";

const FORMAT_TIPS = ["**bold**", "*italic*", "- bullet list", "### subheading", "[link](url)"];

/**
 * The section open in the editor. Only this card subscribes to the draft text,
 * so typing re-renders it alone, not the whole builder.
 */
export function SectionEditCard({
  section,
  index,
  drafts,
}: {
  section: CvSection;
  index: number;
  drafts: SectionDraftSaver;
}) {
  const draft = useStoreSelector(drafts, (s) => s.draft);
  const status = useStoreSelector(drafts, (s) => s.status);
  const error = useStoreSelector(drafts, (s) => s.error);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ids = useId();
  const [closing, setClosing] = useState(false);
  /** Text replaced by the last AI apply, for a one-step undo. */
  const [undoText, setUndoText] = useState<string | null>(null);

  if (!draft || draft.id !== section.id) return null;
  const { title, content } = draft.fields;

  const setContent = (value: string) => drafts.edit({ content: value });
  /** Typing makes the AI undo stale: it would also throw away the new text. */
  const typeContent = (value: string) => {
    setUndoText(null);
    setContent(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key !== "b" && key !== "i") return;
    event.preventDefault();
    formatTextarea(event.currentTarget, content, key === "b" ? BOLD : ITALIC, typeContent);
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await drafts.close();
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-accent bg-white dark:bg-gray-800 shadow-xl shadow-accent/10 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted/30 dark:bg-accent-muted/20 text-accent-dark dark:text-accent">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent-dark dark:text-accent">
            Editing section {index + 1}
          </span>
        </div>
        <SaveStatus status={status} error={error} onRetry={() => void drafts.flush()} />
      </div>

      <div className="px-5 pb-5 space-y-3">
        <label htmlFor={`${ids}-title`} className="sr-only">
          Section title
        </label>
        <input
          id={`${ids}-title`}
          value={title}
          onChange={(e) => {
            setUndoText(null);
            drafts.edit({ title: e.target.value });
          }}
          maxLength={CV_LIMITS.sectionTitle}
          aria-invalid={!title.trim() || undefined}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all"
          placeholder="Section title"
        />

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all">
          <MarkdownToolbar textareaRef={textareaRef} value={content} onChange={typeContent} />
          <label htmlFor={`${ids}-content`} className="sr-only">
            Section content (Markdown)
          </label>
          <textarea
            id={`${ids}-content`}
            ref={textareaRef}
            value={content}
            onChange={(e) => typeContent(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={CV_LIMITS.sectionContent}
            rows={10}
            aria-describedby={`${ids}-count`}
            className="w-full bg-white dark:bg-gray-700/50 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed focus:outline-none resize-y min-h-[180px]"
            placeholder={"Write your section content here...\n\nSupports: **bold**, *italic*, - bullet lists, ### subheadings, [links](url)"}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500 dark:text-gray-400" aria-hidden="true">
            {FORMAT_TIPS.map((tip) => (
              <span key={tip} className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">
                {tip}
              </span>
            ))}
          </div>
          <span
            id={`${ids}-count`}
            className={`text-[10px] tabular-nums ${
              content.length > CV_LIMITS.sectionContent * 0.9 ? "text-amber-600 dark:text-amber-400" : "text-text-tertiary"
            }`}
          >
            {content.length.toLocaleString("en-GB")}/{CV_LIMITS.sectionContent.toLocaleString("en-GB")} characters
          </span>
        </div>

        {undoText !== null && (
          <div role="status" className="flex items-center justify-between gap-2 rounded-lg border border-primary-500/20 bg-primary-500/5 px-3 py-2 text-xs text-text-secondary">
            <span>AI text applied.</span>
            <button
              type="button"
              onClick={() => {
                setContent(undoText);
                setUndoText(null);
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-300 hover:underline"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              Undo
            </button>
          </div>
        )}

        <AiSectionAssist
          sectionId={section.id}
          sectionTitle={title || section.title}
          currentContent={content}
          onBeforeGenerate={() => void drafts.flush()}
          onApply={(next) => {
            setUndoText(content);
            setContent(next);
          }}
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" onClick={() => void handleClose()} loading={closing}>
            {!closing && <Save className="h-3.5 w-3.5" aria-hidden="true" />}
            Save & close
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void drafts.discard()}
            disabled={closing}
            title="Restore this section as it was when you opened it"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Discard changes
          </Button>
          <span className="flex-1" />
          <span className="text-[10px] text-text-tertiary">Auto-saves as you type</span>
        </div>
      </div>
    </div>
  );
}
