import type { Job, JobStatus } from "@careerportal/shared/types";
import { getFollowUpState, isFollowUpDue, localDateKey } from "./follow-up";

export interface TrackerFilterState {
  search: string;
  status: JobStatus | "";
  followUpDue: boolean;
  missingCv: boolean;
  missingCoverLetter: boolean;
}

export const EMPTY_FILTERS: TrackerFilterState = {
  search: "",
  status: "",
  followUpDue: false,
  missingCv: false,
  missingCoverLetter: false,
};

/** Any filter besides the search text. */
export function hasToggleFilters(filters: TrackerFilterState): boolean {
  return (
    filters.status !== "" || filters.followUpDue || filters.missingCv || filters.missingCoverLetter
  );
}

export function hasActiveFilters(filters: TrackerFilterState): boolean {
  return filters.search.trim() !== "" || hasToggleFilters(filters);
}

function matchesSearch(job: Job, query: string): boolean {
  if (job.company.toLowerCase().includes(query) || job.role.toLowerCase().includes(query)) {
    return true;
  }
  if (job.location?.toLowerCase().includes(query)) return true;
  return (job.keySkills ?? []).some((skill) => skill.toLowerCase().includes(query));
}

/**
 * Jobs matching every active filter (search covers company, role, location and
 * key skills). A job has a cover letter when it links one (`coverLetterId`) or
 * a letter links it (`lettersByJob`, from the cover-letter editor's "For job").
 */
export function filterJobs(
  jobs: readonly Job[],
  filters: TrackerFilterState,
  today: string = localDateKey(),
  lettersByJob: ReadonlyMap<string, unknown> = new Map(),
): readonly Job[] {
  if (!hasActiveFilters(filters)) return jobs;
  const query = filters.search.trim().toLowerCase();
  return jobs.filter(
    (job) =>
      (!query || matchesSearch(job, query)) &&
      (!filters.status || job.status === filters.status) &&
      (!filters.followUpDue ||
        isFollowUpDue(getFollowUpState(job.followUpDate, job.status, today))) &&
      (!filters.missingCv || !job.cvVersionId) &&
      (!filters.missingCoverLetter || (!job.coverLetterId && !lettersByJob.has(job.id))),
  );
}

/** One pass over the jobs, keeping their order within each status. */
export function groupJobsByStatus(jobs: readonly Job[]): ReadonlyMap<string, readonly Job[]> {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const group = groups.get(job.status);
    if (group) group.push(job);
    else groups.set(job.status, [job]);
  }
  return groups;
}
