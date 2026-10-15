// === Auth & account (PLAN §2.3) ===

export type PlanName = "free" | "premium";

/** GET /auth/me */
export interface User {
  id: string;
  email: string;
  name: string;
  /** Raw Stripe-synced flag. Prefer `plan` (server-computed) for gating. */
  isPremium: boolean;
  stripeCurrentPeriodEnd: string | null;
  /** Effective plan computed by the server (subscription status + period end). */
  plan: PlanName;
  isTrialing: boolean;
  createdAt: string;
  onboardingDismissedAt: string | null;
}

/**
 * Whether the user currently has Premium. Uses the server-computed `plan`
 * so the device clock never decides access; falls back to the legacy
 * flag + period-end check for payloads without `plan`.
 */
export function isActivePremium(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.plan) return user.plan === "premium";
  if (!user.isPremium || !user.stripeCurrentPeriodEnd) return false;
  return new Date() < new Date(user.stripeCurrentPeriodEnd);
}

/** PATCH /account/profile */
export interface UpdateProfileRequest {
  /** 1..80 characters after trimming. */
  name: string;
}

/** DELETE /account — `confirmEmail` must equal the account email (case-insensitive). */
export interface DeleteAccountRequest {
  confirmEmail: string;
}

export interface DeleteAccountResponse {
  deleted: true;
}

/** POST /account/onboarding/dismiss */
export interface DismissOnboardingResponse {
  dismissed: true;
}
