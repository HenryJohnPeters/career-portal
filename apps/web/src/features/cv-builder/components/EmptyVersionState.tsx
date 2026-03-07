import { FileText, ChevronRight } from "lucide-react";

export function EmptyVersionState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
          <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-accent-dark flex items-center justify-center shadow-lg shadow-accent/30">
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
