import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../common/prisma.service";
import { isActivePremium } from "../../common/subscription.util";
import type { EnvConfig } from "../../common/env.config";
import {
  isEntitledSubscriptionStatus,
  pickMostRelevantSubscription,
} from "./billing-state.util";

const WEBHOOK_EVENT_STALE_MS = 15 * 60 * 1000;
const STATUS_SYNC_COOLDOWN_MS = 15 * 1000;

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  /**
   * In-memory set of recently processed Stripe event IDs.
   * Prevents duplicate processing when Stripe retries webhooks.
   * Entries expire after 5 minutes — well beyond Stripe's retry window.
   */
  private readonly processedEvents = new Map<string, number>();

  /**
   * Short per-user sync cooldown so UI polling does not spam Stripe.
   */
  private readonly recentStatusSync = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {
    this.stripe = new Stripe(this.config.get("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-01-28.clover",
    });

    // Clean up stale entries every 60s
    setInterval(() => {
      const cutoff = Date.now() - 5 * 60 * 1000;
      for (const [id, ts] of this.processedEvents) {
        if (ts < cutoff) this.processedEvents.delete(id);
      }

      const syncCutoff = Date.now() - STATUS_SYNC_COOLDOWN_MS;
      for (const [userId, ts] of this.recentStatusSync) {
        if (ts < syncCutoff) this.recentStatusSync.delete(userId);
      }
    }, 60_000).unref();
  }

  /* ──────────────────────── helpers ──────────────────────── */

  /**
   * Write a structured audit log entry for a billing event.
   * Never throws — audit failures must not break the webhook flow.
   */
  private async writeAuditLog(
    userId: string,
    action: string,
    reason?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          reason,
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.logger.error(`AuditLog write failed for ${userId}/${action}`, err);
    }
  }

  /**
   * Extract the current_period_end from the first subscription item.
   * In Stripe API 2026-01-28, current_period_end lives on SubscriptionItem, not Subscription.
   */
  private getItemPeriodEnd(subscription: Stripe.Subscription): Date {
    const item = subscription.items.data[0] as
      | (Stripe.SubscriptionItem & { current_period_end?: number })
      | undefined;
    if (item?.current_period_end) {
      return new Date(item.current_period_end * 1000);
    }

    const sub = subscription as Stripe.Subscription & {
      current_period_end?: number;
    };
    if (sub.current_period_end) {
      return new Date(sub.current_period_end * 1000);
    }

    // Fallback: use the subscription's start_date + 30 days
    return new Date(subscription.start_date * 1000 + 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * Extract the subscription ID from an Invoice (v20 moved it to parent.subscription_details).
   */
  private getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const sub = invoice.parent?.subscription_details?.subscription;
    if (sub) return typeof sub === "string" ? sub : sub.id;

    const legacy = (invoice as Stripe.Invoice & { subscription?: unknown })
      .subscription;
    if (!legacy) return null;
    return typeof legacy === "string"
      ? legacy
      : ((legacy as { id?: string }).id ?? null);
  }

  private getSubscriptionCustomerId(
    subscription: Stripe.Subscription,
  ): string | null {
    return typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  }

  private getSubscriptionPriceId(
    subscription: Stripe.Subscription,
  ): string | null {
    return subscription.items.data[0]?.price?.id ?? null;
  }

  private isAllowedPremiumPrice(priceId: string | null): boolean {
    return !!priceId && priceId === this.config.get("STRIPE_PRICE_ID");
  }

  /**
   * Find user by subscription ID, falling back to customer ID or metadata userId.
   * Handles the case where subscription.updated fires before checkout.completed
   * has linked the subscription ID to the user.
   */
  private async findUserBySubscription(
    subscriptionId: string,
    subscription: Stripe.Subscription,
  ) {
    // Primary: lookup by subscription ID
    let user = await this.prisma.user.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (user) return user;

    // Fallback 1: lookup by customer ID
    const customerId = this.getSubscriptionCustomerId(subscription);
    if (customerId) {
      user = await this.prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (user) return user;
    }

    // Fallback 2: lookup by userId in subscription metadata
    const userId = subscription.metadata?.userId;
    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) return user;
    }

    this.logger.warn(
      `No user found for subscription ${subscriptionId} (customer: ${customerId ?? "unknown"})`,
    );
    return null;
  }

  private async retrieveSubscriptionOrNull(
    subscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes("No such subscription") ||
        message.includes("resource_missing")
      ) {
        return null;
      }
      throw err;
    }
  }

  private async listCustomerSubscriptions(
    customerId: string,
  ): Promise<Stripe.Subscription[]> {
    const list = await this.stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    return list.data.sort((a, b) => b.created - a.created);
  }

  private formatStatusReason(
    status: Stripe.Subscription.Status,
    source: string,
  ): string {
    return `${source}_${status}`;
  }

  private mapUserStatus(user: {
    isPremium: boolean;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: Date | null;
  }) {
    return {
      isPremium: isActivePremium(user),
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    };
  }

  private async applySubscriptionState(
    userId: string,
    subscription: Stripe.Subscription,
    source: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Cannot apply subscription state, user missing: ${userId}`);
      return;
    }

    const customerId = this.getSubscriptionCustomerId(subscription);
    const priceId = this.getSubscriptionPriceId(subscription);
    const periodEnd = this.getItemPeriodEnd(subscription);
    const entitledByStatus = isEntitledSubscriptionStatus(subscription.status);
    const entitledByPrice = this.isAllowedPremiumPrice(priceId);
    const isPremium = entitledByStatus && entitledByPrice;

    if (customerId) {
      const existingUser = await this.prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (existingUser && existingUser.id !== userId) {
        this.logger.error(
          `Refusing to attach customer ${customerId} to user ${userId}; already linked to ${existingUser.id}`,
        );
        return;
      }
    }

    const wasPremium = isActivePremium(user);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium,
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    if (!entitledByPrice && entitledByStatus) {
      await this.writeAuditLog(userId, "premium.price_mismatch", source, {
        subscriptionId: subscription.id,
        status: subscription.status,
        priceId,
        expectedPriceId: this.config.get("STRIPE_PRICE_ID"),
      });
      this.logger.warn(
        `Subscription ${subscription.id} has unrecognised price ${priceId}; premium not granted`,
      );
    }

    if (!wasPremium && isPremium) {
      await this.writeAuditLog(
        userId,
        "premium.upgraded",
        this.formatStatusReason(subscription.status, source),
        {
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          periodEnd,
        },
      );
    } else if (wasPremium && !isPremium) {
      await this.writeAuditLog(
        userId,
        "premium.downgraded",
        this.formatStatusReason(subscription.status, source),
        {
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          periodEnd,
        },
      );
    }
  }

  private async clearSubscriptionState(
    userId: string,
    source: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const wasPremium = isActivePremium(user);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });

    if (wasPremium) {
      await this.writeAuditLog(userId, "premium.downgraded", source, {
        previousSubscriptionId: user.stripeSubscriptionId,
      });
    }
  }

  private async syncUserSubscriptionState(
    userId: string,
    source: string,
    force = false,
  ) {
    const now = Date.now();
    const lastSync = this.recentStatusSync.get(userId) ?? 0;
    if (!force && now - lastSync < STATUS_SYNC_COOLDOWN_MS) {
      const cached = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!cached) throw new BadRequestException("User not found");
      return cached;
    }

    this.recentStatusSync.set(userId, now);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    try {
      let subscription: Stripe.Subscription | null = null;

      if (user.stripeSubscriptionId) {
        subscription = await this.retrieveSubscriptionOrNull(
          user.stripeSubscriptionId,
        );
      }

      if (!subscription && user.stripeCustomerId) {
        const subscriptions = await this.listCustomerSubscriptions(
          user.stripeCustomerId,
        );
        subscription = pickMostRelevantSubscription(subscriptions);
      }

      if (subscription) {
        await this.applySubscriptionState(user.id, subscription, source);
      } else if (
        user.isPremium ||
        user.stripeSubscriptionId ||
        user.stripePriceId ||
        user.stripeCurrentPeriodEnd
      ) {
        await this.clearSubscriptionState(user.id, `${source}_no_subscription`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Stripe sync failed for user ${userId} (${source}): ${message}`,
      );
    }

    const refreshed = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!refreshed) throw new BadRequestException("User not found");
    return refreshed;
  }

  private async beginWebhookEvent(event: Stripe.Event): Promise<boolean> {
    if (this.processedEvents.has(event.id)) {
      return false;
    }

    this.processedEvents.set(event.id, Date.now());

    try {
      await this.prisma.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
        },
      });
      return true;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const existing = await this.prisma.stripeWebhookEvent.findUnique({
          where: { eventId: event.id },
        });

        if (existing?.processedAt) {
          return false;
        }

        if (
          existing &&
          Date.now() - existing.createdAt.getTime() > WEBHOOK_EVENT_STALE_MS
        ) {
          await this.prisma.stripeWebhookEvent
            .delete({ where: { eventId: event.id } })
            .catch(() => undefined);

          await this.prisma.stripeWebhookEvent.create({
            data: {
              eventId: event.id,
              eventType: event.type,
            },
          });
          return true;
        }

        return false;
      }

      this.processedEvents.delete(event.id);
      throw err;
    }
  }

  private async completeWebhookEvent(eventId: string): Promise<void> {
    await this.prisma.stripeWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });
  }

  private async failWebhookEvent(eventId: string): Promise<void> {
    this.processedEvents.delete(eventId);
    await this.prisma.stripeWebhookEvent
      .delete({ where: { eventId } })
      .catch(() => undefined);
  }

  /**
   * Find-or-create a Stripe Customer for a local user.
   */
  private async ensureStripeCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException("User not found");

    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /* ──────────────── Checkout Session ─────────────────────── */

  async createCheckoutSession(userId: string): Promise<{ url: string }> {
    const customerId = await this.ensureStripeCustomer(userId);
    const user = await this.syncUserSubscriptionState(userId, "checkout_create", true);

    if (isActivePremium(user)) {
      throw new BadRequestException("You already have an active subscription.");
    }

    const priceId = this.config.get("STRIPE_PRICE_ID");
    const clientUrl = this.config.get("CLIENT_URL");

    const session = await this.stripe.checkout.sessions.create(
      {
        customer: customerId,
        client_reference_id: user.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${clientUrl}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/app/billing?cancelled=true`,
        subscription_data: {
          metadata: { userId: user.id },
        },
        metadata: { userId: user.id },
      },
      // Idempotency key prevents duplicate checkout sessions from concurrent
      // requests. Uses a 5-minute time bucket so the key naturally expires,
      // allowing legitimate retries after a cancelled/expired session.
      {
        idempotencyKey: `checkout-${userId}-${Math.floor(Date.now() / 300_000)}`,
      },
    );

    if (!session.url) {
      throw new BadRequestException("Failed to create checkout session.");
    }

    return { url: session.url };
  }

  /* ──────────────── Customer Portal ──────────────────────── */

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.syncUserSubscriptionState(userId, "portal_create", true);
    if (!user.stripeCustomerId && !user.stripeSubscriptionId) {
      throw new BadRequestException("No billing account found for this user.");
    }

    const customerId = user.stripeCustomerId ?? (await this.ensureStripeCustomer(userId));
    const clientUrl = this.config.get("CLIENT_URL");

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${clientUrl}/app/billing`,
    });

    return { url: session.url };
  }

  /* ──────────────── Subscription Status ──────────────────── */

  async getSubscriptionStatus(userId: string) {
    const user = await this.syncUserSubscriptionState(userId, "status_read");
    return this.mapUserStatus(user);
  }

  async verifyCheckoutSession(userId: string, sessionId: string) {
    if (!sessionId || !sessionId.startsWith("cs_")) {
      throw new BadRequestException("Invalid checkout session ID.");
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.mode !== "subscription") {
      throw new BadRequestException("Checkout session is not a subscription session.");
    }

    const claimedUserId =
      session.metadata?.userId ||
      session.client_reference_id ||
      undefined;

    if (claimedUserId && claimedUserId !== userId) {
      throw new BadRequestException("Checkout session does not belong to the current user.");
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (customerId) {
      const existingUser = await this.prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException(
          "Checkout session customer is linked to a different user.",
        );
      }
    }

    if (session.status !== "complete") {
      const user = await this.syncUserSubscriptionState(
        userId,
        "checkout_verify_incomplete",
        true,
      );
      return this.mapUserStatus(user);
    }

    const rawSubscription = session.subscription;
    const subscription =
      typeof rawSubscription === "string"
        ? await this.retrieveSubscriptionOrNull(rawSubscription)
        : rawSubscription;

    if (subscription) {
      await this.applySubscriptionState(userId, subscription, "checkout_verified");
    }

    const user = await this.syncUserSubscriptionState(userId, "checkout_verify", true);
    return this.mapUserStatus(user);
  }

  /* ──────────────── Webhook Handler ──────────────────────── */

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get("STRIPE_WEBHOOK_SECRET"),
    );
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const shouldProcess = await this.beginWebhookEvent(event);
    if (!shouldProcess) {
      this.logger.log(`Skipping duplicate webhook event: ${event.id}`);
      return;
    }

    this.logger.log(`Stripe webhook received: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.onCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.onSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "customer.subscription.deleted":
          await this.onSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "invoice.payment_succeeded":
        case "invoice.paid":
          await this.onInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case "invoice.payment_failed":
          await this.onInvoiceFailed(event.data.object as Stripe.Invoice);
          break;
        case "payment_intent.succeeded":
        case "payment_intent.payment_failed":
        case "checkout.session.expired":
          this.logger.log(`Observed non-state event: ${event.type}`);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      await this.completeWebhookEvent(event.id);
    } catch (err) {
      await this.failWebhookEvent(event.id);
      throw err;
    }
  }

  /* ──────────────── Webhook event handlers ───────────────── */

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== "subscription") {
      this.logger.warn("checkout.session.completed: non-subscription session received");
      return;
    }

    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      this.logger.warn("checkout.session.completed: no subscription ID");
      return;
    }

    const subscription = await this.retrieveSubscriptionOrNull(subscriptionId);
    if (!subscription) {
      this.logger.warn(
        `checkout.session.completed: subscription ${subscriptionId} no longer exists`,
      );
      return;
    }

    const userId =
      session.metadata?.userId ||
      session.client_reference_id ||
      subscription.metadata?.userId;
    if (!userId) {
      this.logger.warn("checkout.session.completed: no userId in metadata");
      return;
    }

    // Cross-verify customer mapping: ensure session.customer matches the user's stored customer ID
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (customerId) {
      const existingUser = await this.prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (existingUser && existingUser.id !== userId) {
        this.logger.error(
          `Customer ${customerId} is already linked to user ${existingUser.id}, but checkout metadata says ${userId}. Skipping.`,
        );
        return;
      }
    }

    await this.applySubscriptionState(userId, subscription, "checkout_completed");

    if (isEntitledSubscriptionStatus(subscription.status)) {
      this.logger.log(
        `Checkout completed and synced for user ${userId}, subscription ${subscriptionId}`,
      );
    }
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = this.getInvoiceSubscriptionId(invoice);
    if (!subscriptionId) return;

    const subscription = await this.retrieveSubscriptionOrNull(subscriptionId);
    if (!subscription) {
      this.logger.warn(`invoice.paid: subscription ${subscriptionId} not found`);
      return;
    }

    const user = await this.findUserBySubscription(subscriptionId, subscription);
    if (!user) return;

    await this.applySubscriptionState(user.id, subscription, "invoice_paid");

    if (
      isEntitledSubscriptionStatus(subscription.status) &&
      this.isAllowedPremiumPrice(this.getSubscriptionPriceId(subscription))
    ) {
      await this.writeAuditLog(user.id, "premium.renewed", "invoice_paid", {
        subscriptionId,
        periodEnd: this.getItemPeriodEnd(subscription),
      });
    }
  }

  private async onInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = this.getInvoiceSubscriptionId(invoice);
    if (!subscriptionId) return;

    const subscription = await this.retrieveSubscriptionOrNull(subscriptionId);
    if (!subscription) {
      this.logger.warn(`invoice.payment_failed: subscription ${subscriptionId} not found`);
      return;
    }

    const user = await this.findUserBySubscription(subscriptionId, subscription);
    if (!user) return;

    await this.writeAuditLog(
      user.id,
      "payment.failed",
      "invoice_payment_failed",
      { subscriptionId },
    );

    await this.applySubscriptionState(
      user.id,
      subscription,
      "invoice_payment_failed",
    );

    this.logger.warn(`Invoice payment failed for user ${user.id}`);
  }

  private async onSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Always fetch the latest Stripe object to avoid stale out-of-order events
    // re-applying old states after cancellation or plan changes.
    const latest = await this.retrieveSubscriptionOrNull(subscription.id);
    if (!latest) {
      await this.onSubscriptionDeleted(subscription);
      return;
    }

    const user = await this.findUserBySubscription(latest.id, latest);
    if (!user) return;

    await this.applySubscriptionState(user.id, latest, "subscription_updated");

    this.logger.log(
      `Subscription updated for user ${user.id} — status: ${latest.status}`,
    );
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const user = await this.findUserBySubscription(subscription.id, subscription);
    if (!user) return;

    const synced = await this.syncUserSubscriptionState(
      user.id,
      "subscription_deleted",
      true,
    );

    if (!isActivePremium(synced)) {
      await this.writeAuditLog(user.id, "premium.cancelled", "subscription_deleted", {
        subscriptionId: subscription.id,
      });
      this.logger.log(`Subscription cancelled — user ${user.id} downgraded`);
    } else {
      this.logger.log(
        `subscription.deleted received for ${subscription.id}, but user ${user.id} still has active entitlement`,
      );
    }
  }
}
