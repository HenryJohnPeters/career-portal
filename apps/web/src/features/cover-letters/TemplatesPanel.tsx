import { LayoutTemplate } from "lucide-react";
import { COVER_LETTER_TEMPLATES } from "./coverLetterTemplates";

/** Starter letters. Applying one replaces the body (the editor offers Undo). */
export function TemplatesPanel({ onApply }: { onApply: (label: string, title: string, body: string) => void }) {
  return (
    <section
      aria-labelledby="cover-letter-templates-heading"
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-accent">
          <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <h3
          id="cover-letter-templates-heading"
          className="text-xs font-bold uppercase tracking-wider text-text-secondary"
        >
          Start from a template
        </h3>
      </div>
      <p className="text-[11px] text-text-tertiary leading-relaxed">
        Pre-fill the editor, then customise it for the role.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {COVER_LETTER_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onApply(`the “${tpl.label}” template`, tpl.title, tpl.body)}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 text-left transition-all duration-200 hover:border-accent/40 hover:bg-accent-muted/20 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span className="text-base leading-none shrink-0" aria-hidden="true">
              {tpl.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold truncate text-text-primary">{tpl.label}</span>
              <span className="block text-[10px] text-text-tertiary truncate">{tpl.description}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
