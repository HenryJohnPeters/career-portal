import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { resolvePlan } from "../../common/plan";

/** Bump when the export layout changes in a way readers would notice. */
export const EXPORT_FORMAT_VERSION = 1;

/** `career-portal-export-YYYY-MM-DD.json` (UTC date). */
export function exportFilename(now: Date): string {
  return `career-portal-export-${now.toISOString().slice(0, 10)}.json`;
}

interface AiUsageSummaryRow {
  month: string;
  action: string;
  status: string;
  count: number;
}

/** Position after the last row of a page (rows are read in createdAt, id order). */
interface Keyset {
  createdAt: Date;
  id: string;
}

/** Rows per query: CV versions carry sections and an undo snapshot, so fewer. */
export const EXPORT_PAGE_SIZE = { cvVersions: 5, default: 50 } as const;

const PAGE_ORDER: [{ createdAt: "asc" }, { id: "asc" }] = [
  { createdAt: "asc" },
  { id: "asc" },
];

/** The user's rows after `after` in (createdAt, id) order. */
export function pageWhere(userId: string, after: Keyset | null) {
  if (!after) return { userId };
  return {
    userId,
    OR: [
      { createdAt: { gt: after.createdAt } },
      { createdAt: after.createdAt, id: { gt: after.id } },
    ],
  };
}

/**
 * Every row a page query returns, one bounded page at a time. Keyset
 * pagination stays correct when rows are deleted while the export runs.
 */
export async function* paginate<T extends Keyset>(
  pageSize: number,
  fetchPage: (after: Keyset | null) => Promise<T[]>,
): AsyncGenerator<T> {
  let after: Keyset | null = null;
  for (;;) {
    const rows = await fetchPage(after);
    for (const row of rows) yield row;
    if (rows.length < pageSize) return;
    const last = rows[rows.length - 1];
    after = { createdAt: last.createdAt, id: last.id };
  }
}

/** A value, or rows to stream as a JSON array. */
export type ExportValue = unknown | AsyncIterable<unknown>;

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function"
  );
}

function indented(json: string, spaces: number): string {
  return json.replace(/\n/g, `\n${" ".repeat(spaces)}`);
}

/**
 * Serialises `entries` as one JSON object (2-space indented, as
 * `JSON.stringify(value, null, 2)`), holding at most one page of rows at a
 * time.
 */
export async function* jsonObjectChunks(
  entries: readonly (readonly [key: string, value: ExportValue])[],
): AsyncGenerator<string> {
  yield "{";
  for (const [index, [key, value]] of entries.entries()) {
    yield `${index === 0 ? "" : ","}\n  ${JSON.stringify(key)}: `;
    if (!isAsyncIterable(value)) {
      yield indented(JSON.stringify(value ?? null, null, 2), 2);
      continue;
    }
    let count = 0;
    for await (const item of value) {
      yield `${count === 0 ? "[" : ","}\n    ${indented(JSON.stringify(item, null, 2), 4)}`;
      count++;
    }
    yield count === 0 ? "[]" : "\n  ]";
  }
  yield "\n}\n";
}

/**
 * GET /account/export (UK GDPR Art. 15/20): everything the user created, as
 * JSON. Every query is scoped to the user's id. Left out on purpose: Stripe
 * and Supabase ids, checkout-session state, AI token telemetry, and answer
 * keys of bank questions (only prompts are included).
 *
 * The large collections are streamed in bounded pages, so an account at
 * every cap never has to fit in memory (or in one string) at once.
 */
