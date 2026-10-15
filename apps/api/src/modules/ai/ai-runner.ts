import {
  BadGatewayException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import OpenAI from "openai";
import type { ZodType, ZodTypeDef } from "zod";
import { OPENAI_CLIENT } from "./openai.provider";
import {
  AI_CALL_PROFILES,
  AI_ERROR_MESSAGES,
  type AiCallProfile,
} from "./ai.constants";
import { parseCompletion } from "./ai-json";
import type { AiTokenUsage } from "./ai.types";

export interface AiJsonRequest<T> {
  /** Short label for logs, e.g. "cv-section". Never user content. */
  label: string;
  model: string;
  system: string;
  user: string;
  /** Validates and normalises the parsed JSON object. */
  schema: ZodType<T, ZodTypeDef, unknown>;
  maxTokens: number;
  temperature: number;
  /** "long" = 90s and no automatic retry; "short" (default) = 45s, one retry. */
  profile?: AiCallProfile;
  /** Called with token counts whenever a completion came back (billed), even if it is then rejected. */
  onUsage?: (usage: AiTokenUsage) => void;
}

export type UpstreamFailureKind =
  | "timeout"
  | "connection"
  | "rate_limited"
  | "quota_exhausted"
  | "misconfigured"
  | "rejected"
  | "server"
  | "unknown";

export interface UpstreamFailure {
  kind: UpstreamFailureKind;
  status?: number;
  code?: string;
  type?: string;
  requestId?: string;
}

/** Classify an OpenAI SDK error by status/code only (never its message, which can echo request details). */
export function classifyUpstreamError(error: unknown): UpstreamFailure {
  if (error instanceof OpenAI.APIConnectionTimeoutError) return { kind: "timeout" };
  if (error instanceof OpenAI.APIConnectionError) return { kind: "connection" };
  if (!(error instanceof OpenAI.APIError)) return { kind: "unknown" };

  const meta = {
    status: error.status,
    code: error.code ?? undefined,
    type: error.type,
    requestId: error.requestID ?? undefined,
  };
  const status = error.status ?? 0;
  if (status === 429) {
    return {
      kind: error.code === "insufficient_quota" ? "quota_exhausted" : "rate_limited",
      ...meta,
    };
  }
  if (status === 401 || status === 403 || status === 404) {
    return { kind: "misconfigured", ...meta };
  }
  if (status === 400 || status === 409 || status === 413 || status === 422) {
    return { kind: "rejected", ...meta };
  }
  if (status >= 500) return { kind: "server", ...meta };
  return { kind: "unknown", ...meta };
}

/** Safe client-facing exception for an upstream failure. */
export function upstreamFailureToHttp(failure: UpstreamFailure): HttpException {
  return failure.kind === "rejected"
    ? new BadGatewayException(AI_ERROR_MESSAGES.rejected)
    : new ServiceUnavailableException(AI_ERROR_MESSAGES.unavailable);
}

/**
 * The single OpenAI entry point: JSON mode, schema validation, per-call
 * timeouts, safe error mapping and token reporting. Logs carry the label,
 * model, status/code and sizes only — never prompts or outputs (they hold
 * CVs and other personal data).
 */
@Injectable()
export class AiRunner {
  private readonly logger = new Logger(AiRunner.name);

  constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

  async runJson<T>(request: AiJsonRequest<T>): Promise<T> {
    const started = Date.now();
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await this.openai.chat.completions.create(
        {
          model: request.model,
          temperature: request.temperature,
          max_completion_tokens: request.maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
        },
        AI_CALL_PROFILES[request.profile ?? "short"],
      );
    } catch (error) {
      throw this.handleUpstreamError(error, request, Date.now() - started);
    }

    const usage = completion.usage;
    if (usage) {
      request.onUsage?.({
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
      });
    }

    const choice = completion.choices[0];
    const result = parseCompletion(
      {
        content: choice?.message?.content,
        finishReason: choice?.finish_reason,
        refusal: choice?.message?.refusal,
      },
      request.schema,
    );
    const stats = `model=${request.model} finish=${choice?.finish_reason ?? "none"} tokens=${usage?.prompt_tokens ?? "?"}/${usage?.completion_tokens ?? "?"} chars=${choice?.message?.content?.length ?? 0} ms=${Date.now() - started}`;

    if (!result.ok) {
      this.logger.warn(`AI ${request.label} output rejected (${result.failure}): ${stats}`);
      throw result.failure === "refusal" || result.failure === "content_filter"
        ? new UnprocessableEntityException(AI_ERROR_MESSAGES.filtered)
        : new BadGatewayException(AI_ERROR_MESSAGES.invalidOutput);
    }

    this.logger.log(`AI ${request.label} ok: ${stats}`);
    return result.value;
  }

  private handleUpstreamError(
    error: unknown,
    request: AiJsonRequest<unknown>,
    elapsedMs: number,
  ): HttpException {
    const failure = classifyUpstreamError(error);
    const line = `AI ${request.label} upstream ${failure.kind}: model=${request.model} status=${failure.status ?? "-"} code=${failure.code ?? "-"} type=${failure.type ?? "-"} request_id=${failure.requestId ?? "-"} ms=${elapsedMs}`;

    if (failure.kind === "quota_exhausted" || failure.kind === "misconfigured") {
      // Every AI request fails until someone fixes the OpenAI account or config.
      this.logger.error(`CRITICAL ${line}`);
    } else if (failure.kind === "unknown") {
      // A stack starts with the error message, which for an upstream HTTP error
      // can echo request content: keep it only for local (non-HTTP) errors.
      const stack =
        error instanceof Error && !(error instanceof OpenAI.APIError)
          ? error.stack
          : undefined;
      this.logger.error(line, stack);
    } else {
      this.logger.warn(line);
    }
    return upstreamFailureToHttp(failure);
  }
}
