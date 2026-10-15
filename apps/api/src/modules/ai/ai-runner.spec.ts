import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BadGatewayException,
  HttpException,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import OpenAI from "openai";
import { z } from "zod";
import { AiRunner, classifyUpstreamError, upstreamFailureToHttp } from "./ai-runner";
import { AI_CALL_PROFILES, AI_ERROR_MESSAGES } from "./ai.constants";
import { DEFAULT_AI_MODELS, resolveModelName } from "./ai-models";

Logger.overrideLogger(false);

type CreateFn = (body: Record<string, unknown>, options: Record<string, unknown>) => Promise<unknown>;

function runnerWith(create: CreateFn): AiRunner {
  const client = { chat: { completions: { create } } } as unknown as OpenAI;
  return new AiRunner(client);
}

function completion(content: string | null, finishReason = "stop") {
  return {
    choices: [{ message: { content, refusal: null }, finish_reason: finishReason }],
    usage: { prompt_tokens: 120, completion_tokens: 30 },
  };
}

const schema = z
  .object({ content: z.string() })
  .transform(({ content }) => content.trim());

const request = {
  label: "test",
  model: "gpt-test",
  system: "sys",
  user: "usr",
  schema,
  maxTokens: 500,
  temperature: 0.2,
};

function apiError(status: number, body: Record<string, unknown> = {}) {
  return OpenAI.APIError.generate(
    status,
    { error: { message: "secret upstream detail proj_123", ...body } },
    undefined,
    new Headers({ "x-request-id": "req_abc" }),
  );
}

async function rejectsWith(promise: Promise<unknown>): Promise<HttpException> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof HttpException, "expected an HttpException");
    return error;
  }
  assert.fail("expected a rejection");
}

describe("AiRunner.runJson", () => {
  test("uses JSON mode, the given model and the per-call profile; reports tokens", async () => {
    let seenBody: Record<string, unknown> = {};
    let seenOptions: Record<string, unknown> = {};
    const runner = runnerWith(async (body, options) => {
      seenBody = body;
      seenOptions = options;
      return completion('{"content":" hi "}');
    });
    const usage: unknown[] = [];
    const value = await runner.runJson({ ...request, profile: "long", onUsage: (u) => usage.push(u) });

    assert.equal(value, "hi");
    assert.deepEqual(seenBody.response_format, { type: "json_object" });
    assert.equal(seenBody.model, "gpt-test");
    assert.equal(seenBody.max_completion_tokens, 500);
    assert.deepEqual(seenOptions, AI_CALL_PROFILES.long);
    assert.deepEqual(usage, [{ promptTokens: 120, completionTokens: 30 }]);
  });

  test("a cut-off completion is a 502 but its tokens are still reported", async () => {
    const usage: unknown[] = [];
    const runner = runnerWith(async () => completion('{"content":"partial"}', "length"));
    const error = await rejectsWith(runner.runJson({ ...request, onUsage: (u) => usage.push(u) }));
    assert.ok(error instanceof BadGatewayException);
    assert.equal(error.message, AI_ERROR_MESSAGES.invalidOutput);
    assert.equal(usage.length, 1);
  });

  test("filtered output is a 422 with a safe message", async () => {
    const runner = runnerWith(async () => completion(null, "content_filter"));
    const error = await rejectsWith(runner.runJson(request));
    assert.ok(error instanceof UnprocessableEntityException);
  });

  test("upstream errors never leak their message", async () => {
    for (const status of [400, 401, 429, 500]) {
      const runner = runnerWith(async () => {
        throw apiError(status);
      });
      const error = await rejectsWith(runner.runJson(request));
      assert.ok(!JSON.stringify(error.getResponse()).includes("proj_123"));
      assert.ok([502, 503].includes(error.getStatus()));
    }
  });
});

describe("classifyUpstreamError", () => {
  test("separates quota exhaustion from rate limiting", () => {
    assert.equal(classifyUpstreamError(apiError(429, { code: "insufficient_quota" })).kind, "quota_exhausted");
    const limited = classifyUpstreamError(apiError(429, { code: "rate_limit_exceeded" }));
    assert.equal(limited.kind, "rate_limited");
    assert.equal(limited.requestId, "req_abc");
  });

  test("maps statuses and connection errors", () => {
    assert.equal(classifyUpstreamError(apiError(401)).kind, "misconfigured");
    assert.equal(classifyUpstreamError(apiError(404)).kind, "misconfigured");
    assert.equal(classifyUpstreamError(apiError(400)).kind, "rejected");
    assert.equal(classifyUpstreamError(apiError(503)).kind, "server");
    assert.equal(classifyUpstreamError(new OpenAI.APIConnectionTimeoutError()).kind, "timeout");
    assert.equal(classifyUpstreamError(new OpenAI.APIConnectionError({})).kind, "connection");
    assert.equal(classifyUpstreamError(new Error("boom")).kind, "unknown");
  });

  test("only request rejections become 502; everything else is a 503", () => {
    assert.ok(upstreamFailureToHttp({ kind: "rejected" }) instanceof BadGatewayException);
    for (const kind of ["timeout", "rate_limited", "quota_exhausted", "server", "unknown"] as const) {
      const error = upstreamFailureToHttp({ kind });
      assert.ok(error instanceof ServiceUnavailableException);
      assert.equal(error.message, AI_ERROR_MESSAGES.unavailable);
    }
  });
});

describe("resolveModelName", () => {
  test("uses the configured model and falls back to defaults for blank values", () => {
    const env: Record<string, string> = { OPENAI_MODEL_STANDARD: " gpt-x ", OPENAI_MODEL_LIGHT: "  " };
    assert.equal(resolveModelName("standard", (k) => env[k]), "gpt-x");
    assert.equal(resolveModelName("light", (k) => env[k]), DEFAULT_AI_MODELS.light);
    assert.equal(resolveModelName("standard", () => undefined), "gpt-4o");
    assert.equal(resolveModelName("light", () => undefined), "gpt-4o-mini");
  });
});
