import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { EnvConfig } from "../../common/env.config";

export const OPENAI_CLIENT = Symbol("OPENAI_CLIENT");

export const OpenAiProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: (config: ConfigService<EnvConfig, true>) =>
    new OpenAI({
      apiKey: config.get("OPENAI_API_KEY"),
      timeout: 30_000, // 30-second timeout prevents hung connections
      maxRetries: 1, // At most 1 automatic retry on transient errors
    }),
  inject: [ConfigService],
};
