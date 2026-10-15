import { memo } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Inbox } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import type { PipelineColumn } from "../constants";
import { ApplicationCard } from "./ApplicationCard";

export interface LinkedTitles {
  cv: ReadonlyMap<string, string>;
  letters: ReadonlyMap<string, string>;
  /** Letters that link a job from the letter side (CoverLetter.jobId): job id → title. */
  lettersByJob: ReadonlyMap<string, string>;
}

interface CardListProps {
  jobs: readonly Job[];
  onOpen: (jobId: string) => void;
  titles: LinkedTitles;
  today: string;
}

/**
 * The cards of one column, memoised so drag-over highlighting re-renders the
 * column but not its cards (as @hello-pangea/dnd recommends).
 */
const CardList = memo(function CardList({ jobs, onOpen, titles, today }: CardListProps) {
  return (
    <>
      {jobs.map((job, index) => (
        <ApplicationCard
          key={job.id}
          job={job}
          index={index}
          onOpen={onOpen}
          cvTitle={job.cvVersionId ? titles.cv.get(job.cvVersionId) ?? job.cvVersion?.title ?? "Linked CV" : null}
          letterTitle={
            job.coverLetterId
              ? titles.letters.get(job.coverLetterId) ?? job.linkedCoverLetter?.title ?? "Linked letter"
              : titles.lettersByJob.get(job.id) ?? null
          }
          today={today}
        />
      ))}
    </>
  );
});

interface BoardColumnProps extends CardListProps {
  column: PipelineColumn;
}

export const BoardColumn = memo(function BoardColumn({ column, jobs, onOpen, titles, today }: BoardColumnProps) {
  const Icon = column.icon;

  return (
    <section
      aria-label={`${column.label}: ${jobs.length} application${jobs.length === 1 ? "" : "s"}`}
      className="flex flex-col min-w-[240px] w-[270px] sm:min-w-[260px] sm:w-[280px] shrink-0 h-full snap-start"
    >
      <div className={`flex items-center gap-2 rounded-t-xl border px-3.5 py-2.5 ${column.headerBg}`}>
        <Icon className={`h-4 w-4 ${column.color}`} aria-hidden="true" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {column.label}
        </h2>
        <span
          aria-hidden="true"
          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${column.bg} ${column.color}`}
        >
          {jobs.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-b-xl border border-t-0 p-2 space-y-2 transition-colors duration-150 min-h-[120px] ${
              snapshot.isDraggingOver
                ? `${column.dropBg} border-dashed`
                : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50"
            }`}
          >
            {jobs.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center" aria-hidden="true">
                <Inbox className="h-5 w-5 text-gray-300 dark:text-gray-600 mb-1.5" />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Drop applications here</p>
              </div>
            )}
            <CardList jobs={jobs} onOpen={onOpen} titles={titles} today={today} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
});
