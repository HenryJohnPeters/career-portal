import { Module, Global } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiUsageService } from "./ai-usage.service";
import { AiQuestionGeneratorService } from "./ai-question-generator.service";
import { AiScenarioGeneratorService } from "./ai-scenario-generator.service";
import { AiModelConfig } from "./ai-models";
import { AiRunner } from "./ai-runner";
import { PremiumGuard } from "./premium.guard";
import { OpenAiProvider } from "./openai.provider";

/**
 * The OpenAI client and AiRunner stay internal, so every AI call goes through
 * usage accounting, model-tier selection and safe error mapping.
 */
@Global()
@Module({
  providers: [
    OpenAiProvider,
    AiModelConfig,
    AiRunner,
    AiService,
    AiUsageService,
    AiQuestionGeneratorService,
    AiScenarioGeneratorService,
    PremiumGuard,
  ],
  exports: [
    AiService,
    AiUsageService,
    AiQuestionGeneratorService,
    AiScenarioGeneratorService,
    PremiumGuard,
  ],
})
export class AiModule {}
