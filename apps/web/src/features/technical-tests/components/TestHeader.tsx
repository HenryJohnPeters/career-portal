import type { ReactNode } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import type { TechnicalTest } from "@careerportal/shared/types";
import { IconButton } from "@careerportal/web/ui";
import { getDifficultyMeta, getLevelMeta, getRoleFocusMeta } from "../../interview-prep/meta";
import { MetaChip } from "../../interview-prep/components/common";

interface TestHeaderProps {
  test: TechnicalTest;
  onBack: () => void;
  backLabel?: string;
  /** Extra content on the right (timer, actions). */
  aside?: ReactNode;
}

/** Title row for a test: back button, scenario title and role/level/difficulty chips. */
export function TestHeader({ test, onBack, backLabel = "Back to technical tests", aside }: TestHeaderProps) {
  const role = getRoleFocusMeta(test.roleFocus);
  const level = getLevelMeta(test.level);
  const difficulty = getDifficultyMeta(test.difficulty);
  const title = test.scenario?.title || test.title;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <IconButton label={backLabel} onClick={onBack} className="mt-0.5 border border-border bg-bg-elevated">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight">{title}</h1>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <MetaChip icon={role.icon}>{role.label}</MetaChip>
            <MetaChip icon={level.icon}>{level.label}</MetaChip>
            <MetaChip icon={difficulty.icon}>{difficulty.label}</MetaChip>
            {test.scenario?.estimatedTime && <MetaChip icon={Clock}>{test.scenario.estimatedTime}</MetaChip>}
          </div>
        </div>
      </div>
      {aside && <div className="shrink-0 sm:ml-auto">{aside}</div>}
    </div>
  );
}
