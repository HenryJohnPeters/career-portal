import { Injectable, Inject, Logger, ForbiddenException } from "@nestjs/common";
import OpenAI from "openai";
import { AiUsageService } from "./ai-usage.service";
import { OPENAI_CLIENT } from "./openai.provider";
import { sanitiseTags } from "../../common/constants";
import type { TechTestScenario } from "../technical-tests/engine/scenario-generator";

export interface ScenarioGenerationInput {
  roleFocus: string;
  level: string;
  difficulty: string;
  tags: string[];
}

@Injectable()
export class AiScenarioGeneratorService {
  private readonly logger = new Logger(AiScenarioGeneratorService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly aiUsage: AiUsageService,
  ) {}

  /**
   * Generate a rich technical test scenario via AI.
   * This is used when the hardcoded templates don't cover the tag combo.
   */
  private isTechTestScenario(value: unknown): value is TechTestScenario {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;

    const hasString = (key: string) => typeof record[key] === "string";
    const hasStringArray = (key: string) =>
      Array.isArray(record[key]) &&
      (record[key] as unknown[]).every((item) => typeof item === "string");

    const hasRequirements =
      Array.isArray(record.requirements) &&
      record.requirements.every(
        (req) =>
          typeof req === "object" &&
          req !== null &&
          typeof (req as Record<string, unknown>).key === "string" &&
          typeof (req as Record<string, unknown>).text === "string",
      );

    const hasEvaluationCriteria =
      Array.isArray(record.evaluationCriteria) &&
      record.evaluationCriteria.every(
        (criterion) =>
          typeof criterion === "object" &&
          criterion !== null &&
          typeof (criterion as Record<string, unknown>).name === "string" &&
          typeof (criterion as Record<string, unknown>).weight === "number" &&
          typeof (criterion as Record<string, unknown>).description ===
            "string",
      );

    return (
      hasString("title") &&
      hasString("companyContext") &&
      hasString("brief") &&
      hasString("background") &&
      hasRequirements &&
      hasStringArray("nonFunctional") &&
      hasStringArray("acceptanceCriteria") &&
      hasStringArray("bonusChallenges") &&
      hasEvaluationCriteria &&
      hasStringArray("hints") &&
      hasString("estimatedTime") &&
      hasStringArray("deliverables") &&
      hasStringArray("constraints")
    );
  }

  async generateScenario(
    input: ScenarioGenerationInput,
    userId: string,
  ): Promise<TechTestScenario | null> {
    const safeTags = sanitiseTags(input.tags);
    const tagsStr =
      safeTags.length > 0
        ? safeTags.join(", ")
        : `general ${input.roleFocus} technologies`;

    const systemPrompt = `Senior engineering manager creating realistic take-home technical tests. Return ONLY a valid JSON object — no code fences, no extra text:
{"title":"","companyContext":"","brief":"","background":"","requirements":[{"key":"","text":""}],"nonFunctional":[""],"acceptanceCriteria":[""],"bonusChallenges":[""],"evaluationCriteria":[{"name":"","weight":0,"description":""}],"hints":[""],"estimatedTime":"","deliverables":[""],"constraints":[""]}

Role: ${input.roleFocus} | Level: ${input.level} (junior=3-5 reqs, mid=5-7, senior=6-9) | Difficulty: ${input.difficulty} | Stack: ${tagsStr}
- Realistic scenario a real company would actually use. Requirements must be specific and testable.
- evaluationCriteria weights must sum to 100.
- Counts: 4-6 requirements, 3-5 nonFunctional, 4-6 acceptanceCriteria, 3-4 bonusChallenges, 3-4 hints, 3-4 deliverables, 2-4 constraints.
- brief: use **bold** for tech stack names.`;

    const userPrompt = `Create a ${input.difficulty} ${input.level}-level take-home technical test for a ${input.roleFocus} developer using ${tagsStr}.`;

    try {
      return await this.aiUsage.withReservation(
        userId,
        "scenario-generation",
        async () => {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.85,
            max_tokens: 3000,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          const raw = response.choices[0]?.message?.content?.trim() || "{}";
          const cleaned = raw
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

          const parsed = JSON.parse(cleaned) as unknown;
          if (!this.isTechTestScenario(parsed)) {
            throw new Error("AI scenario missing required fields");
          }

          return parsed;
        },
      );
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error("Scenario generation failed", error);
      return null;
    }
  }
}
