import { Injectable, Inject, Logger } from "@nestjs/common";
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
    const tagsStr =
      input.tags.length > 0
        ? input.tags.join(", ")
        : `general ${input.roleFocus} technologies`;

    const systemPrompt = `You are a senior engineering manager who creates take-home technical tests for developer candidates. You create realistic, in-depth scenarios that test real-world engineering skills.

Return a valid JSON object with this EXACT shape:
{
  "title": "string — catchy project title",
  "companyContext": "string — 2-3 sentences about the fictional company",
  "brief": "string — 2-3 sentence project brief using **markdown bold** for tech stack",
  "background": "string — 2-3 sentences of project background/context",
  "requirements": [{ "key": "string — short label", "text": "string — detailed requirement" }],
  "nonFunctional": ["string — non-functional requirement"],
  "acceptanceCriteria": ["string — specific testable criterion"],
  "bonusChallenges": ["string — stretch goal"],
  "evaluationCriteria": [{ "name": "string", "weight": number (10-30), "description": "string" }],
  "hints": ["string — helpful hint"],
  "estimatedTime": "string — e.g. '3-5 hours'",
  "deliverables": ["string — what to submit"],
  "constraints": ["string — technical constraint"]
}

RULES:
- Role focus: ${input.roleFocus} (frontend/backend/fullstack/platform)
- Level: ${input.level} (junior = 3-5 requirements, mid = 5-7, senior = 6-9)
- Difficulty: ${input.difficulty}
- Tech stack: ${tagsStr}
- Create a REALISTIC scenario — something a real company would actually ask
- Requirements should be specific and testable, not vague
- Evaluation criteria weights must sum to 100
- Include 4-6 requirements, 3-5 non-functional requirements, 4-6 acceptance criteria
- Include 3-4 bonus challenges, 3-4 hints, 3-4 deliverables, 2-4 constraints
- Do NOT return code fences or any text outside the JSON object`;

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
