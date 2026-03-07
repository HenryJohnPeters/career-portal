import { TEMPLATE_OPTIONS } from "@careerportal/shared/types/cv-templates";
import type { TemplateId } from "@careerportal/shared/types";
import { Crown } from "lucide-react";

const FREE_TEMPLATE_LIMIT = 5;

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (id: TemplateId) => void;
  isPremium?: boolean;
}

const layoutSketches: Record<string, React.ReactNode> = {
  classic: (
    <div className="flex flex-col gap-1 w-full h-full p-1.5">
      <div className="h-3 bg-current opacity-30 rounded-sm w-3/4" />
      <div className="h-1 bg-current opacity-15 rounded-sm w-full" />
      <div className="flex-1 flex flex-col gap-0.5 mt-1">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/3" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/3 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-4/5" />
      </div>
    </div>
  ),
  modern: (
    <div className="flex w-full h-full">
      <div className="w-[30%] bg-current opacity-[0.07] p-1 flex flex-col gap-0.5 border-r border-current/20">
        <div className="h-1.5 bg-current opacity-30 rounded-sm w-3/4" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-2/3" />
        <div className="mt-1 h-1 bg-current opacity-20 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/2" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  minimal: (
    <div className="flex flex-col gap-1.5 w-full h-full p-2">
      <div className="h-3 bg-current opacity-15 rounded-sm w-1/2" />
      <div className="flex-1 flex flex-col gap-1 mt-1">
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/4" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-3/4" />
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/4 mt-1.5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  executive: (
    <div className="flex flex-col w-full h-full">
      <div className="bg-current opacity-20 p-1.5 flex flex-col gap-0.5">
        <div className="h-2.5 bg-white/60 rounded-sm w-2/3" />
        <div className="h-1 bg-white/40 rounded-sm w-full" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  creative: (
    <div className="flex w-full h-full">
      <div className="w-[35%] bg-gradient-to-b from-current/20 to-current/30 p-1 flex flex-col gap-0.5">
        <div className="h-2 bg-white/50 rounded-sm w-3/4 mx-auto" />
        <div className="h-1 bg-white/30 rounded-sm w-full" />
        <div className="h-1 bg-white/30 rounded-sm w-2/3" />
        <div className="mt-1 flex flex-wrap gap-0.5">
          <div className="h-1 w-3 bg-white/25 rounded-sm" />
          <div className="h-1 w-4 bg-white/25 rounded-sm" />
          <div className="h-1 w-3 bg-white/25 rounded-sm" />
        </div>
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/3 px-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full border-l-2 border-current/20 pl-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6 border-l-2 border-current/20 pl-1" />
        <div className="h-1.5 bg-current opacity-25 rounded-sm w-1/3 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  compact: (
    <div className="flex flex-col w-full h-full p-1">
      <div className="h-2 bg-current opacity-25 rounded-sm w-1/2 mb-1" />
      <div className="flex-1 grid grid-cols-2 gap-1">
        <div className="flex flex-col gap-0.5">
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-5/6" />
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3 mt-0.5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-4/5" />
          <div className="h-1 bg-current opacity-20 rounded-sm w-2/3 mt-0.5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
        </div>
      </div>
    </div>
  ),
  developer: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gray-900/5">
      <div className="h-2.5 bg-current opacity-20 rounded-sm w-2/3 font-mono" />
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
      <div className="flex-1 flex flex-col gap-0.5 mt-1 border border-current/10 rounded p-1">
        <div className="h-1 bg-current opacity-15 rounded-sm w-1/3" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-5/6" />
        <div className="h-1 bg-current opacity-15 rounded-sm w-1/3 mt-0.5" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
      </div>
    </div>
  ),
  elegant: (
    <div className="flex flex-col gap-1 w-full h-full p-2">
      <div className="h-3 bg-current opacity-15 rounded-sm w-1/2 mx-auto" />
      <div className="h-px bg-current opacity-20 w-1/3 mx-auto" />
      <div className="flex-1 flex flex-col gap-0.5 mt-1">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/4 italic" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-4/5" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-1/4 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  bold: (
    <div className="flex flex-col w-full h-full">
      <div className="bg-current opacity-25 p-1.5">
        <div className="h-3 bg-white/70 rounded-sm w-3/4" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-current opacity-30 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-2 bg-current opacity-30 rounded-sm w-2/5 mt-0.5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  academic: (
    <div className="flex flex-col gap-0.5 w-full h-full p-2">
      <div className="h-2.5 bg-current opacity-20 rounded-sm w-1/2 mx-auto" />
      <div className="h-0.5 bg-current opacity-10 rounded-sm w-2/3 mx-auto" />
      <div className="h-px bg-current opacity-30 w-full mt-1 mb-1" />
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/3" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-5/6" />
        <div className="h-1 bg-current opacity-20 rounded-sm w-1/3 mt-0.5" />
        <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
      </div>
    </div>
  ),
  startup: (
    <div className="flex flex-col w-full h-full">
      <div className="bg-gradient-to-r from-current/20 to-current/10 p-1.5 rounded-b-lg">
        <div className="h-2.5 bg-white/60 rounded-full w-2/3" />
        <div className="h-1 bg-white/30 rounded-full w-full mt-0.5" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-1">
        <div className="h-1.5 bg-current opacity-20 rounded-full w-1/3" />
        <div className="border border-current/10 rounded-lg p-1 flex flex-col gap-0.5">
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-4/5" />
        </div>
      </div>
    </div>
  ),
  infographic: (
    <div className="flex w-full h-full">
      <div className="w-[32%] bg-current opacity-[0.07] p-1 flex flex-col gap-1 border-r border-current/20">
        <div className="h-2 w-2 rounded-full bg-current opacity-25 mx-auto" />
        <div className="h-1 bg-current opacity-20 rounded-full w-full" />
        <div className="h-1 bg-current opacity-15 rounded-full w-3/4" />
        <div className="h-1 bg-current opacity-20 rounded-full w-full mt-1" />
        <div className="h-1 bg-current opacity-12 rounded-full w-1/2" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  nordic: (
    <div className="flex flex-col gap-1 w-full h-full p-2.5 bg-gray-50/50">
      <div className="h-2.5 bg-current opacity-12 rounded-sm w-1/3" />
      <div className="h-px bg-current opacity-8 w-full" />
      <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
        <div className="h-1.5 bg-current opacity-15 rounded-sm w-1/4" />
        <div className="h-1 bg-current opacity-8 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-8 rounded-sm w-3/4" />
        <div className="h-1.5 bg-current opacity-15 rounded-sm w-1/4 mt-1" />
        <div className="h-1 bg-current opacity-8 rounded-sm w-full" />
      </div>
    </div>
  ),
  timeline: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5">
      <div className="h-2.5 bg-current opacity-20 rounded-sm w-1/2 mb-1" />
      <div className="flex-1 flex gap-1.5">
        <div className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
          <div className="flex-1 w-px bg-current opacity-15" />
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
          <div className="flex-1 w-px bg-current opacity-15" />
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/3" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/3 mt-1" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full" />
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/3 mt-1" />
        </div>
      </div>
    </div>
  ),
  magazine: (
    <div className="flex w-full h-full">
      <div className="w-[40%] p-1.5 flex flex-col gap-0.5 border-r border-current/10">
        <div className="h-3 bg-current opacity-25 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-3/4" />
        <div className="mt-1 p-1 border-l-2 border-current/20">
          <div className="h-0.5 bg-current opacity-15 rounded-sm w-full" />
          <div className="h-0.5 bg-current opacity-15 rounded-sm w-2/3 mt-0.5" />
        </div>
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-0.5">
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-5/6" />
        <div className="h-1.5 bg-current opacity-20 rounded-sm w-2/5 mt-1" />
        <div className="h-1 bg-current opacity-10 rounded-sm w-full" />
      </div>
    </div>
  ),
  terminal: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gray-900/90 rounded-sm">
      <div className="flex gap-0.5 mb-0.5">
        <div className="w-1 h-1 rounded-full bg-red-400/60" />
        <div className="w-1 h-1 rounded-full bg-yellow-400/60" />
        <div className="w-1 h-1 rounded-full bg-green-400/60" />
      </div>
      <div className="h-1 bg-green-400/30 rounded-sm w-2/3" />
      <div className="h-0.5 bg-green-400/20 rounded-sm w-full" />
      <div className="h-0.5 bg-green-400/15 rounded-sm w-5/6" />
      <div className="h-1 bg-green-400/30 rounded-sm w-1/3 mt-0.5" />
      <div className="h-0.5 bg-green-400/20 rounded-sm w-full" />
      <div className="h-0.5 bg-green-400/15 rounded-sm w-4/5" />
    </div>
  ),
  gradient: (
    <div className="flex flex-col gap-0.5 w-full h-full p-1.5 bg-gradient-to-br from-current/10 to-current/5">
      <div className="h-2.5 bg-current opacity-20 rounded-lg w-2/3" />
      <div className="h-1 bg-current opacity-10 rounded-lg w-full" />
      <div className="flex-1 flex flex-col gap-1 mt-0.5">
        <div className="border border-current/10 rounded-lg p-1 bg-white/50">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full mt-0.5" />
        </div>
        <div className="border border-current/10 rounded-lg p-1 bg-white/50">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-8 rounded-sm w-full mt-0.5" />
        </div>
      </div>
    </div>
  ),
  architect: (
    <div className="flex flex-col gap-1 w-full h-full p-1.5">
      <div className="h-2.5 bg-current opacity-25 rounded-sm w-1/2 border-l-2 border-current/40 pl-1" />
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="border border-current/20 rounded-sm p-1">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full mt-0.5" />
        </div>
        <div className="border border-current/20 rounded-sm p-1">
          <div className="h-1 bg-current opacity-15 rounded-sm w-2/5" />
          <div className="h-0.5 bg-current opacity-10 rounded-sm w-full mt-0.5" />
        </div>
      </div>
    </div>
  ),
};

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  isPremium = false,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Template
      </h3>

      {!isPremium && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Free accounts can use the first {FREE_TEMPLATE_LIMIT} templates.
          Upgrade to Premium for all.
        </p>
      )}

      {/* Scrollable template grid */}
      <div className="relative">
        <div className="overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1">
          <div className="flex gap-3 min-w-max">
            {TEMPLATE_OPTIONS.map((t, index) => {
              const isActive = selectedTemplate === t.id;
              const isLocked = !isPremium && index >= FREE_TEMPLATE_LIMIT;
              return (
                <button
                  key={t.id}
                  onClick={() => !isLocked && onSelectTemplate(t.id)}
                  disabled={isLocked}
                  className={`relative group text-left rounded-lg border-2 transition-all duration-150 overflow-hidden w-[160px] flex-shrink-0 ${
                    isLocked
                      ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-60 cursor-not-allowed"
                      : isActive
                      ? "border-accent ring-2 ring-accent/30 dark:ring-accent/40 bg-accent-muted/10 dark:bg-accent-muted/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  {/* Lock overlay for premium templates */}
                  {isLocked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/10 dark:bg-gray-900/30 rounded-lg">
                      <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5">
                        <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                          Premium
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Layout sketch */}
                  <div
                    className={`h-20 border-b ${
                      isActive
                        ? "border-accent-muted/50 dark:border-accent-muted/50 text-accent"
                        : "border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {layoutSketches[t.id]}
                  </div>
                  {/* Label */}
                  <div className="p-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isActive
                            ? "text-accent-dark dark:text-accent"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {t.name}
                      </span>
                      {isActive && (
                        <svg
                          className="w-3.5 h-3.5 text-accent"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Scroll indicator gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
