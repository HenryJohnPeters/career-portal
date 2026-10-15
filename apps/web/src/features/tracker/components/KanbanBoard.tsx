import { useMemo } from "react";
import {
  DragDropContext,
  type DragStart,
  type DragUpdate,
  type DropResult,
  type ResponderProvided,
} from "@hello-pangea/dnd";
import type { Job, JobStatus } from "@careerportal/shared/types";
import { statusLabel, type PipelineColumn } from "../constants";
import { groupJobsByStatus } from "../lib/board";
import { BoardColumn, type LinkedTitles } from "./BoardColumn";

const NO_JOBS: readonly Job[] = [];

interface KanbanBoardProps {
  jobs: readonly Job[];
  columns: readonly PipelineColumn[];
  onMove: (jobId: string, status: JobStatus) => void;
  onOpen: (jobId: string) => void;
  titles: LinkedTitles;
  today: string;
}

export function KanbanBoard({ jobs, columns, onMove, onOpen, titles, today }: KanbanBoardProps) {
  const grouped = useMemo(() => groupJobsByStatus(jobs), [jobs]);
  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);

  const name = (id: string) => {
    const job = jobsById.get(id);
    return job ? `${job.company}, ${job.role}` : "Application";
  };

  // Screen reader announcements in words instead of list positions.
  const onDragStart = (start: DragStart, provided: ResponderProvided) => {
    provided.announce(
      `Picked up ${name(start.draggableId)} in ${statusLabel(start.source.droppableId)}. ` +
        "Use the arrow keys to move between columns, Space to drop, Escape to cancel.",
    );
  };

  const onDragUpdate = (update: DragUpdate, provided: ResponderProvided) => {
    if (update.destination) provided.announce(`Over ${statusLabel(update.destination.droppableId)}.`);
  };

  const onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    const { draggableId, destination, source } = result;
    // Order within a column is not saved, so only a column change is a move.
    if (!destination || destination.droppableId === source.droppableId) {
      provided.announce(`${name(draggableId)} stays in ${statusLabel(source.droppableId)}.`);
      return;
    }
    provided.announce(`Dropped in ${statusLabel(destination.droppableId)}.`);
    onMove(draggableId, destination.droppableId as JobStatus);
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 px-3 sm:-mx-6 sm:px-6 h-full snap-x snap-mandatory sm:snap-none">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            jobs={grouped.get(column.id) ?? NO_JOBS}
            onOpen={onOpen}
            titles={titles}
            today={today}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
