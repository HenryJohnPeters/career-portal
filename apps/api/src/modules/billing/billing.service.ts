import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../common/prisma.service";
import type { EnvConfig } from "../../common/env.config";

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {
    this.stripe = new Stripe(this.config.get("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-01-28.clover",
    });
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
    const item = subscription.items.data[0];
    if (item?.current_period_end) {
      return new Date(item.current_period_end * 1000);
    }
    // Fallback: use the subscription's start_date + 30 days
    return new Date(subscription.start_date * 1000 + 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * Extract the subscription ID from an Invoice (v20 moved it to parent.subscription_details).
   */
  private getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const sub = invoice.parent?.subscription_details?.subscription;
    if (!sub) return null;
    return typeof sub === "string" ? sub : sub.id;
  }

  /**
   * Find-or-create a Stripe Customer for a local user.
   */
  private async ensureStripeCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

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

    // Prevent creating a second subscription
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.isPremium && user.stripeSubscriptionId) {
      throw new BadRequestException("You already have an active subscription.");
    }

    const priceId = this.config.get("STRIPE_PRICE_ID");
    const clientUrl = this.config.get("CLIENT_URL");

    const session = await this.stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${clientUrl}/app/billing?success=true`,
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
    const customerId = await this.ensureStripeCustomer(userId);
    const clientUrl = this.config.get("CLIENT_URL");

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${clientUrl}/app/billing`,
    });

    return { url: session.url };
  }

  /* ──────────────── Subscription Status ──────────────────── */

  async getSubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      isPremium: user.isPremium,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    };
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
    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "invoice.payment_succeeded":
        await this.onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await this.onInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
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
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /* ──────────────── Webhook event handlers ───────────────── */

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      this.logger.warn("checkout.session.completed: no subscription ID");
      return;
    }

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    const userId = session.metadata?.userId || subscription.metadata?.userId;
    if (!userId) {
      this.logger.warn("checkout.session.completed: no userId in metadata");
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id ?? null;
    const periodEnd = this.getItemPeriodEnd(subscription);

    this.logger.log(
      `Processing checkout for user ${userId}, subscription ${subscriptionId}, status: ${subscription.status}`,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    await this.writeAuditLog(userId, "premium.upgraded", "checkout_completed", {
      subscriptionId,
      priceId,
    });
    this.logger.log(`✅ User ${userId} upgraded to Premium successfully`);
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = this.getInvoiceSubscriptionId(invoice);
    if (!subscriptionId) return;

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    const user = await this.prisma.user.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (!user) return;

    const periodEnd = this.getItemPeriodEnd(subscription);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    await this.writeAuditLog(user.id, "premium.renewed", "invoice_paid", {
      periodEnd,
    });
    this.logger.log(`Invoice paid — renewed Premium for user ${user.id}`);
  }

  private async onInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = this.getInvoiceSubscriptionId(invoice);
    if (!subscriptionId) return;

    const user = await this.prisma.user.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (!user) return;

    await this.writeAuditLog(
      user.id,
      "payment.failed",
      "invoice_payment_failed",
    );
    this.logger.warn(`Invoice payment failed for user ${user.id}`);
    // Stripe will retry automatically. The subscription status transitions to
    // `past_due` or `unpaid`, which fires `customer.subscription.updated` →
    // onSubscriptionUpdated → sets isPremium = false. We do NOT downgrade here
    // to avoid punishing users on the first transient payment failure.
    // The isActivePremium() check in AiUsageService provides a secondary
    // safety net via stripeCurrentPeriodEnd once the period actually expires.
  }

  private async onSubscriptionUpdated(subscription: Stripe.Subscription) {
    const user = await this.prisma.user.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!user) return;

    const isActive =
      subscription.status === "active" || subscription.status === "trialing";

    const periodEnd = this.getItemPeriodEnd(subscription);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: isActive,
        stripePriceId: subscription.items.data[0]?.price?.id ?? null,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    if (user.isPremium && !isActive) {
      await this.writeAuditLog(
        user.id,
        "premium.downgraded",
        `subscription_${subscription.status}`,
        {
          subscriptionId: subscription.id,
          status: subscription.status,
        },
      );
    }
    this.logger.log(
      `Subscription updated for user ${user.id} — active: ${isActive}`,
    );
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const user = await this.prisma.user.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!user) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: false,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });

    await this.writeAuditLog(
      user.id,
      "premium.cancelled",
      "subscription_deleted",
      {
        subscriptionId: subscription.id,
      },
    );
    this.logger.log(`Subscription cancelled — user ${user.id} downgraded`);
  }
}
