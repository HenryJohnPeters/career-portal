import { Droppable } from "@hello-pangea/dnd";
import { Inbox } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import type { PipelineColumn as ColumnDef } from "../constants";
import { ApplicationCard } from "./ApplicationCard";

interface BoardColumnProps {
  column: ColumnDef;
  jobs: Job[];
  onCardClick: (job: Job) => void;
}

export function BoardColumn({ column, jobs, onCardClick }: BoardColumnProps) {
  const Icon = column.icon;

  return (
    <div className="flex flex-col min-w-[240px] w-[270px] sm:min-w-[260px] sm:w-[280px] shrink-0 h-full snap-start">
      {/* Column header */}
      <div
        className={`flex items-center gap-2 rounded-t-xl border px-3.5 py-2.5 ${column.headerBg}`}
      >
        <Icon className={`h-4 w-4 ${column.color}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {column.label}
        </span>
        <span
          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${column.bg} ${column.color}`}
        >
          {jobs.length}
        </span>
      </div>

      {/* Droppable area */}
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-5 w-5 text-gray-300 dark:text-gray-600 mb-1.5" />
                <p className="text-[10px] text-gray-400 dark:text-gray-600">
                  Drop applications here
                </p>
              </div>
            )}
            {jobs.map((job, idx) => (
              <ApplicationCard
                key={job.id}
                job={job}
                index={idx}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
