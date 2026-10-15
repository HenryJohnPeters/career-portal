import { Download, HardDrive } from "lucide-react";
import { downloadBlob, useExportAccount } from "@careerportal/web/data-access";
import { Button } from "@careerportal/web/ui";
import { useToast } from "../../lib/toast";
import { SettingsSection } from "./SettingsSection";

/** "Download my data" (GET /account/export, a JSON file). */
export function DataSection() {
  const { toast } = useToast();
  const exportAccount = useExportAccount();

  const download = () => {
    // Errors (including the 3-per-hour limit) are toasted by the global mutation handler.
    exportAccount.mutate(undefined, {
      onSuccess: ({ blob, filename }) => {
        downloadBlob(blob, filename);
        toast("success", "Your data export has been downloaded.");
      },
    });
  };

  return (
    <SettingsSection
      id="data"
      title="Your data"
      description="Download a copy of everything you've stored in careerRepo."
      icon={<HardDrive />}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          A JSON file with your profile, CVs, cover letters, tracked jobs, interview sessions and answers, technical
          tests and a summary of your AI usage. You can download up to 3 exports an hour.
        </p>
        <Button variant="outline" size="sm" className="shrink-0" onClick={download} loading={exportAccount.isPending}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download my data
        </Button>
      </div>
    </SettingsSection>
  );
}
