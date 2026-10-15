import { useState } from "react";
import { BarChart3, History, Play } from "lucide-react";
import type { InterviewSessionSummary } from "@careerportal/shared/types";
import { Button, ErrorState, Spinner } from "@careerportal/web/ui";
import { getErrorMessage, useInterviewSessions } from "@careerportal/web/data-access";
import { getInterviewerById } from "../interviewer-configs";
import {
  SCORE_TONE_TEXT,
  clampPercent,
  formatShortDate,
  getLevelMeta,
  getTrackMeta,
  scoreTone,
} from "../meta";
import { SectionTitle } from "./common";

const COLLAPSED_COUNT = 5;

interface SessionHistoryProps {
  onResume: (sessionId: string) => void;
  onViewReport: (sessionId: string) => void;
}

/** "Your sessions": resume in-progress interviews or reopen reports. Free on every plan. */
export function SessionHistory({ onResume, onViewReport }: SessionHistoryProps) {
  const { data, isPending, isError, error, refetch } = useInterviewSessions();
  const [expanded, setExpanded] = useState(false);
  const sessions = data?.data ?? [];

  if (isPending) {
    return (
      <section aria-labelledby="sessions-heading" className="rounded-2xl border border-border bg-bg-elevated p-4">
        <SectionTitle icon={History}>
          <span id="sessions-heading">Your sessions</span>
        </SectionTitle>
        <Spinner className="py-6" label="Loading your sessions" />
      </section>
    );
  }

  if (isError) {
    return (
      <section aria-labelledby="sessions-heading" className="rounded-2xl border border-border bg-bg-elevated p-4">
        <SectionTitle icon={History}>
          <span id="sessions-heading">Your sessions</span>
        </SectionTitle>
        <ErrorState message={getErrorMessage(error, "Couldn't load your sessions.")} onRetry={() => void refetch()} />
      </section>
    );
  }

  if (sessions.length === 0) return null;

  // In-progress sessions first (they can be resumed), then newest first.
  const ordered = [
    ...sessions.filter((s) => s.status === "in_progress"),
    ...sessions.filter((s) => s.status !== "in_progress"),
  ];
  const visible = expanded ? ordered : ordered.slice(0, COLLAPSED_COUNT);

  return (
    <section aria-labelledby="sessions-heading" className="rounded-2xl border border-border bg-bg-elevated p-4">
      <SectionTitle icon={History}>
        <span id="sessions-heading">Your sessions</span>
      </SectionTitle>
      <ul className="divide-y divide-border">
        {visible.map((session) => (
          <SessionRow key={session.id} session={session} onResume={onResume} onViewReport={onViewReport} />
        ))}
      </ul>
      {ordered.length > COLLAPSED_COUNT && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? "Show fewer" : `Show all ${ordered.length} sessions`}
        </Button>
      )}
    </section>
  );
}

function SessionRow({
  session,
  onResume,
  onViewReport,
}: {
  session: InterviewSessionSummary;
  onResume: (id: string) => void;
  onViewReport: (id: string) => void;
}) {
  const track = getTrackMeta(session.track);
  const level = getLevelMeta(session.level);
  const TrackIcon = track.icon;
  const interviewer = getInterviewerById(session.interviewerId);
  const inProgress = session.status === "in_progress";
  const pct = session.percentage === null || session.percentage === undefined ? null : clampPercent(session.percentage);
  const title = `${track.label} · ${level.label}`;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${track.accent}`} aria-hidden="true">
          <TrackIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
          <p className="text-xs text-text-tertiary">
            {formatShortDate(session.createdAt)}
            {interviewer && interviewer.id !== "none" ? ` · with ${interviewer.name}` : ""} · {session.answeredCount}/
            {session.questionCount} answered
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end">
        {inProgress ? (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            In progress
          </span>
        ) : pct !== null ? (
          <span className={`text-sm font-bold tabular-nums ${SCORE_TONE_TEXT[scoreTone(pct)]}`}>
            {session.grade ? `${session.grade} · ` : ""}
            {pct}%
          </span>
        ) : null}
        {inProgress ? (
          <Button size="sm" onClick={() => onResume(session.id)} aria-label={`Resume ${title} interview`}>
            <Play className="h-3.5 w-3.5" aria-hidden="true" /> Resume
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewReport(session.id)}
            aria-label={`View report for ${title} interview`}
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Report
          </Button>
        )}
      </div>
    </li>
  );
}
