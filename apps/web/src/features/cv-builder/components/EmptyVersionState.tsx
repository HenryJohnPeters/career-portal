import { FileText, ChevronRight } from "lucide-react";

export function EmptyVersionState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-bg-tertiary flex items-center justify-center">
          <FileText className="h-10 w-10 text-text-tertiary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
          <ChevronRight className="h-4 w-4 text-white" />
        </div>
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
        Select a CV version
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Choose a version from the left panel to view and edit its sections
      </p>
    </div>
  );
}
