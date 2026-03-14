import { X, Plus } from "lucide-react";
import type { SectionTemplate } from "../hooks/useCvBuilder";

interface SectionTemplatePanelProps {
  templates: SectionTemplate[];
  onSelect: (template: SectionTemplate) => void;
  onClose: () => void;
}

export function SectionTemplatePanel({
  templates,
  onSelect,
  onClose,
}: SectionTemplatePanelProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated shadow-sm overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-accent-muted/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Quick-Add from Template
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Pre-filled sections to get you started fast
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {templates.map((t) => (
          <button
            key={t.title}
            onClick={() => onSelect(t)}
            className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3 text-left hover:border-accent dark:hover:border-accent hover:shadow-sm transition-all duration-150"
          >
            <span className="text-lg leading-none mt-0.5">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-dark dark:group-hover:text-accent transition-colors">
                {t.title}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                {t.description}
              </p>
            </div>
            <Plus className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-accent dark:group-hover:text-accent transition-colors mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
