import type { LucideIcon } from "lucide-react";
import { Target, Wand2, Zap } from "lucide-react";
import type { AiWritingAction } from "@careerportal/shared/types";

interface ActionCopy {
  label: string;
  hint: string;
  icon: LucideIcon;
}

/** Generate / Improve / Tailor. Improve and Tailor need existing text to work on. */
export function AiActionGrid({
  hasContent,
  disabled,
  onAction,
  regenerateHint = "Start fresh",
  size = "sm",
}: {
  hasContent: boolean;
  disabled: boolean;
  onAction: (action: AiWritingAction) => void;
  regenerateHint?: string;
  size?: "sm" | "md";
}) {
  const actions: Record<AiWritingAction, ActionCopy> = {
    generate: {
      label: hasContent ? "Regenerate" : "Generate",
      hint: hasContent ? regenerateHint : "Write from scratch",
      icon: Zap,
    },
    improve: { label: "Improve", hint: "Polish your text", icon: Wand2 },
    tailor: { label: "Tailor", hint: "Match the job", icon: Target },
  };
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(actions) as AiWritingAction[]).map((action) => {
        const { label, hint, icon: Icon } = actions[action];
        const needsText = action !== "generate" && !hasContent;
        return (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            disabled={disabled || needsText}
            title={needsText ? "Write or paste some text first" : undefined}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-accent-muted bg-white dark:bg-gray-800/50 p-3 text-center hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Icon className={`${iconSize} text-accent-dark dark:text-accent`} aria-hidden="true" />
            <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
              {label}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
