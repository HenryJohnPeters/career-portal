import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { DAY_MS } from "../../common/plan";
import { EntitlementsService } from "../entitlements/entitlements.service";
import type { TechTestScenario } from "../technical-tests/engine/scenario-generator";
import { AiRunner } from "./ai-runner";
import { AiUsageService } from "./ai-usage.service";
import { AI_ACTIONS } from "./ai.constants";
import { catalogTags } from "./ai-tags";
import type { ScenarioGenerationInput } from "./ai.types";
import {
  buildScenarioPrompt,
  isValidScenarioInput,
  scenarioSchema,
} from "./prompts/tech-test.prompts";

export type { ScenarioGenerationInput } from "./ai.types";

/** Max AI scenarios per user in a trailing 24h window; beyond it the template engine is used. */
const SCENARIO_DAILY_CAP = 10;
/** Max stack tags sent to the model. */
const MAX_SCENARIO_TAGS = 15;

/**
 * AI-written take-home scenarios for premium users. Returns null whenever AI
 * should not or cannot be used (free plan, daily cap, quota/fair-use limits,
 * model or validation failure) so the caller falls back to the template engine
 * and test creation never fails because of AI.
 */
@Injectable()
export class AiScenarioGeneratorService {
  private readonly logger = new Logger(AiScenarioGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: AiRunner,
    private readonly usage: AiUsageService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async generateScenario(
    input: ScenarioGenerationInput,
    userId: string,
  ): Promise<TechTestScenario | null> {
    if (!isValidScenarioInput(input)) return null;
    try {
      const plan = await this.entitlements.getPlan(userId);
      if (!plan.isPremium) return null;

      const recent = await this.prisma.aiUsage.count({
        where: {
          userId,
          action: AI_ACTIONS.scenarioGeneration,
          createdAt: { gte: new Date(Date.now() - DAY_MS) },
        },
      });
      if (recent >= SCENARIO_DAILY_CAP) return null;

      const prompt = buildScenarioPrompt(
        input,
        catalogTags(input.tags, MAX_SCENARIO_TAGS),
      );
      return await this.usage.withReservation(
        userId,
        AI_ACTIONS.scenarioGeneration,
        (ctx) =>
          this.runner.runJson({
            label: AI_ACTIONS.scenarioGeneration,
            model: ctx.model,
            system: prompt.system,
            user: prompt.user,
            schema: scenarioSchema,
            maxTokens: prompt.maxTokens,
            temperature: 0.7,
            profile: "long",
            onUsage: ctx.recordTokens,
          }),
      );
    } catch (error) {
      const name = error instanceof Error ? error.name : "unknown error";
      this.logger.warn(`AI scenario unavailable, using a template (${name})`);
      return null;
    }
  }
}
