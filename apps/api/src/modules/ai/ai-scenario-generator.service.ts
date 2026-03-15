import { Injectable, Inject, Logger, ForbiddenException } from "@nestjs/common";
import OpenAI from "openai";
import { AiUsageService } from "./ai-usage.service";
import { OPENAI_CLIENT } from "./openai.provider";

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
    private readonly aiUsage: AiUsageService
  ) {}

  /**
   * Generate a rich technical test scenario via AI.
   * This is used when the hardcoded templates don't cover the tag combo.
   */
  async generateScenario(
    input: ScenarioGenerationInput,
    userId: string
  ): Promise<any | null> {
    // Enforce monthly AI limit
    const canUse = await this.aiUsage.canUseAi(userId);
    if (!canUse) {
      throw new ForbiddenException(
        "You have reached your monthly AI limit. Upgrade to Premium for unlimited AI usage."
      );
    }

    const tagsStr =
      input.tags.length > 0
        ? input.tags.join(", ")
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

      try {
        const parsed = JSON.parse(cleaned);
        // Validate required fields
        if (
          !parsed.title ||
          !parsed.brief ||
          !Array.isArray(parsed.requirements)
        ) {
          this.logger.error("AI scenario missing required fields");
          return null;
        }

        // Record AI usage
        await this.aiUsage.recordUsage(userId, "scenario-generation");

        return parsed;
      } catch {
        this.logger.error(
          "Failed to parse AI scenario JSON",
          cleaned.slice(0, 200)
        );
        return null;
      }
    } catch (error) {
      this.logger.error("OpenAI scenario generation failed", error);
      return null;
    }
  }
}
