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

/**
 * GET /account/export (UK GDPR Art. 15/20): everything the user created, as
 * JSON. Every query is scoped to the user's id. Left out on purpose: Stripe
 * and Supabase ids, checkout-session state, AI token telemetry, and answer
 * keys of bank questions (only prompts are included).
 */
@Injectable()
export class AccountExportService {
  constructor(private readonly prisma: PrismaService) {}

  async buildExport(userId: string, now: Date = new Date()) {
    const where = { userId };
    const [
      user,
      cvVersions,
      coverLetters,
      jobs,
      interviewSessions,
      technicalTests,
      aiUsage,
      legacyQuestionAnswers,
      accountEvents,
    ] = await Promise.all([
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
      this.prisma.cvVersion.findMany({
        where,
        orderBy: { createdAt: "asc" },
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
      this.prisma.coverLetter.findMany({
        where,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          body: true,
          jobId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: "asc" },
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
      this.prisma.interviewSession.findMany({
        where,
        orderBy: { createdAt: "asc" },
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
      this.prisma.technicalTest.findMany({
        where,
        orderBy: { createdAt: "asc" },
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
      this.prisma.$queryRaw<AiUsageSummaryRow[]>(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               action, status, count(*)::int AS count
        FROM "AiUsage"
        WHERE "userId" = ${userId}
        GROUP BY 1, 2, 3
        ORDER BY 1, 2, 3`),
      this.prisma.questionAnswer.findMany({
        where,
        orderBy: { createdAt: "asc" },
        select: {
          questionId: true,
          answerText: true,
          selectedOptionId: true,
          skipped: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where,
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

    return {
      format: "career-portal-export",
      version: EXPORT_FORMAT_VERSION,
      exportedAt: now.toISOString(),
      profile,
      subscription: {
        plan: plan.plan,
        status: subscriptionStatus,
        currentPeriodEnd: stripeCurrentPeriodEnd,
        cancelAtPeriodEnd,
        trialEnd,
        trialUsedAt,
      },
      cvVersions,
      coverLetters,
      jobs,
      interviewSessions: interviewSessions.map(({ questions, ...session }) => ({
        ...session,
        questions: questions.map(({ question, ...asked }) => ({
          ...asked,
          prompt: question.prompt,
          type: question.type,
        })),
      })),
      technicalTests,
      aiUsage,
      legacyQuestionAnswers,
      accountEvents,
    };
  }
}
