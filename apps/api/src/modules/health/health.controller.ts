import { Controller, Get, Logger, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { PrismaService } from "../../common/prisma.service";
import { SKIP_ALL_THROTTLERS } from "../../common/throttler.config";

const DB_PING_TIMEOUT_MS = 2_000;

/**
 * Probes for the platform (Railway healthcheckPath) and uptime monitors.
 * Unauthenticated, never throttled, and fine without an Origin header.
 */
@ApiExcludeController()
@SkipThrottle(SKIP_ALL_THROTTLERS)
@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Readiness: 200 `{ status: "ok", db: "ok" }`, or 503 when the database is unreachable. */
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    if (await this.databaseReachable()) return { status: "ok", db: "ok" };
    res.status(503);
    return { status: "error", db: "error" };
  }

  /** Liveness: the process is up and serving HTTP (no dependencies checked). */
  @Get("live")
  live() {
    return { status: "ok" };
  }

  private async databaseReachable(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("timed out")),
        DB_PING_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
      return true;
    } catch (err) {
      this.logger.warn(
        `Database health check failed: ${err instanceof Error ? err.message.split("\n")[0] : "unknown"}`,
      );
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
