import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateTechnicalTestDto } from "./technical-tests.dto";
import { generateScenario } from "./engine/scenario-generator";
import { AiScenarioGeneratorService } from "../ai/ai-scenario-generator.service";
import { ROLE_TO_TRACK } from "../../common/constants";
import { computeGrade } from "../../common/grade.util";

@Injectable()
export class TechnicalTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiScenarioGenerator: AiScenarioGeneratorService
  ) {}

  /** List all technical tests for a user */
  async getTests(userId: string) {
    return this.prisma.technicalTest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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

  /** Generate a new technical test scenario (premium only) */
  async createTest(userId: string, dto: CreateTechnicalTestDto) {
    // Enforce premium-only
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isPremium) {
      throw new ForbiddenException(
        "Technical tests are a Premium feature. Upgrade to access take-home test scenarios."
      );
    }

    // Normalize tags to lowercase — the DB and generators store lowercase tags
    const tags = (dto.tags ?? []).map((t) => t.toLowerCase());

    // Try the hardcoded template engine first
    let scenario: any = generateScenario({
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
        userId
      );
      if (aiScenario) {
        scenario = aiScenario;
      }
    }

    const test = await this.prisma.technicalTest.create({
      data: {
        userId,
        title: scenario.title,
        track: ROLE_TO_TRACK[dto.roleFocus] ?? "fullstack",
        level: dto.level,
        difficulty: dto.difficulty,
        roleFocus: dto.roleFocus,
        tags,
        timeLimit: dto.timeLimit ?? 60,
        scenario: scenario as any,
        status: "not_started",
      },
    });

    return test;
  }

  /**
   * Count how many of the user's selected tags appear in the scenario text.
   * Used to decide if the hardcoded template is a good match.
   */
  private countTagOverlap(scenario: any, tags: string[]): number {
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

    const scenario = test.scenario as any;
    const evaluation = this.evaluateSubmission(submission, scenario);

    return this.prisma.technicalTest.update({
      where: { id: testId },
      data: {
        status: "submitted",
        submission,
        submittedAt: new Date(),
        evaluation: evaluation as any,
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
  private evaluateSubmission(submission: string, scenario: any) {
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
        submissionLower.includes(k.toLowerCase())
      ).length;
      score += Math.min(maxScore * 0.3, structureHits * (maxScore * 0.05));

      // Check for requirement keyword coverage
      const reqKeywords = requirements.map((r) => r.key.toLowerCase());
      const reqHits = reqKeywords.filter((k) =>
        submissionLower.includes(k)
      ).length;
      const reqCoverage =
        reqKeywords.length > 0 ? reqHits / reqKeywords.length : 0;
      score += maxScore * 0.2 * reqCoverage;

      // Check for criterion-specific keywords
      const criterionWords = c.name.toLowerCase().split(/\s+/);
      const criterionHits = criterionWords.filter((w) =>
        submissionLower.includes(w)
      ).length;
      score += Math.min(
        maxScore * 0.2,
        (criterionHits / Math.max(criterionWords.length, 1)) * maxScore * 0.2
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

    const grade = this.computeGrade(percentage);

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
        "Submission is very brief — provide more detail about your approach, implementation, and reasoning."
      );
    if (!submissionLower.includes("```"))
      improvements.push(
        "Include code snippets or pseudocode to demonstrate your implementation."
      );
    if (!submissionLower.includes("test") && !submissionLower.includes("spec"))
      improvements.push(
        "Discuss your testing strategy — what would you test and how?"
      );
    if (
      !submissionLower.includes("trade") &&
      !submissionLower.includes("decision") &&
      !submissionLower.includes("why")
    )
      improvements.push(
        "Explain WHY you made certain choices — trade-off analysis is crucial."
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

  private computeGrade(percentage: number): string {
    return computeGrade(percentage);
  }
}
