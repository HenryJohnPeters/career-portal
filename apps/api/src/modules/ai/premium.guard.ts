import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../auth/auth.guard";
import { AiUsageService } from "./ai-usage.service";
import { FREE_TIER } from "../../common/constants";

/**
 * Per-user AI request cooldown (in-memory).
 * Prevents accidental double-fires from rapid clicks, network retries, etc.
 * Keyed by `userId:path` to allow parallel use of different AI features.
 */
const AI_COOLDOWN_MS = 10_000; // 10 seconds
const recentRequests = new Map<string, number>();

// Periodically clean up stale entries (every 60s) to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentRequests) {
    if (now - ts > AI_COOLDOWN_MS * 2) recentRequests.delete(key);
  }
}, 60_000).unref();

/**
 * Allows premium users unlimited access.
 * Allows free users up to FREE_TIER.monthlyAiActions AI actions per month.
 * Throws ForbiddenException when the free cap is reached.
 * Also enforces a short per-user cooldown to prevent duplicate AI requests.
 *
 * CRITICAL: Checks both isPremium flag AND stripeCurrentPeriodEnd timestamp
 * to prevent expired premium users from accessing premium features.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly aiUsage: AiUsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;
    if (!userId) throw new ForbiddenException("Not authenticated");

    // Check quota before setting cooldown so a quota error doesn't block retries
    const allowed = await this.aiUsage.canUseAi(userId);
    if (!allowed) {
      throw new ForbiddenException(
        `You've reached your free monthly limit of ${FREE_TIER.monthlyAiActions} AI uses. Upgrade to Premium for unlimited AI-powered tools.`,
      );
    }

    // Per-user cooldown — prevents accidental double-fire
    const cooldownKey = `${userId}:${request.path}`;
    const lastRequest = recentRequests.get(cooldownKey);
    if (lastRequest && Date.now() - lastRequest < AI_COOLDOWN_MS) {
      throw new HttpException(
        "Please wait before making another AI request.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recentRequests.set(cooldownKey, Date.now());

    return true;
  }
}
