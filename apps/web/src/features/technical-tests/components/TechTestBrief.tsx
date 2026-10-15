import { Play } from "lucide-react";
import type { TechnicalTest } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { requestUpgradeForError, useStartTechnicalTest } from "@careerportal/web/data-access";
import { ActionError } from "../../interview-prep/components/common";
import { ScenarioBrief } from "./ScenarioBrief";
import { TestHeader } from "./TestHeader";

interface TechTestBriefProps {
  test: TechnicalTest;
  onBack: () => void;
}

/** A generated test that hasn't been started: read the brief, then start. */
export function TechTestBrief({ test, onBack }: TechTestBriefProps) {
  const start = useStartTechnicalTest();
  const timeLimit = test.timeLimit && test.timeLimit > 0 ? test.timeLimit : null;

  const handleStart = () => {
    if (start.isPending) return;
    start.mutate(test.id, { onError: (err) => requestUpgradeForError(err) });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <TestHeader test={test} onBack={onBack} />
      <ScenarioBrief scenario={test.scenario} />

      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl border border-border bg-bg-elevated/95 backdrop-blur-sm shadow-xl p-3 sm:p-4 space-y-3">
          <ActionError error={start.error} title="Couldn't start the test" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-text-primary">Ready to begin?</p>
              <p className="text-xs text-text-secondary">
                {timeLimit
                  ? `Suggested time: ${timeLimit} minutes. The timer is a guide only — nothing is submitted automatically.`
                  : "Work at your own pace — nothing is submitted automatically."}
              </p>
            </div>
            <Button size="lg" onClick={handleStart} loading={start.isPending} className="shrink-0 w-full sm:w-auto">
              <Play className="h-4 w-4" aria-hidden="true" /> Start test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
