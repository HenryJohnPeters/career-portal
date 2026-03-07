import { ChevronDown } from "lucide-react";
import type { TechCategory } from "@careerportal/shared/types";

interface TopicAccordionProps {
  categories: TechCategory[];
  selectedTags: string[];
  expandedCategories: Set<string>;
  onToggleTag: (tag: string) => void;
  onToggleCategory: (key: string) => void;
}

export function TopicAccordion({
  categories,
  selectedTags,
  expandedCategories,
  onToggleTag,
  onToggleCategory,
}: TopicAccordionProps) {
  if (categories.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-600 italic py-2">
        No topic filters available for this configuration.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const isOpen = expandedCategories.has(cat.key);
        const catSelectedCount = cat.items.filter((item) =>
          selectedTags.includes(item)
        ).length;

        return (
          <div
            key={cat.key}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-shadow hover:shadow-sm"
          >
            <button
              onClick={() => onToggleCategory(cat.key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {cat.label}
                </span>
                {catSelectedCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-accent-muted text-accent rounded-full">
                    {catSelectedCount}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {cat.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => onToggleTag(item)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 ${
                      selectedTags.includes(item)
                        ? "bg-accent-dark text-white border-accent-dark shadow-sm shadow-accent/25"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
