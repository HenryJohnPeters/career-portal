import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { CreateTechnicalTestDto } from "./technical-tests.dto";
import {
  generateScenario,
  TechTestScenario,
} from "./engine/scenario-generator";
import { AiScenarioGeneratorService } from "../ai/ai-scenario-generator.service";
import { ROLE_TO_TRACK, FREE_TIER, sanitiseTags } from "../../common/constants";
import { computeGrade } from "../../common/grade.util";
import { isActivePremium } from "../../common/subscription.util";

interface SubmissionEvaluation {
  overallScore: number;
  maxPossible: number;
  percentage: number;
  grade: string;
  criteriaScores: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  strengths: string[];
  improvements: string[];
  requirementsCovered: number;
  requirementsTotal: number;
  requirementsMissed: string[];
  wordCount: number;
  summary: string;
}

@Injectable()
export class TechnicalTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiScenarioGenerator: AiScenarioGeneratorService,
  ) {}

  private isTechTestScenario(value: unknown): value is TechTestScenario {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;

    return (
      typeof record.title === "string" &&
      Array.isArray(record.requirements) &&
      Array.isArray(record.evaluationCriteria)
    );
  }

  private toInputJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private parseScenario(value: Prisma.JsonValue): TechTestScenario {
    if (!this.isTechTestScenario(value)) {
      throw new NotFoundException("Technical test scenario is invalid");
    }
    return value;
  }

  /** List all technical tests for a user */
  async getTests(userId: string) {
    return this.prisma.technicalTest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  /** Get a single test by id */
  async getTest(userId: string, testId: string) {
    const test = await this.prisma.technicalTest.findFirst({
      where: { id: testId, userId },
    });
    if (!test) throw new NotFoundException("Technical test not found");
    return test;
  }

  /** Generate a new technical test scenario */
  async createTest(userId: string, dto: CreateTechnicalTestDto) {
    // Enforce monthly limit for free users
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException("User not found");

    const isPremium = isActivePremium(user);

    // Sanitize and normalize tags — the DB and generators store lowercase tags
    const tags = sanitiseTags(dto.tags ?? []).map((t) => t.toLowerCase());

    // Try the hardcoded template engine first
    let scenario: TechTestScenario = generateScenario({
      roleFocus: dto.roleFocus,
      level: dto.level,
      difficulty: dto.difficulty,
      tags,
    });

    // If we want more variety for premium users, periodically use AI (~25% chance)
    // or if the template feels like a weak match (no tag overlap), use AI
    const templateTagMatch = this.countTagOverlap(scenario, tags);
    const shouldUseAi = templateTagMatch === 0 || Math.random() < 0.25;

    if (shouldUseAi) {
      const aiScenario = await this.aiScenarioGenerator.generateScenario(
        {
          roleFocus: dto.roleFocus,
          level: dto.level,
          difficulty: dto.difficulty,
          tags,
        },
        userId,
      );
      if (aiScenario) {
        scenario = aiScenario;
      }
    }

    const createData = {
      userId,
      title: scenario.title,
      track: ROLE_TO_TRACK[dto.roleFocus] ?? "fullstack",
      level: dto.level,
      difficulty: dto.difficulty,
      roleFocus: dto.roleFocus,
      tags,
      scenario: this.toInputJson(scenario),
      status: "not_started",
    };

    const test = isPremium
      ? await this.prisma.technicalTest.create({ data: createData })
      : await this.prisma.$transaction(
          async (tx) => {
            const monthStart = new Date();
            monthStart.setUTCDate(1);
            monthStart.setUTCHours(0, 0, 0, 0);

            const testCount = await tx.technicalTest.count({
              where: { userId, createdAt: { gte: monthStart } },
            });

            if (testCount >= FREE_TIER.monthlyTechTests) {
              throw new ForbiddenException(
                `Free users are limited to ${FREE_TIER.monthlyTechTests} technical tests per month. Upgrade to Premium for unlimited tests.`,
              );
            }

            return tx.technicalTest.create({ data: createData });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

    return test;
  }

  /**
   * Count how many of the user's selected tags appear in the scenario text.
   * Used to decide if the hardcoded template is a good match.
   */
  private countTagOverlap(scenario: TechTestScenario, tags: string[]): number {
    const scenarioText = JSON.stringify(scenario).toLowerCase();
    return tags.filter((t) => scenarioText.includes(t.toLowerCase())).length;
  }

  /** Start the test — sets startedAt and status */
  async startTest(userId: string, testId: string) {
    const test = await this.getTest(userId, testId);
    if (test.status !== "not_started") {
      return test; // Already started
    }

    return this.prisma.technicalTest.update({
      where: { id: testId },
      data: {
        status: "in_progress",
        startedAt: new Date(),
      },
    });
  }

  /** Submit the user's solution */
  async submitTest(userId: string, testId: string, submission: string) {
    const test = await this.getTest(userId, testId);
    if (test.status === "submitted" || test.status === "evaluated") {
      return test; // Already submitted
    }

    const scenario = this.parseScenario(test.scenario);
    const evaluation = this.evaluateSubmission(submission, scenario);

    return this.prisma.technicalTest.update({
      where: { id: testId },
      data: {
        status: "submitted",
        submission,
        submittedAt: new Date(),
        evaluation: this.toInputJson(evaluation),
      },
    });
  }

  /** Delete a test */
  async deleteTest(userId: string, testId: string) {
    await this.getTest(userId, testId); // Verify ownership
    return this.prisma.technicalTest.delete({ where: { id: testId } });
  }

  /**
   * Evaluate the submission against the scenario's evaluation criteria.
   * This is a heuristic-based evaluation — in a real product you'd use AI.
   * It checks length, keyword coverage, structure, and effort indicators.
   */
  private evaluateSubmission(
    submission: string,
    scenario: TechTestScenario,
  ): SubmissionEvaluation {
    const criteria: { name: string; weight: number; description: string }[] =
      scenario.evaluationCriteria ?? [];
    const requirements: { key: string; text: string }[] =
      scenario.requirements ?? [];
    const submissionLower = submission.toLowerCase();
    const wordCount = submission.split(/\s+/).filter(Boolean).length;

    // Heuristic scoring per criterion
    const criteriaScores = criteria.map((c) => {
      let score = 0;
      const maxScore = c.weight;

      // Base score from submission length/effort
      if (wordCount >= 500) score += maxScore * 0.3;
      else if (wordCount >= 200) score += maxScore * 0.2;
      else if (wordCount >= 50) score += maxScore * 0.1;

      // Check for structural indicators
      const structureKeywords = [
        "```",
        "function",
        "class",
        "interface",
        "import",
        "export",
        "const ",
        "let ",
        "def ",
        "public ",
        "private ",
        "describe(",
        "it(",
        "test(",
        "CREATE TABLE",
        "SELECT",
        "INSERT",
        "docker",
        "dockerfile",
        "readme",
        "documentation",
      ];
      const structureHits = structureKeywords.filter((k) =>
        submissionLower.includes(k.toLowerCase()),
      ).length;
      score += Math.min(maxScore * 0.3, structureHits * (maxScore * 0.05));

      // Check for requirement keyword coverage
      const reqKeywords = requirements.map((r) => r.key.toLowerCase());
      const reqHits = reqKeywords.filter((k) =>
        submissionLower.includes(k),
      ).length;
      const reqCoverage =
        reqKeywords.length > 0 ? reqHits / reqKeywords.length : 0;
      score += maxScore * 0.2 * reqCoverage;

      // Check for criterion-specific keywords
      const criterionWords = c.name.toLowerCase().split(/\s+/);
      const criterionHits = criterionWords.filter((w) =>
        submissionLower.includes(w),
      ).length;
      score += Math.min(
        maxScore * 0.2,
        (criterionHits / Math.max(criterionWords.length, 1)) * maxScore * 0.2,
      );

      return {
        name: c.name,
        score: Math.round(Math.min(score, maxScore) * 10) / 10,
        maxScore,
        description: c.description,
      };
    });

    const overallScore = criteriaScores.reduce((s, c) => s + c.score, 0);
    const maxPossible = criteriaScores.reduce((s, c) => s + c.maxScore, 0);
    const percentage =
      maxPossible > 0 ? Math.round((overallScore / maxPossible) * 100) : 0;

    const grade = computeGrade(percentage);

    // Generate feedback
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (wordCount >= 300)
      strengths.push("Thorough submission with good detail and explanation.");
    if (submissionLower.includes("```"))
      strengths.push("Included code examples demonstrating implementation.");
    if (submissionLower.includes("test") || submissionLower.includes("spec"))
      strengths.push("Mentioned or included testing approach.");
    if (
      submissionLower.includes("trade") ||
      submissionLower.includes("decision")
    )
      strengths.push("Discussed trade-offs and architectural decisions.");
    if (submissionLower.includes("error") || submissionLower.includes("edge"))
      strengths.push("Considered error handling and edge cases.");

    if (wordCount < 100)
      improvements.push(
        "Submission is very brief — provide more detail about your approach, implementation, and reasoning.",
      );
    if (!submissionLower.includes("```"))
      improvements.push(
        "Include code snippets or pseudocode to demonstrate your implementation.",
      );
    if (!submissionLower.includes("test") && !submissionLower.includes("spec"))
      improvements.push(
        "Discuss your testing strategy — what would you test and how?",
      );
    if (
      !submissionLower.includes("trade") &&
      !submissionLower.includes("decision") &&
      !submissionLower.includes("why")
    )
      improvements.push(
        "Explain WHY you made certain choices — trade-off analysis is crucial.",
      );

    const reqsMissed = requirements
      .filter((r) => !submissionLower.includes(r.key.toLowerCase()))
      .map((r) => r.key);

    return {
      overallScore,
      maxPossible,
      percentage,
      grade,
      criteriaScores,
      strengths,
      improvements,
      requirementsCovered: requirements.length - reqsMissed.length,
      requirementsTotal: requirements.length,
      requirementsMissed: reqsMissed,
      wordCount,
      summary:
        percentage >= 70
          ? "Strong submission that covers the core requirements well. Review the improvement suggestions to push it further."
          : percentage >= 40
            ? "Good effort with room for improvement. Focus on the missed requirements and add more implementation detail."
            : "The submission needs significantly more detail. Review the requirements carefully and expand your solution with code, explanations, and trade-off analysis.",
    };
  }
}
