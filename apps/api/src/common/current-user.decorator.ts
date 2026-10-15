import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * The local User id resolved by AuthGuard (`request.userId`). Only use it on
 * routes behind `@UseGuards(AuthGuard)`; without the guard it throws 401.
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
