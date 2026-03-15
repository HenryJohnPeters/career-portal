import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Job } from "@careerportal/shared/types";
import type { PipelineStatus, PipelineColumn } from "../constants";
import { BoardColumn } from "./BoardColumn";

interface KanbanBoardProps {
  jobs: Job[];
  columns: PipelineColumn[];
  onStatusChange: (jobId: string, newStatus: PipelineStatus) => void;
  onCardClick: (job: Job) => void;
}

export function KanbanBoard({
  jobs,
  columns,
  onStatusChange,
  onCardClick,
}: KanbanBoardProps) {
  const grouped = columns.map((col) => ({
    column: col,
    jobs: jobs.filter((j) => j.status === col.id),
  }));

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    onStatusChange(draggableId, destination.droppableId as PipelineStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 px-3 sm:-mx-6 sm:px-6 h-full snap-x snap-mandatory sm:snap-none">
        {grouped.map(({ column, jobs: colJobs }) => (
          <BoardColumn
            key={column.id}
            column={column}
            jobs={colJobs}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
