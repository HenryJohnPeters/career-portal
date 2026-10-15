import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { EnvConfig } from "../../common/env.config";
import { AI_CALL_PROFILES } from "./ai.constants";

/** Internal to the AI module: every call goes through AiRunner, which sets per-call timeouts. */
export const OPENAI_CLIENT = Symbol("OPENAI_CLIENT");

export const OpenAiProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: (config: ConfigService<EnvConfig, true>) =>
    new OpenAI({
      apiKey: config.get("OPENAI_API_KEY"),
      ...AI_CALL_PROFILES.long,
    }),
  inject: [ConfigService],
};
