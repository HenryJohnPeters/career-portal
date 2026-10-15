import { useId, useState } from "react";
import { BellRing, CalendarCheck, CalendarPlus, X } from "lucide-react";
import type { Job } from "@careerportal/shared/types";
import { Button } from "@careerportal/web/ui";
import { isClosedStatus, statusLabel } from "../../constants";
import {
  describeDueDate,
  formatDateKey,
  getFollowUpState,
  localDateKey,
  toDateKey,
} from "../../lib/follow-up";
import { FOLLOW_UP_SNOOZE_DAYS, useFollowUpActions } from "../../hooks/useFollowUpActions";
import { DrawerSection } from "./DrawerSection";

const QUICK_PICKS = [
  { days: 3, label: "In 3 days" },
  { days: 7, label: "In 1 week" },
  { days: 14, label: "In 2 weeks" },
] as const;

const STATE_STYLES = {
  overdue: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/60",
  today: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/60",
  soon: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/60",
  later: "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-800/60",
} as const;

/** Follow-up reminder for one job: one-click actions that save immediately. */
export function FollowUpSection({ job }: { job: Job }) {
  const actions = useFollowUpActions();
  const dateInputId = useId();
  const today = localDateKey();
  const due = toDateKey(job.followUpDate);
  const state = getFollowUpState(job.followUpDate, job.status, today);
  const busy = actions.busyId === job.id;
  const [picked, setPicked] = useState("");

  if (isClosedStatus(job.status)) {
    return (
      <DrawerSection title="Follow-up" icon={BellRing}>
        <p className="text-sm text-text-tertiary">
          No reminders for this application — it's {statusLabel(job.status).toLowerCase()}.
          {due && ` The reminder for ${formatDateKey(due, today)} is paused.`}
        </p>
        {due && (
          <Button variant="ghost" size="sm" className="mt-2" loading={busy} onClick={() => void actions.setFollowUp(job, null)}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear reminder
          </Button>
        )}
      </DrawerSection>
    );
  }

  return (
    <DrawerSection
      title="Follow-up"
      icon={BellRing}
      aside={
        due && state !== "none" && state !== "paused" ? (
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATE_STYLES[state]}`}>
            {describeDueDate(due, today)}
          </span>
        ) : undefined
      }
    >
      {due ? (
        <>
          <p className="text-sm text-text-secondary">
            Reminder set for <span className="font-semibold text-text-primary">{formatDateKey(due, today)}</span>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void actions.remindIn(job)}>
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Done — remind me in {FOLLOW_UP_SNOOZE_DAYS} days
            </Button>
            <Button size="sm" variant="outline" onClick={() => actions.downloadCalendar(job)}>
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to calendar
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void actions.setFollowUp(job, null)}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            No reminder yet. Following up a week or two after applying is one of the easiest ways to stand out.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PICKS.map((pick) => (
              <Button
                key={pick.days}
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void actions.remindIn(job, pick.days)}
              >
                {pick.label}
              </Button>
            ))}
          </div>
        </>
      )}

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (picked) void actions.setFollowUp(job, picked).then((ok) => ok && setPicked(""));
        }}
      >
        <div className="flex-1">
          <label htmlFor={dateInputId} className="label">
            {due ? "Change date" : "Or pick a date"}
          </label>
          <input
            id={dateInputId}
            type="date"
            value={picked}
            min={today}
            onChange={(event) => setPicked(event.target.value)}
            className="input-base py-2"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={!picked || busy} className="mb-0.5">
          Set
        </Button>
      </form>
    </DrawerSection>
  );
}
