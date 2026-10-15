/*
 * Friendly, non-enumerating messages for Supabase Auth errors. Raw Supabase
 * messages are never shown: they can name internal settings, and some
 * reveal whether an email address has an account.
 */

export type AuthAction =
  | "signIn"
  | "signUp"
  | "resetRequest"
  | "resend"
  | "updatePassword"
  | "updateEmail"
  | "reauthenticate";

/** The fields of auth-js's AuthError (and its subclasses) this module reads. */
export interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
  /** AuthWeakPasswordError */
  reasons?: string[];
}

export const SUPPORT_EMAIL = "support@career-repo.com";

const GENERIC = "Something went wrong. Please try again.";
const NETWORK = "We couldn't reach the sign-in service. Check your connection and try again.";
const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";
const EMAIL_RATE_LIMITED =
  "We've sent several emails recently. Please wait a few minutes before asking for another.";
const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

function asAuthError(error: unknown): AuthErrorLike {
  if (typeof error === "object" && error !== null) return error as AuthErrorLike;
  return { message: typeof error === "string" ? error : undefined };
}

function includes(message: string, ...fragments: string[]): boolean {
  const lower = message.toLowerCase();
  return fragments.some((fragment) => lower.includes(fragment));
}

function isNetworkError(error: AuthErrorLike, message: string): boolean {
  return (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    includes(message, "failed to fetch", "networkerror", "network request failed", "load failed")
  );
}

function weakPasswordMessage(reasons: string[] | undefined): string {
  if (reasons?.includes("pwned")) {
    return "This password has appeared in a known data breach. Please choose a different one.";
  }
  if (reasons?.includes("characters")) {
    return "Choose a stronger password: mix upper- and lower-case letters, numbers and symbols.";
  }
  if (reasons?.includes("length")) return "That password is too short. Please choose a longer one.";
  return "That password is too weak. Please choose a stronger one.";
}

export function isEmailNotConfirmedError(error: unknown): boolean {
  const e = asAuthError(error);
  return e.code === "email_not_confirmed" || includes(e.message ?? "", "email not confirmed");
}

/** A user-facing message for any error returned or thrown by supabase.auth. */
export function authErrorMessage(error: unknown, action: AuthAction): string {
  const e = asAuthError(error);
  const code = e.code ?? "";
  const message = e.message ?? "";

  if (isNetworkError(e, message)) return NETWORK;

  if (code === "invalid_credentials" || includes(message, "invalid login credentials")) {
    return action === "reauthenticate"
      ? "Your current password is incorrect."
      : "Incorrect email or password.";
  }
  if (isEmailNotConfirmedError(e)) {
    return "Please confirm your email address first. Check your inbox for the confirmation link.";
  }
  if (
    code === "over_email_send_rate_limit" ||
    includes(message, "email rate limit", "for security purposes, you can only request")
  ) {
    return EMAIL_RATE_LIMITED;
  }
  if (code === "over_request_rate_limit" || e.status === 429 || includes(message, "too many requests", "rate limit")) {
    return RATE_LIMITED;
  }
  // Before the weak-password check: "New password should be different…" also contains "password should".
  if (code === "same_password" || includes(message, "should be different from the old password")) {
    return "Your new password must be different from your current one.";
  }
  if (code === "weak_password" || e.name === "AuthWeakPasswordError" || includes(message, "password should")) {
    return weakPasswordMessage(e.reasons);
  }
  if (code === "user_already_exists" || code === "email_exists" || includes(message, "already registered", "already been registered")) {
    return action === "updateEmail"
      ? "We couldn't change your email to that address. Please use a different one."
      : "We couldn't create an account with that email. If you already have one, sign in or reset your password.";
  }
  if (code === "signup_disabled" || includes(message, "signups not allowed")) {
    return "New sign-ups are currently closed. Please try again later.";
  }
  if (code === "email_address_invalid" || includes(message, "invalid format", "unable to validate email")) {
    return "Please enter a valid email address.";
  }
  if (code === "email_address_not_authorized") {
    return "We can't send email to that address right now. Please use a different one.";
  }
  if (code === "reauthentication_needed" || code === "reauthentication_not_valid") {
    return "For your security, please sign out and sign in again, then retry.";
  }
  if (code === "otp_expired" || includes(message, "has expired", "is invalid or has expired")) {
    return "This link has expired or has already been used.";
  }
  if (
    code === "session_not_found" ||
    code === "session_expired" ||
    code === "refresh_token_not_found" ||
    code === "refresh_token_already_used" ||
    code === "bad_jwt" ||
    includes(message, "auth session missing")
  ) {
    return SESSION_EXPIRED;
  }
  if (code === "user_banned") {
    return `This account has been suspended. Contact ${SUPPORT_EMAIL} for help.`;
  }
  if (code === "captcha_failed") return "Verification failed. Please try again.";
  if (code === "request_timeout" || e.status === 504) {
    return "The sign-in service took too long to respond. Please try again.";
  }
  return GENERIC;
}

/** Copy for errors Supabase puts in an email link's redirect (`error_code`). */
export function authLinkErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case "otp_expired":
      return "This link has expired or has already been used. Email links work once and expire after a while, and some email security scanners open them before you do.";
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return "This link was opened in a different browser or has expired. Please request a new one and open it on this device.";
    case "user_banned":
      return `This account has been suspended. Contact ${SUPPORT_EMAIL} for help.`;
    case "network":
      return "We couldn't reach the sign-in service to verify this link. Check your connection, then request a new link.";
    default:
      return "This link is invalid or has expired.";
  }
}
