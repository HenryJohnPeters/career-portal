import { Module, Global } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiUsageService } from "./ai-usage.service";
import { AiQuestionGeneratorService } from "./ai-question-generator.service";
import { AiScenarioGeneratorService } from "./ai-scenario-generator.service";
import { PremiumGuard } from "./premium.guard";
import { OpenAiProvider, OPENAI_CLIENT } from "./openai.provider";

@Global()
@Module({
  providers: [
    OpenAiProvider,
    AiService,
    AiUsageService,
    AiQuestionGeneratorService,
    AiScenarioGeneratorService,
    PremiumGuard,
  ],
  exports: [
    OPENAI_CLIENT,
    AiService,
    AiUsageService,
    AiQuestionGeneratorService,
    AiScenarioGeneratorService,
    PremiumGuard,
  ],
})
export class AiModule {}
