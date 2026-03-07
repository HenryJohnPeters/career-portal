import { Draggable } from "@hello-pangea/dnd";
import { Building2, FileText, Mail, Clock, AlertTriangle } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import { getFollowUpBadge } from "../constants";

interface ApplicationCardProps {
  job: Job;
  index: number;
  onClick: (job: Job) => void;
}

export function ApplicationCard({ job, index, onClick }: ApplicationCardProps) {
  const followUp = getFollowUpBadge(job.followUpDate);
  const cvLabel = job.cvVersion?.title ?? null;
  const clLabel = job.linkedCoverLetter?.title ?? null;

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          aria-label={`${job.company} — ${job.role}`}
          onClick={() => onClick(job)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(job);
            }
          }}
          className={`group rounded-xl border bg-white dark:bg-gray-900 p-3.5 cursor-pointer transition-all duration-150 select-none ${
            snapshot.isDragging
              ? "shadow-xl ring-2 ring-blue-400/40 rotate-1 scale-[1.02]"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
          }`}
        >
          {/* Company + role */}
          <div className="flex items-start gap-2.5 mb-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {job.company}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {job.role}
              </p>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {/* CV tag */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                cvLabel
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              }`}
            >
              <FileText className="h-2.5 w-2.5" />
              {cvLabel ? cvLabel : "No CV"}
            </span>

            {/* Cover letter tag */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                clLabel
                  ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              }`}
            >
              <Mail className="h-2.5 w-2.5" />
              {clLabel ? clLabel : "No letter"}
            </span>

            {/* Follow-up badge */}
            {followUp === "overdue" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" />
                Overdue
              </span>
            )}
            {followUp === "due" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                <Clock className="h-2.5 w-2.5" />
                Due
              </span>
            )}
          </div>

          {/* Date */}
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {new Date(job.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </Draggable>
  );
}
