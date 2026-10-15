import { useState } from "react";
import { Crown, Wand2 } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import { requestUpgrade } from "@careerportal/web/data-access";
import { Badge, Button } from "@careerportal/web/ui";
import { DrawerSection, type DocumentOption } from "./DrawerSection";
import { TailorDialog } from "./TailorDialog";

interface TailorSectionProps {
  job: Job;
  cvOptions: readonly DocumentOption[];
  /** The plan includes the Tailor kit (Premium). */
  canTailor: boolean;
}

export function TailorSection({ job, cvOptions, canTailor }: TailorSectionProps) {
  const [open, setOpen] = useState(false);
  const blocker = !job.hasJobDescription
    ? "Add the job description above first."
    : cvOptions.length === 0
      ? "Create a CV first."
      : null;

  const start = () => {
    if (!canTailor) {
      requestUpgrade({ reason: "premium_required", feature: "tailorKit" });
      return;
    }
    setOpen(true);
  };

  return (
    <DrawerSection
      title="Tailor for this job"
      icon={Wand2}
      aside={
        !canTailor ? (
          <Badge variant="warning">
            <Crown className="h-3 w-3" aria-hidden="true" />
            Premium
          </Badge>
        ) : undefined
      }
    >
      <p className="text-sm text-text-secondary">
        One click creates a copy of your CV with the profile, experience and skills rewritten for this job, plus an
        optional cover letter — both linked here.
      </p>
      <Button className="mt-3" onClick={start} disabled={canTailor && blocker !== null}>
        <Wand2 className="h-4 w-4" aria-hidden="true" />
        Tailor application
      </Button>
      {canTailor && blocker && <p className="mt-2 text-xs text-text-tertiary">{blocker}</p>}
      {open && <TailorDialog job={job} cvOptions={cvOptions} onClose={() => setOpen(false)} />}
    </DrawerSection>
  );
}