@Injectable()
export class AccountExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Loads the profile and the small summaries first (so a missing account
   * is a plain 404), then returns the export as lazily produced JSON chunks.
   */
  async openExport(userId: string, now: Date = new Date()): Promise<AsyncGenerator<string>> {
    const [user, aiUsage, accountEvents] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          onboardingDismissedAt: true,
          isPremium: true,
          subscriptionStatus: true,
          stripeCurrentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          trialEnd: true,
          trialUsedAt: true,
        },
      }),
      this.prisma.$queryRaw<AiUsageSummaryRow[]>(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               action, status, count(*)::int AS count
        FROM "AiUsage"
        WHERE "userId" = ${userId}
        GROUP BY 1, 2, 3
        ORDER BY 1, 2, 3`),
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { action: true, reason: true, createdAt: true },
      }),
    ]);

    if (!user) throw new NotFoundException("Account not found");
    const plan = resolvePlan(user);
    const {
      isPremium: _isPremium,
      subscriptionStatus,
      stripeCurrentPeriodEnd,
      cancelAtPeriodEnd,
      trialEnd,
      trialUsedAt,
      ...profile
    } = user;

    return jsonObjectChunks([
      ["format", "career-portal-export"],
      ["version", EXPORT_FORMAT_VERSION],
      ["exportedAt", now.toISOString()],
      ["profile", profile],
      [
        "subscription",
        {
          plan: plan.plan,
          status: subscriptionStatus,
          currentPeriodEnd: stripeCurrentPeriodEnd,
          cancelAtPeriodEnd,
          trialEnd,
          trialUsedAt,
        },
      ],
      ["cvVersions", this.cvVersions(userId)],
      ["coverLetters", this.coverLetters(userId)],
      ["jobs", this.jobs(userId)],
      ["interviewSessions", this.interviewSessions(userId)],
      ["technicalTests", this.technicalTests(userId)],
      ["aiUsage", aiUsage],
      ["legacyQuestionAnswers", this.legacyQuestionAnswers(userId)],
      ["accountEvents", accountEvents],
    ]);
  }

  private cvVersions(userId: string) {
    const take = EXPORT_PAGE_SIZE.cvVersions;
    return paginate(take, (after) =>
      this.prisma.cvVersion.findMany({
        where: pageWhere(userId, after),
        orderBy: PAGE_ORDER,
        take,
        select: {
          id: true,
          title: true,
          isActive: true,
          templateId: true,
          themeConfig: true,
          headerLayout: true,
          name: true,
          email: true,
          photoUrl: true,
          phone: true,
          location: true,
          website: true,
          linkedin: true,
          github: true,
          lastSnapshot: true,
          createdAt: true,
          updatedAt: true,
          sections: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              sectionType: true,
              content: true,
              order: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
    );
  }

  private coverLetters(userId: string) {
    const take = EXPORT_PAGE_SIZE.default;
    return paginate(take, (after) =>
      this.prisma.coverLetter.findMany({
        where: pageWhere(userId, after),
        orderBy: PAGE_ORDER,
        take,
        select: {
          id: true,
          title: true,
          body: true,
          jobId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  }

  private jobs(userId: string) {
    const take = EXPORT_PAGE_SIZE.default;
    return paginate(take, (after) =>
      this.prisma.job.findMany({
        where: pageWhere(userId, after),
        orderBy: PAGE_ORDER,
        take,
        select: {
          id: true,
          company: true,
          role: true,
          status: true,
          url: true,
          notes: true,
          jobDescription: true,
          location: true,
          salary: true,
          keySkills: true,
          appliedAt: true,
          followUpDate: true,
          matchScore: true,
          matchCheckedAt: true,
          cvVersionId: true,
          coverLetterId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  }

  private async *interviewSessions(userId: string) {
    const take = EXPORT_PAGE_SIZE.default;
    const rows = paginate(take, (after) =>
      this.prisma.interviewSession.findMany({
        where: pageWhere(userId, after),
        orderBy: PAGE_ORDER,
        take,
        select: {
          id: true,
          track: true,
          level: true,
          tags: true,
          roleFocus: true,
          interviewType: true,
          duration: true,
          difficulty: true,
          companyStyle: true,
          questionCount: true,
          persona: true,
          interviewerId: true,
          status: true,
          totalScore: true,
          report: true,
          createdAt: true,
          updatedAt: true,
          questions: {
            orderBy: { orderIndex: "asc" },
            select: {
              orderIndex: true,
              isFollowUp: true,
              userAnswer: true,
              score: true,
              maxScore: true,
              feedback: true,
              answeredAt: true,
              question: { select: { prompt: true, type: true } },
            },
          },
        },
      }),
    );
    for await (const { questions, ...session } of rows) {
      yield {
        ...session,
        questions: questions.map(({ question, ...asked }) => ({
          ...asked,
          prompt: question.prompt,
          type: question.type,
        })),
      };
    }
  }

  private technicalTests(userId: string) {
    const take = EXPORT_PAGE_SIZE.default;
    return paginate(take, (after) =>
      this.prisma.technicalTest.findMany({
        where: pageWhere(userId, after),
        orderBy: PAGE_ORDER,
        take,
        select: {
          id: true,
          title: true,
          track: true,
          level: true,
          difficulty: true,
          roleFocus: true,
          tags: true,
          timeLimit: true,
          scenario: true,
          status: true,
          submission: true,
          evaluation: true,
          startedAt: true,
          submittedAt: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  }

  /** The id pages the query; it is not part of the exported row. */
  private async *legacyQuestionAnswers(userId: string) {
    const take = EXPORT_PAGE_SIZE.default;
    const rows = paginate(take, (after) =>
      this.prisma.questionAnswer.findMany({
        where: pageWhere(userId, after),
        orderBy: PAGE_ORDER,
        take,
        select: {
          id: true,
          questionId: true,
          answerText: true,
          selectedOptionId: true,
          skipped: true,
          createdAt: true,
        },
      }),
    );
    for await (const { id: _id, ...answer } of rows) yield answer;
  }
}
