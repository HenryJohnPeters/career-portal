import { useId, useState } from "react";
import { Building2, Save, Trash2 } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import { getErrorMessage, useDeleteJob, useJob } from "@careerportal/web/data-access";
import { Alert, Button, ConfirmDialog, Spinner } from "@careerportal/web/ui";
import { useToast } from "../../../lib/toast";
import { getPipelineColumn } from "../constants";
import { useJobDetailsForm } from "../hooks/useJobDetailsForm";
import { SideDrawer } from "./SideDrawer";
import type { DocumentOption } from "./drawer/DrawerSection";
import { FollowUpSection } from "./drawer/FollowUpSection";
import { JobDetailsForm } from "./drawer/JobDetailsForm";
import { JobDescriptionSection } from "./drawer/JobDescriptionSection";
import { MatchSection } from "./drawer/MatchSection";
import { TailorSection } from "./drawer/TailorSection";

interface TrackerDrawerProps {
  jobId: string;
  /** The job from the board list (instant); the full job is fetched on open. */
  listJob: Job | undefined;
  cvOptions: readonly DocumentOption[];
  letterOptions: readonly DocumentOption[];
  documentsLoaded: boolean;
  canTailor: boolean;
  onClose: () => void;
}

const DRAWER_ICON = (
  <div
    aria-hidden="true"
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
  >
    <Building2 className="h-4 w-4" />
  </div>
);

/** Details drawer for one application. Mount it only while open (keyed by job id). */
export function TrackerDrawer({ jobId, listJob, onClose, ...rest }: TrackerDrawerProps) {
  const detail = useJob(jobId);
  const job = detail.data?.data ?? listJob;

  if (!job) {
    return (
      <SideDrawer onClose={onClose} title={detail.isError ? "Application not found" : "Loading…"} icon={DRAWER_ICON}>
        {detail.isError ? (
          <Alert variant="warning">
            {getErrorMessage(detail.error, "This application couldn't be loaded.")} It may have been deleted.
          </Alert>
        ) : (
          <Spinner label="Loading the application" />
        )}
      </SideDrawer>
    );
  }

  return (
    <DrawerContent
      job={job}
      description={detail.data ? detail.data.data.jobDescription : undefined}
      descriptionError={
        !detail.data && detail.isError
          ? getErrorMessage(detail.error, "The job description couldn't be loaded.")
          : null
      }
      onRetryDescription={() => void detail.refetch()}
      onClose={onClose}
      {...rest}
    />
  );
}

interface DrawerContentProps extends Omit<TrackerDrawerProps, "jobId" | "listJob"> {
  job: Job;
  description: string | null | undefined;
  /** Set when the full job (with the description) failed to load. */
  descriptionError: string | null;
  onRetryDescription: () => void;
}

function DrawerContent({
  job,
  description,
  descriptionError,
  onRetryDescription,
  cvOptions,
  letterOptions,
  documentsLoaded,
  canTailor,
  onClose,
}: DrawerContentProps) {
  const formId = useId();
  const form = useJobDetailsForm(job);
  const remove = useDeleteJob({ silent: true });
  const { toast } = useToast();
  const [descriptionUnsaved, setDescriptionUnsaved] = useState(false);
  const [confirm, setConfirm] = useState<"discard" | "delete" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const column = getPipelineColumn(job.status);

  const requestClose = () => {
    if (form.dirty || descriptionUnsaved) setConfirm("discard");
    else onClose();
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await remove.mutateAsync(job.id);
      toast("success", `${job.company} was deleted.`);
      onClose();
    } catch (err) {
      setConfirm(null);
      setDeleteError(getErrorMessage(err, "This application couldn't be deleted. Please try again."));
    }
  };

  return (
    <SideDrawer
      onClose={requestClose}
      icon={DRAWER_ICON}
      title={job.company}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate">{job.role}</span>
          {column && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${column.bg} ${column.color}`}>
              {column.label}
            </span>
          )}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirm("delete")} className="text-red-700 dark:text-red-400">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={requestClose}>
              Close
            </Button>
            <Button type="submit" form={formId} size="sm" loading={form.saving} disabled={!form.dirty}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {deleteError && <Alert variant="error">{deleteError}</Alert>}
        <FollowUpSection job={job} />
        <JobDetailsForm
          formId={formId}
          form={form}
          cvOptions={cvOptions}
          letterOptions={letterOptions}
          documentsLoaded={documentsLoaded}
        />
        <JobDescriptionSection
          job={job}
          description={description}
          loadError={descriptionError}
          onRetry={onRetryDescription}
          onUnsavedChange={setDescriptionUnsaved}
        />
        <MatchSection job={job} cvOptions={cvOptions} />
        <TailorSection job={job} cvOptions={cvOptions} canTailor={canTailor} />
      </div>

      <ConfirmDialog
        open={confirm === "discard"}
        title="Discard unsaved changes?"
        description="Your edits to this application haven't been saved."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={onClose}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        destructive
        title="Delete this application?"
        description={`${job.company} — ${job.role}, with its notes and follow-up, will be deleted for good. Linked CVs and cover letters are kept.`}
        confirmLabel="Delete application"
        loading={remove.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirm(null)}
      />
    </SideDrawer>
  );
}
