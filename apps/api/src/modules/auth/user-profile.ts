import type { Prisma } from "@prisma/client";
import { resolvePlan, type PlanName } from "../../common/plan";

/** Display names: PATCH /account/profile accepts 1..80 characters. */
export const MAX_DISPLAY_NAME_LENGTH = 80;

/** The shared `User` (libs/shared/types auth.ts): GET /auth/me, PATCH /account/profile. */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  /** Server-computed (same as `plan === "premium"`), never the raw Stripe flag. */
  isPremium: boolean;
  stripeCurrentPeriodEnd: string | null;
  plan: PlanName;
  isTrialing: boolean;
  createdAt: string;
  onboardingDismissedAt: string | null;
}

export const USER_RESPONSE_SELECT = {
  id: true,
  email: true,
  name: true,
  isPremium: true,
  stripeCurrentPeriodEnd: true,
  subscriptionStatus: true,
  cancelAtPeriodEnd: true,
  createdAt: true,
  onboardingDismissedAt: true,
} as const satisfies Prisma.UserSelect;

export type UserResponseRow = Prisma.UserGetPayload<{
  select: typeof USER_RESPONSE_SELECT;
}>;

/**
 * Plan fields come from the same rules every quota check uses (period end,
 * renewal grace, cancel-at-period-end), so the UI never decides premium with
 * the device clock.
 */
export function toUserResponse(user: UserResponseRow): UserResponse {
  const plan = resolvePlan(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isPremium: plan.isPremium,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString() ?? null,
    plan: plan.plan,
    isTrialing: plan.isPremium && plan.isTrialing,
    createdAt: user.createdAt.toISOString(),
    onboardingDismissedAt: user.onboardingDismissedAt?.toISOString() ?? null,
  };
}

/** Collapses runs of whitespace (including newlines and tabs) and trims. */
export function collapseWhitespace(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * A display name from untrusted text (e.g. Supabase user_metadata): control
 * characters dropped, whitespace collapsed, capped. Empty when nothing is left.
 */
export function cleanDisplayName(raw: string): string {
  return collapseWhitespace(raw.replace(/\p{Cc}/gu, " ")).slice(
    0,
    MAX_DISPLAY_NAME_LENGTH,
  );
}

/** Name for a new account without one: the email's local part, else "User". */
export function defaultDisplayName(email: string): string {
  return cleanDisplayName(email.split("@")[0] ?? "") || "User";
}
