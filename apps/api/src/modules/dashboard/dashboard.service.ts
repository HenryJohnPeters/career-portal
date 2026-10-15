import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import {
  CLOSED_STATUSES,
  INTERVIEW_STATUSES,
  storedStatusValues,
} from "../jobs/jobs.constants";
import { JOB_BRIEF_SELECT, toJobBrief } from "../jobs/jobs.queries";
import {
  CV_COMPLETE_RULE,
  DASHBOARD_LIMITS,
  buildOnboardingSteps,
  buildPipeline,
  followUpHorizon,
  interviewTitle,
  jobTitle,
  mergeRecentActivity,
  staleCutoff,
  type DashboardSummary,
} from "./dashboard.summary";

const RECENT = {
  orderBy: { updatedAt: "desc" },
  take: DASHBOARD_LIMITS.recentPerType,
} as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One round of parallel, index-backed queries that select only the
   * columns shown (never CV or letter bodies).
   */
  async getSummary(userId: string): Promise<DashboardSummary> {
    const now = new Date();
    const db = this.prisma;
    const [
      user,
      cvVersions,
      coverLetters,
      interviewSessions,
      technicalTests,
      statusGroups,
      recentCvs,
      recentLetters,
      recentJobs,
      recentSessions,
      recentTests,
      followUps,
      staleApplications,
      interviewing,
      cvComplete,
      matchedJob,
      writtenLetter,
    ] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { onboardingDismissedAt: true } }),
      db.cvVersion.count({ where: { userId } }),
      db.coverLetter.count({ where: { userId } }),
      db.interviewSession.count({ where: { userId } }),
      db.technicalTest.count({ where: { userId, deletedAt: null } }),
      db.job.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
      db.cvVersion.findMany({ where: { userId }, ...RECENT, select: { id: true, title: true, updatedAt: true } }),
      db.coverLetter.findMany({ where: { userId }, ...RECENT, select: { id: true, title: true, updatedAt: true } }),
      db.job.findMany({
        where: { userId },
        ...RECENT,
        select: { id: true, company: true, role: true, updatedAt: true },
      }),
      db.interviewSession.findMany({
        where: { userId },
        ...RECENT,
        select: { id: true, track: true, interviewType: true, updatedAt: true },
      }),
      db.technicalTest.findMany({
        where: { userId, deletedAt: null },
        ...RECENT,
        select: { id: true, title: true, updatedAt: true },
      }),
      // Overdue and upcoming follow-ups on open applications; the web splits them by local date.
      db.job.findMany({
        where: {
          userId,
          status: { notIn: storedStatusValues(CLOSED_STATUSES) },
          followUpDate: { lte: followUpHorizon(now) },
        },
        orderBy: { followUpDate: "asc" },
        take: DASHBOARD_LIMITS.followUps,
        select: JOB_BRIEF_SELECT,
      }),
      // Most recently gone-stale first: those are still worth chasing.
      db.job.findMany({
        where: {
          userId,
          status: "applied",
          followUpDate: null,
          OR: [
            { appliedAt: { lt: staleCutoff(now) } },
            { appliedAt: null, createdAt: { lt: staleCutoff(now) } },
          ],
        },
        orderBy: [{ appliedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        take: DASHBOARD_LIMITS.staleApplications,
        select: JOB_BRIEF_SELECT,
      }),
      db.job.findMany({
        where: { userId, status: { in: storedStatusValues(INTERVIEW_STATUSES) } },
        orderBy: { updatedAt: "desc" },
        take: DASHBOARD_LIMITS.interviewing,
        select: JOB_BRIEF_SELECT,
      }),
      this.hasCompleteCv(userId),
      db.job.findFirst({ where: { userId, matchCheckedAt: { not: null } }, select: { id: true } }),
      db.coverLetter.findFirst({ where: { userId, body: { not: "" } }, select: { id: true } }),
    ]);

    const pipeline = buildPipeline(
      statusGroups.map((group) => ({ status: group.status, count: group._count._all })),
    );
    const jobs = Object.values(pipeline).reduce((sum, count) => sum + count, 0);

    return {
      counts: { cvVersions, coverLetters, jobs, interviewSessions, technicalTests },
      recentActivity: mergeRecentActivity([
        recentCvs.map((cv) => ({ type: "cv" as const, ...cv })),
        recentLetters.map((letter) => ({ type: "cover-letter" as const, ...letter })),
        recentJobs.map((job) => ({
          type: "job" as const,
          id: job.id,
          title: jobTitle(job),
          updatedAt: job.updatedAt,
        })),
        recentSessions.map((session) => ({
          type: "interview" as const,
          id: session.id,
          title: interviewTitle(session),
          updatedAt: session.updatedAt,
        })),
        recentTests.map((test) => ({ type: "technical-test" as const, ...test })),
      ]),
      pipeline,
      actionCentre: {
        followUps: followUps.map(toJobBrief),
        staleApplications: staleApplications.map(toJobBrief),
        interviewing: interviewing.map(toJobBrief),
      },
      onboarding: {
        dismissed: !!user?.onboardingDismissedAt,
        steps: buildOnboardingSteps({
          cvVersions,
          cvComplete,
          jobs,
          matchChecked: !!matchedJob,
          coverLetterWritten: !!writtenLetter,
          interviewSessions,
        }),
      },
    };
  }

  /** A CV version with enough substantial sections; counted in SQL so no content leaves the DB. */
  private async hasCompleteCv(userId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ complete: boolean }[]>(Prisma.sql`
      SELECT EXISTS (
        SELECT 1
        FROM "CvSection" s
        JOIN "CvVersion" v ON v."id" = s."cvVersionId"
        WHERE v."userId" = ${userId}
          AND char_length(btrim(s."content")) >= ${CV_COMPLETE_RULE.minChars}
        GROUP BY s."cvVersionId"
        HAVING count(*) >= ${CV_COMPLETE_RULE.sections}
      ) AS "complete"`);
    return rows[0]?.complete === true;
  }
}
