import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.guard";
import { CooldownException } from "../../common/errors";
import { AiUsageService } from "./ai-usage.service";

/**
 * Debounce for repeated clicks on the same AI route. In-memory, so it is per
 * API instance; the DB-backed limits in AiUsageService.reserve (quota, fair
 * use, attempt cap, in-flight cap) are what actually bound spend.
 */
const AI_COOLDOWN_MS = 3_000;
const recentRequests = new Map<string, number>();

setInterval(() => {
  const cutoff = Date.now() - AI_COOLDOWN_MS;
  for (const [key, at] of recentRequests) {
    if (at < cutoff) recentRequests.delete(key);
  }
}, 60_000).unref();

/**
 * Guard for AI routes (apply after AuthGuard). Despite the name it does not
 * require premium: it fails fast when the user's AI quota / fair-use limits
 * are already used up (403 quota_exceeded, 429 fair_use_limit), then applies a
 * short per-user, per-route cooldown (429 cooldown).
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly aiUsage: AiUsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;
    if (!userId) throw new UnauthorizedException("Not authenticated");

    // Quota first, so a refused request does not start a cooldown.
    await this.aiUsage.precheck(userId);

    // Route pattern (e.g. /cv/sections/:id/ai-generate), so changing the id,
    // case or a trailing slash does not reset the cooldown.
    const route = (request.route as { path?: unknown } | undefined)?.path;
    const key = `${userId}:${typeof route === "string" ? route : request.path.toLowerCase()}`;
    const now = Date.now();
    const last = recentRequests.get(key);
    if (last !== undefined && now - last < AI_COOLDOWN_MS) {
      throw new CooldownException((AI_COOLDOWN_MS - (now - last)) / 1000);
    }
    recentRequests.set(key, now);
    return true;
  }
}
