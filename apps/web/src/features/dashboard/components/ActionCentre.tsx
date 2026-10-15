import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Hourglass,
  Mic,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ActionCentre as ActionCentreData, JobBrief } from "@careerportal/shared/types";
import { Button, Card } from "@careerportal/web/ui";
import { statusLabel } from "../../tracker/constants";
import { describeDueDate, formatDateKey, localDateKey, toDateKey } from "../../tracker/lib/follow-up";
import { FOLLOW_UP_SNOOZE_DAYS, useFollowUpActions } from "../../tracker/hooks/useFollowUpActions";
import { splitFollowUps } from "../lib/summary";

/** Rows shown per group; the rest are one click away in the tracker. */
const ROWS_PER_GROUP = 5;

type FollowUpActions = ReturnType<typeof useFollowUpActions>;

/** Daily to-do list: follow-ups (split by local date), quiet applications and interviews. */
export function ActionCentre({ actionCentre }: { actionCentre: ActionCentreData }) {
  const headingId = useId();
  const today = localDateKey();
  const actions = useFollowUpActions();
  const followUps = splitFollowUps(actionCentre.followUps, today);
  const { staleApplications, interviewing } = actionCentre;
  const nothingToDo =
    actionCentre.followUps.length === 0 && staleApplications.length === 0 && interviewing.length === 0;

  const followUpRow = (job: JobBrief) => {
    const due = toDateKey(job.followUpDate);
    return (
      <JobRow key={job.id} job={job} detail={due ? `${describeDueDate(due, today)} · ${formatDateKey(due, today)}` : ""}>
        <FollowUpButtons job={job} actions={actions} />
      </JobRow>
    );
  };

  return (
    <Card className="p-5">
      <section aria-labelledby={headingId}>
        <div className="mb-1 flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <h2 id={headingId} className="text-sm font-semibold text-text-primary">
            Today
          </h2>
        </div>

        {nothingToDo ? (
          <div className="flex items-start gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
            <p className="text-sm text-text-secondary">
              Nothing needs you right now. Set a follow-up date on an application and it will show up here when it's
              due.{" "}
              <Link to="/app/jobs" className="font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                Open the tracker
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-5">
            <Group title="Overdue follow-ups" icon={AlertTriangle} tone="text-red-600 dark:text-red-400" jobs={followUps.overdue}>
              {followUpRow}
            </Group>
            <Group title="Follow up today" icon={BellRing} tone="text-amber-600 dark:text-amber-400" jobs={followUps.today}>
              {followUpRow}
            </Group>
            <Group title="Coming up this week" icon={CalendarClock} tone="text-primary-600 dark:text-primary-400" jobs={followUps.upcoming}>
              {followUpRow}
            </Group>
            <Group
              title="Gone quiet"
              hint="Applied over two weeks ago with no follow-up set."
              icon={Hourglass}
              tone="text-text-tertiary"
              jobs={staleApplications}
            >
              {(job) => (
                <JobRow key={job.id} job={job} detail={`${statusLabel(job.status)} · no reply yet`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={actions.busyId === job.id}
                    onClick={() => void actions.setFollowUp(job, today)}
                  >
                    <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                    Follow up today
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actions.busyId === job.id}
                    onClick={() => void actions.markRejected(job)}
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Mark rejected
                  </Button>
                </JobRow>
              )}
            </Group>
            <Group title="Interviewing" icon={Mic} tone="text-emerald-600 dark:text-emerald-400" jobs={interviewing}>
              {(job) => (
                <JobRow key={job.id} job={job} detail={statusLabel(job.status)}>
                  <Link
                    to="/app/practice"
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                    Practise
                  </Link>
                </JobRow>
              )}
            </Group>
          </div>
        )}
      </section>
    </Card>
  );
}

function FollowUpButtons({ job, actions }: { job: JobBrief; actions: FollowUpActions }) {
  const busy = actions.busyId === job.id;
  return (
    <>
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void actions.remindIn(job)}>
        <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Done — remind me in {FOLLOW_UP_SNOOZE_DAYS} days
      </Button>
      <Button size="sm" variant="ghost" onClick={() => actions.downloadCalendar(job)}>
        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
        Add to calendar
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => void actions.setFollowUp(job, null)}>
        Clear
      </Button>
    </>
  );
}

function Group({
  title,
  hint,
  icon: Icon,
  tone,
  jobs,
  children,
}: {
  title: string;
  hint?: string;
  icon: LucideIcon;
  tone: string;
  jobs: readonly JobBrief[];
  children: (job: JobBrief) => ReactNode;
}) {
  const headingId = useId();
  if (jobs.length === 0) return null;
  const hidden = jobs.length - ROWS_PER_GROUP;
  return (
    <div role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${tone}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title} <span className="text-text-tertiary">({jobs.length})</span>
      </h3>
      {hint && <p className="mt-0.5 text-xs text-text-tertiary">{hint}</p>}
      <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
        {jobs.slice(0, ROWS_PER_GROUP).map(children)}
      </ul>
      {hidden > 0 && (
        <Link to="/app/jobs" className="mt-2 inline-block text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline">
          +{hidden} more in the tracker
        </Link>
      )}
    </div>
  );
}

function JobRow({ job, detail, children }: { job: JobBrief; detail: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link
          to={`/app/jobs?job=${encodeURIComponent(job.id)}`}
          className="block truncate text-sm font-semibold text-text-primary hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
        >
          {job.company} <span className="font-normal text-text-secondary">— {job.role}</span>
        </Link>
        {detail && <p className="text-xs text-text-tertiary">{detail}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </li>
  );
}
