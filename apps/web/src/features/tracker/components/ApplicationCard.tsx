import { memo, type KeyboardEvent } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { AlertTriangle, Building2, Clock, FileText, Mail, MapPin, Target } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import { matchScoreTone } from "../constants";
import { describeDueDate, getFollowUpState, isFollowUpDue, toDateKey } from "../lib/follow-up";

interface ApplicationCardProps {
  job: Job;
  index: number;
  onOpen: (jobId: string) => void;
  /** Title of the linked CV / cover letter (null when none is linked). */
  cvTitle: string | null;
  letterTitle: string | null;
  /** Today's local date ("YYYY-MM-DD"). */
  today: string;
}

const UPDATED_FORMAT = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

const CHIP = "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium";

/**
 * A draggable job card. The drag library makes it focusable (Space lifts it,
 * arrow keys move it); Enter or a click opens the details.
 */
export const ApplicationCard = memo(function ApplicationCard({
  job,
  index,
  onOpen,
  cvTitle,
  letterTitle,
  today,
}: ApplicationCardProps) {
  const followUpState = getFollowUpState(job.followUpDate, job.status, today);
  const dueKey = toDateKey(job.followUpDate);
  const showFollowUp = dueKey !== null && isFollowUpDue(followUpState);
  const score = job.matchScore ?? null;

  const labelParts = [`${job.company}, ${job.role}`];
  if (followUpState === "overdue") labelParts.push("follow-up overdue");
  else if (showFollowUp) labelParts.push(`follow up ${describeDueDate(dueKey, today).toLowerCase()}`);
  if (score !== null) labelParts.push(`${score}% CV match`);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Space belongs to the drag library (lift/drop).
    if (event.key === "Enter" && !event.defaultPrevented) {
      event.preventDefault();
      onOpen(job.id);
    }
  };

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          aria-label={labelParts.join(", ")}
          onClick={() => onOpen(job.id)}
          onKeyDown={onKeyDown}
          className={`group rounded-xl border bg-white dark:bg-gray-900 p-3.5 cursor-pointer select-none transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            snapshot.isDragging
              ? "shadow-xl ring-2 ring-primary-400/40"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
          }`}
        >
          <div className="flex items-start gap-2.5 mb-2.5">
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {job.company}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
              {job.location && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {job.location}
                </p>
              )}
            </div>
            {score !== null && (
              <span className={`${CHIP} shrink-0 font-semibold ${matchScoreTone(score)}`} title="Keyword match with your CV">
                <Target className="h-2.5 w-2.5" aria-hidden="true" />
                {score}%
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2" aria-hidden="true">
            <span
              className={`${CHIP} ${
                cvTitle
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              <FileText className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{cvTitle ?? "No CV"}</span>
            </span>
            <span
              className={`${CHIP} ${
                letterTitle
                  ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              <Mail className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{letterTitle ?? "No letter"}</span>
            </span>
            {showFollowUp &&
              (followUpState === "overdue" ? (
                <span className={`${CHIP} font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Follow-up overdue
                </span>
              ) : (
                <span className={`${CHIP} font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300`}>
                  <Clock className="h-2.5 w-2.5" />
                  Follow up {describeDueDate(dueKey, today).toLowerCase()}
                </span>
              ))}
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Updated {UPDATED_FORMAT.format(new Date(job.updatedAt))}
          </p>
        </div>
      )}
    </Draggable>
  );
});
