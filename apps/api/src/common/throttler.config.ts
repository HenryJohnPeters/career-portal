import type { ThrottlerOptions } from "@nestjs/throttler";

/**
 * The two global throttlers (PLAN §0 contract). Both count per route per
 * client IP (`req.ip`, which honours TRUST_PROXY_HOPS):
 * - `default`: sustained rate. Override per route with
 *   `@Throttle({ default: { limit, ttl } })`.
 * - `burst`: short spikes, e.g. a script hammering one endpoint.
 * Only these names are read by ThrottlerGuard; decorators using any other
 * name are silently ignored.
 */
export const THROTTLER_NAMES = ["default", "burst"] as const;
export type ThrottlerName = (typeof THROTTLER_NAMES)[number];

export const THROTTLERS: ThrottlerOptions[] = [
  { name: "default", ttl: 60_000, limit: 300 },
  { name: "burst", ttl: 1_000, limit: 25 },
];

/** `@SkipThrottle(SKIP_ALL_THROTTLERS)` exempts a route from every throttler. */
export const SKIP_ALL_THROTTLERS: Record<ThrottlerName, true> = {
  default: true,
  burst: true,
};

/** Per-route limit for expensive or sensitive account actions (export, delete). */
export const ACCOUNT_ACTION_THROTTLE = {
  default: { limit: 3, ttl: 60 * 60_000 },
} as const;
