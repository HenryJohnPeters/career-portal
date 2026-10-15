import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ModelTier } from "../../common/plan";

/** Defaults when OPENAI_MODEL_STANDARD / OPENAI_MODEL_LIGHT are unset. */
export const DEFAULT_AI_MODELS: Readonly<Record<ModelTier, string>> = {
  standard: "gpt-4o",
  light: "gpt-4o-mini",
};

const MODEL_ENV_KEYS: Readonly<Record<ModelTier, string>> = {
  standard: "OPENAI_MODEL_STANDARD",
  light: "OPENAI_MODEL_LIGHT",
};

/** Configured model for a tier; blank or missing values fall back to the default. */
export function resolveModelName(
  tier: ModelTier,
  read: (key: string) => unknown,
): string {
  const configured = read(MODEL_ENV_KEYS[tier]);
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : DEFAULT_AI_MODELS[tier];
}

/**
 * Model names per tier: free users and background work use the light model,
 * premium users the standard one (PLAN §1.1). Must be chat models that accept
 * `temperature` and JSON mode.
 */
@Injectable()
export class AiModelConfig {
  private readonly models: Readonly<Record<ModelTier, string>>;

  constructor(config: ConfigService) {
    const read = (key: string) => config.get<string>(key);
    this.models = {
      standard: resolveModelName("standard", read),
      light: resolveModelName("light", read),
    };
  }

  modelFor(tier: ModelTier): string {
    return this.models[tier];
  }
}
