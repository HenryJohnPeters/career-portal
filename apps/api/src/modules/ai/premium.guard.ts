import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { AiUsageService } from "./ai-usage.service";
import { FREE_TIER_MONTHLY_AI_LIMIT } from "../../common/constants";

/**
 * Allows premium users unlimited access.
 * Allows free users up to FREE_TIER_MONTHLY_AI_LIMIT AI actions per month.
 * Throws ForbiddenException when the free cap is reached.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly aiUsage: AiUsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.userId as string | undefined;
    if (!userId) throw new ForbiddenException("Not authenticated");

    const allowed = await this.aiUsage.canUseAi(userId);
    if (!allowed) {
      throw new ForbiddenException(
        `You've reached your free monthly limit of ${FREE_TIER_MONTHLY_AI_LIMIT} AI uses. Upgrade to Premium for unlimited AI-powered tools.`
      );
    }
    return true;
  }
}
