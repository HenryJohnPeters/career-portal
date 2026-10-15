import { Check, Crown } from "lucide-react";
import { TEMPLATE_OPTIONS } from "@careerportal/shared/types/cv-templates";
import { FREE_TIER, isFreeTemplate, type TemplateId } from "@careerportal/shared/types";
import { requestUpgrade } from "@careerportal/web/data-access";
import { TEMPLATE_SKETCHES } from "./templateSketches";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (id: TemplateId) => void;
  /** Premium: every template. Free: FREE_TIER.templateIds (the API enforces the same). */
  allTemplates: boolean;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  allTemplates,
}: TemplateSelectorProps) {
  const selectedLocked = !allTemplates && !isFreeTemplate(selectedTemplate);

  return (
    <div className="space-y-3">
      <h3 id="cv-template-heading" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Template
      </h3>

      {!allTemplates && (
        <p className="text-[11px] text-accent-700 dark:text-accent-400 flex items-center gap-1">
          <Crown className="h-3 w-3" aria-hidden="true" />
          {FREE_TIER.templateIds.length} templates are free. Premium unlocks all{" "}
          {TEMPLATE_OPTIONS.length}.
        </p>
      )}
      {selectedLocked && (
        <p role="status" className="text-[11px] text-amber-700 dark:text-amber-400">
          This CV uses a Premium template. It stays as it is, but once you switch to a free
          template you'll need Premium to switch back.
        </p>
      )}

      <div className="relative">
        <div className="overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1">
          <div role="group" aria-labelledby="cv-template-heading" className="flex gap-3 min-w-max">
            {TEMPLATE_OPTIONS.map((t) => {
              const isActive = selectedTemplate === t.id;
              const isLocked = !allTemplates && !isFreeTemplate(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${t.name}${isLocked ? " (Premium)" : ""}: ${t.description}`}
                  onClick={() => {
                    if (isActive) return;
                    if (isLocked) {
                      requestUpgrade({ reason: "premium_required", feature: "templates" });
                    } else {
                      onSelectTemplate(t.id);
                    }
                  }}
                  className={`relative group text-left rounded-lg border-2 transition-all duration-150 overflow-hidden w-[160px] flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive
                      ? "border-accent ring-2 ring-accent/30 dark:ring-accent/40 bg-accent-muted/10 dark:bg-accent-muted/20"
                      : isLocked
                        ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-accent-300"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  {isLocked && (
                    <span className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-accent-100 dark:bg-accent-900/60 px-2 py-0.5">
                      <Crown className="h-3 w-3 text-accent-600 dark:text-accent-400" aria-hidden="true" />
                      <span className="text-[9px] font-semibold text-accent-700 dark:text-accent-300">
                        Premium
                      </span>
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={`block h-20 border-b ${isLocked ? "opacity-60" : ""} ${
                      isActive
                        ? "border-accent-muted/50 text-accent"
                        : "border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {TEMPLATE_SKETCHES[t.id]}
                  </span>
                  <span className="block p-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isActive ? "text-accent-dark dark:text-accent" : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {t.name}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-accent" aria-hidden="true" />}
                    </span>
                    <span className="block text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2">
                      {t.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none"
        />
      </div>
    </div>
  );
}
