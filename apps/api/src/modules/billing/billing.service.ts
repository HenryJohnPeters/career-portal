import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { User } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../common/prisma.service";
import { isActivePremium } from "../../common/subscription.util";
import {
  hasPaymentIssue,
  isTrialEligible,
  toSubscriptionStatus,
  type SubscriptionStatus,
} from "./billing-state.util";
import {
  canReusePendingCheckout,
  checkoutExpiresAt,
  checkoutIdempotencyKey,
  customerIdempotencyKey,
  isCheckoutSessionOwnedBy,
  isCheckoutSessionTerminal,
} from "./checkout-session.util";
import {
  BILLING_CONFIG,
  STRIPE_CLIENT,
  isStripeResourceMissing,
  stripeIdOf,
  toBillingHttpError,
  type BillingConfig,
} from "./stripe.client";
import { SubscriptionSyncService } from "./subscription-sync.service";

const NO_BILLING_ACCOUNT = "No billing account found for this user.";

/** User-facing billing operations (controller and account deletion). */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SubscriptionSyncService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @Inject(BILLING_CONFIG) private readonly config: BillingConfig,
  ) {}

  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const user = await this.sync.syncUser(userId, "status_read");
    return toSubscriptionStatus(user, this.config.trialDays);
  }

  /**
   * Stripe Checkout URL, or the billing portal when an existing subscription
   * awaits payment (fixing it there avoids a second, double-billed subscription).
   */
  async createCheckoutSession(userId: string): Promise<{ url: string }> {
    try {
      return await this.openCheckout(userId);
    } catch (err) {
      throw toBillingHttpError(err, this.logger, "checkout");
    }
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const { stripeCustomerId } = await this.sync.getUser(userId);
    if (!stripeCustomerId) throw new BadRequestException(NO_BILLING_ACCOUNT);
    try {
      return { url: await this.portalUrl(stripeCustomerId) };
    } catch (err) {
      if (isStripeResourceMissing(err, "customer")) {
        await this.sync.detachCustomer(stripeCustomerId, "portal");
        throw new BadRequestException(NO_BILLING_ACCOUNT);
      }
      throw toBillingHttpError(err, this.logger, "portal");
    }
  }

  /** Called from the checkout success redirect, so premium never waits for the webhook. */
  async verifyCheckoutSession(
    userId: string,
    sessionId: string,
  ): Promise<SubscriptionStatus> {
    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      if (isStripeResourceMissing(err)) {
        throw new BadRequestException("Unknown checkout session.");
      }
      throw toBillingHttpError(err, this.logger, "checkout verify");
    }

    if (!isCheckoutSessionOwnedBy(session, userId)) {
      throw new BadRequestException(
        "Checkout session does not belong to the current user.",
      );
    }
    if (session.mode !== "subscription") {
      throw new BadRequestException(
        "Checkout session is not a subscription session.",
      );
    }
    if (isCheckoutSessionTerminal(session.status)) {
      await this.sync.clearPendingCheckout(session.id);
    }
    const customerId = stripeIdOf(session.customer);
    if (
      session.status === "complete" &&
      customerId &&
      (await this.sync.linkCustomer(userId, customerId, "checkout_verify")) ===
        "other_user"
    ) {
      throw new BadRequestException(
        "Checkout session customer is linked to a different user.",
      );
    }

    try {
      const user = await this.sync.syncUser(userId, "checkout_verify", true);
      return toSubscriptionStatus(user, this.config.trialDays);
    } catch (err) {
      throw toBillingHttpError(err, this.logger, "checkout verify");
    }
  }

  /**
   * Account deletion (PLAN §2.4): immediately cancels every subscription that
   * has not ended. No-op without a Stripe customer or when the customer is
   * gone. Throws (503) if Stripe cannot confirm, so no data is deleted while
   * billing is still active.
   */
  async cancelSubscriptionsForAccountDeletion(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, stripeCheckoutSessionId: true },
    });
    if (!user?.stripeCustomerId) return;

    let cancelled: string[];
    try {
      // Expire an open checkout first so a payment finished in another tab
      // cannot start a subscription after the account is gone.
      if (user.stripeCheckoutSessionId) {
        await this.expireCheckoutIfOpen(user.stripeCheckoutSessionId);
      }
      cancelled = await this.sync.cancelLiveSubscriptions(user.stripeCustomerId);
    } catch (err) {
      throw toBillingHttpError(err, this.logger, "account deletion");
    }
    await this.sync.audit(
      userId,
      "billing.cancelled_for_account_deletion",
      "account_deletion",
      { cancelledSubscriptions: cancelled.length },
    );
  }

  private async expireCheckoutIfOpen(sessionId: string): Promise<void> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === "open") {
        await this.stripe.checkout.sessions.expire(sessionId);
      }
    } catch (err) {
      // Already gone in Stripe: nothing left that could be completed.
      if (!isStripeResourceMissing(err)) throw err;
    }
  }

  private async openCheckout(userId: string): Promise<{ url: string }> {
    // Always fresh from Stripe: stale state here is how double subscriptions happen.
    const { user, subscriptions } = await this.sync.reconcile(
      await this.sync.getUser(userId),
      "checkout",
    );
    if (isActivePremium(user)) {
      throw new BadRequestException("You already have an active subscription.");
    }
    if (
      user.stripeCustomerId &&
      subscriptions?.some((s) => hasPaymentIssue(s.status))
    ) {
      return { url: await this.portalUrl(user.stripeCustomerId) };
    }

    const customerId =
      user.stripeCustomerId && subscriptions !== null
        ? user.stripeCustomerId
        : await this.createCustomer(user);

    const pendingUrl = await this.reusablePendingCheckout(user, customerId);
    if (pendingUrl) return { url: pendingUrl };

    try {
      return await this.createSession(user, customerId);
    } catch (err) {
      if (!isStripeResourceMissing(err, "customer")) throw err;
      // The stored customer was deleted in Stripe: continue with a new one.
      const replacement = await this.createCustomer({
        ...user,
        stripeCustomerId: customerId,
      });
      return this.createSession(user, replacement);
    }
  }

  /**
   * Creates a customer for the user, replacing `user.stripeCustomerId` (null,
   * or a customer missing from Stripe). Concurrent calls converge on one id.
   */
  private async createCustomer(user: User): Promise<string> {
    const customer = await this.stripe.customers.create(
      { email: user.email, name: user.name, metadata: { userId: user.id } },
      { idempotencyKey: customerIdempotencyKey(user) },
    );
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, stripeCustomerId: user.stripeCustomerId },
      data: {
        stripeCustomerId: customer.id,
        stripeCheckoutSessionId: null,
        stripeCheckoutSessionExpiresAt: null,
      },
    });
    if (count === 1) return customer.id;
    const current = await this.sync.getUser(user.id);
    return current.stripeCustomerId ?? customer.id;
  }

  private async reusablePendingCheckout(
    user: User,
    customerId: string,
  ): Promise<string | null> {
    const sessionId = user.stripeCheckoutSessionId;
    const expiresAt = user.stripeCheckoutSessionExpiresAt;
    if (!sessionId || (expiresAt && expiresAt.getTime() <= Date.now())) {
      return null;
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      if (isStripeResourceMissing(err)) return null;
      throw err;
    }
    if (canReusePendingCheckout(session, { userId: user.id, customerId })) {
      return session.url;
    }
    if (session.status === "open") {
      // Superseded (e.g. the customer was replaced): it must not stay payable.
      await this.stripe.checkout.sessions
        .expire(session.id)
        .catch(() => undefined);
    }
    return null;
  }

  private async createSession(
    user: User,
    customerId: string,
  ): Promise<{ url: string }> {
    const nowMs = Date.now();
    const { priceId, clientUrl } = this.config;
    const trialDays = isTrialEligible(user, this.config.trialDays)
      ? this.config.trialDays
      : 0;

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        metadata: { userId: user.id },
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        expires_at: checkoutExpiresAt(nowMs),
        subscription_data: {
          metadata: { userId: user.id },
          ...(trialDays > 0 && {
            trial_period_days: trialDays,
            trial_settings: {
              end_behavior: { missing_payment_method: "cancel" },
            },
          }),
        },
        success_url: `${clientUrl}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/app/billing?cancelled=true`,
      },
      {
        idempotencyKey: checkoutIdempotencyKey({
          userId: user.id,
          customerId,
          priceId,
          trialDays,
          nowMs,
        }),
      },
    );
    if (!session.url) {
      throw new ServiceUnavailableException(
        "Could not start checkout. Please try again.",
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCheckoutSessionId: session.id,
        stripeCheckoutSessionExpiresAt: new Date(session.expires_at * 1000),
      },
    });
    return { url: session.url };
  }

  private async portalUrl(customerId: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.config.clientUrl}/app/billing`,
    });
    return session.url;
  }
}
