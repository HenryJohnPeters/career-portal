import {
  Controller,
  Headers,
  Logger,
  Post,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiExcludeController } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { createHash, timingSafeEqual } from "crypto";
import type { Response } from "express";
import { AiQuestionGeneratorService } from "../ai/ai-question-generator.service";

/** How long the request waits for the fill before answering 202 and letting it finish. */
const FILL_WAIT_MS = 20_000;

export type Settled<T> =
  | { state: "fulfilled"; value: T }
  | { state: "rejected"; error: unknown }
  | { state: "pending" };

/** Settles `promise` or reports it still pending after `ms`; never rejects. */
export async function settleWithin<T>(promise: Promise<T>, ms: number): Promise<Settled<T>> {
  let timer: NodeJS.Timeout | undefined;
  const pending = new Promise<Settled<T>>((resolve) => {
    timer = setTimeout(() => resolve({ state: "pending" }), ms);
  });
  try {
    return await Promise.race([
      promise.then(
        (value): Settled<T> => ({ state: "fulfilled", value }),
        (error: unknown): Settled<T> => ({ state: "rejected", error }),
      ),
      pending,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Constant-time comparison of the presented key with the configured one. */
export function adminKeyMatches(provided: string | undefined, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

/**
 * Operator endpoint for schedulers: fills thin tag-free question pools.
 * Authenticated by the `x-admin-key` header (ADMIN_API_KEY; disabled when
 * unset) and limited to one call per minute per client.
 */
@ApiExcludeController()
@Controller("interview-prep/admin")
export class InterviewAdminController {
  private readonly logger = new Logger(InterviewAdminController.name);

  constructor(
    private readonly generator: AiQuestionGeneratorService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 200 with the counts when the fill finishes within 20s; otherwise 202 while
   * it keeps running in the background. 409 while another fill is running.
   */
  @Post("background-fill")
  @Throttle({ default: { limit: 1, ttl: 60_000 } })
  async backgroundFill(
    @Headers("x-admin-key") adminKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!adminKeyMatches(adminKey, this.config.get<string>("ADMIN_API_KEY"))) {
      throw new UnauthorizedException("Invalid or missing admin API key");
    }

    const run = this.generator.backgroundFill();
    const outcome = await settleWithin(run, FILL_WAIT_MS);
    if (outcome.state === "rejected") throw outcome.error;
    if (outcome.state === "fulfilled") {
      res.status(200);
      return { data: { status: "completed", ...outcome.value } };
    }

    run.then(
      (result) =>
        this.logger.log(
          `Background fill finished: ${result.combosProcessed} combos, ${result.questionsGenerated} questions`,
        ),
      (error: unknown) =>
        this.logger.warn(
          `Background fill failed: ${error instanceof Error ? error.name : "unknown error"}`,
        ),
    );
    res.status(202);
    return { data: { status: "running" } };
  }
}
