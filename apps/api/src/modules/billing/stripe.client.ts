import {
  ConflictException,
  Logger,
  ServiceUnavailableException,
  type FactoryProvider,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

export const STRIPE_CLIENT = Symbol("STRIPE_CLIENT");
export const BILLING_CONFIG = Symbol("BILLING_CONFIG");

/** Stripe's maximum `trial_period_days`. */
const MAX_TRIAL_DAYS = 730;

export interface BillingConfig {
  /** Price used for new checkouts. */
  priceId: string;
  /**
   * Prices that grant premium: STRIPE_PRICE_ID plus the optional comma-separated
   * STRIPE_PREMIUM_PRICE_IDS, so existing subscribers keep premium after a price change.
   */
  premiumPriceIds: ReadonlySet<string>;
  webhookSecret: string;
  clientUrl: string;
  /** STRIPE_TRIAL_DAYS; 0 disables trials. */
  trialDays: number;
}

/** Whole days in [0, 730]; anything else disables trials. */
export function parseTrialDays(raw: unknown): number {
  const days = typeof raw === "number" ? raw : Number(raw ?? 0);
  return Number.isInteger(days) && days > 0 && days <= MAX_TRIAL_DAYS
    ? days
    : 0;
}

export function parsePremiumPriceIds(
  priceId: string,
  extra: string | undefined,
): ReadonlySet<string> {
  const ids = (extra ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return new Set([priceId, ...ids]);
}

export const billingProviders: FactoryProvider[] = [
  {
    provide: BILLING_CONFIG,
    inject: [ConfigService],
    useFactory: (config: ConfigService): BillingConfig => {
      const priceId = config.getOrThrow<string>("STRIPE_PRICE_ID");
      return {
        priceId,
        premiumPriceIds: parsePremiumPriceIds(
          priceId,
          config.get<string>("STRIPE_PREMIUM_PRICE_IDS"),
        ),
        webhookSecret: config.getOrThrow<string>("STRIPE_WEBHOOK_SECRET"),
        clientUrl: config.getOrThrow<string>("CLIENT_URL"),
        trialDays: parseTrialDays(config.get("STRIPE_TRIAL_DAYS")),
      };
    },
  },
  {
    provide: STRIPE_CLIENT,
    inject: [ConfigService],
    useFactory: (config: ConfigService): Stripe =>
      new Stripe(config.getOrThrow<string>("STRIPE_SECRET_KEY"), {
        apiVersion: "2026-01-28.clover",
        // Fail fast: the web client gives up after 30s and Stripe expects a
        // prompt webhook response.
        timeout: 10_000,
        maxNetworkRetries: 2,
        appInfo: { name: "career-portal" },
      }),
  },
];

/* Stripe errors are matched by `type`/`code`/`param`, never by message text. */

interface StripeErrorLike {
  type?: unknown;
  code?: unknown;
  param?: unknown;
}

function asStripeError(err: unknown): StripeErrorLike | null {
  return typeof err === "object" && err !== null
    ? (err as StripeErrorLike)
    : null;
}

/** The referenced object does not exist (deleted, or from the other mode/account). */
export function isStripeResourceMissing(err: unknown, param?: string): boolean {
  const e = asStripeError(err);
  return (
    e?.type === "StripeInvalidRequestError" &&
    e.code === "resource_missing" &&
    (param === undefined || e.param === param)
  );
}

function isStripeError(
  e: StripeErrorLike | null,
): e is { type: string; code?: unknown } {
  return typeof e?.type === "string" && e.type.startsWith("Stripe");
}

/** Log-safe label: Stripe type and code, or the error class name; never the message. */
export function errorLabel(err: unknown): string {
  const e = asStripeError(err);
  if (isStripeError(e)) {
    return `${e.type}${typeof e.code === "string" ? ` (${e.code})` : ""}`;
  }
  return err instanceof Error ? err.name : typeof err;
}

/**
 * Converts a Stripe failure on a user-facing route into a safe HTTP error and
 * logs the Stripe type/code. Non-Stripe errors are returned unchanged.
 */
export function toBillingHttpError(
  err: unknown,
  logger: Logger,
  operation: string,
): unknown {
  const e = asStripeError(err);
  if (!isStripeError(e)) return err;

  logger.error(`Stripe ${errorLabel(err)} during ${operation}`);
  if (e.type === "StripeIdempotencyError") {
    return new ConflictException(
      "A billing request is already in progress. Please try again in a moment.",
    );
  }
  return new ServiceUnavailableException(
    "Billing is temporarily unavailable. Please try again shortly.",
  );
}

/** Id of an expandable Stripe reference. */
export function stripeIdOf(
  ref: string | { id: string } | null | undefined,
): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}
