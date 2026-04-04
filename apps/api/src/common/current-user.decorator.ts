import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Extract the authenticated userId from the request object.
 * The AuthGuard sets `request.userId` after verifying the JWT.
 *
 * Usage:
 *   @Get() getStuff(@CurrentUserId() userId: string) { ... }
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ userId?: unknown }>();
    if (typeof request.userId !== "string" || request.userId.length === 0) {
      throw new UnauthorizedException("Not authenticated");
    }
    return request.userId;
  },
);
