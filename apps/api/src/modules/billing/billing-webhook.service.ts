import { Inject, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../common/prisma.service";
import { DAY_MS } from "../../common/plan";
import {
  classifyRedelivery,
  isEntitledSubscriptionStatus,
  isLiveSubscriptionStatus,
} from "./billing-state.util";
import { checkoutSessionOwnerId } from "./checkout-session.util";
import {
  BILLING_CONFIG,
  STRIPE_CLIENT,
  errorLabel,
  stripeIdOf,
  type BillingConfig,
} from "./stripe.client";
import { SubscriptionSyncService } from "./subscription-sync.service";

/** Stripe retries for up to 3 days; keep a month of event ids for dedupe. */
const EVENT_RETENTION_MS = 30 * DAY_MS;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * "processed" and "duplicate" are acknowledged (2xx); "in_progress" is not,
 * so Stripe redelivers once the running attempt has finished or been abandoned.
 */
export type WebhookOutcome = "processed" | "duplicate" | "in_progress";

/**
 * Handlers are idempotent: each one re-reads the customer's state from Stripe
 * instead of trusting the event payload, so event order does not matter and
 * a redelivered event is safe to process again.
 */
@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);
  private lastPruneAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SubscriptionSyncService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @Inject(BILLING_CONFIG) private readonly config: BillingConfig,
  ) {}

  /** Throws Stripe's signature verification error for a forged or malformed payload. */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.webhookSecret,
    );
  }

  async handle(event: Stripe.Event): Promise<WebhookOutcome> {
    const claim = await this.claim(event);
    if (claim !== "process") return claim;

    try {
      await this.dispatch(event);
    } catch (err) {
      // Release the claim so Stripe's retry processes the event again.
      await this.prisma.stripeWebhookEvent
        .deleteMany({ where: { eventId: event.id, processedAt: null } })
        .catch(() => undefined);
      this.logger.error(
        `Stripe webhook ${event.type} (${event.id}) failed: ${errorLabel(err)}`,
      );
      throw err;
    }

    await this.prisma.stripeWebhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });
    this.pruneOldEvents();
    return "processed";
  }

  private async claim(
    event: Stripe.Event,
  ): Promise<"process" | "duplicate" | "in_progress"> {
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: { eventId: event.id, eventType: event.type },
      });
      return "process";
    } catch (err) {
      if (
        !(err instanceof Prisma.PrismaClientKnownRequestError) ||
        err.code !== "P2002"
      ) {
        throw err;
      }
    }

    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId: event.id },
    });
    if (!existing) return "in_progress"; // a failed attempt just released it
    const action = classifyRedelivery(existing, Date.now());
    if (action === "skip") return "duplicate";
    if (action === "in_progress") return "in_progress";

    // Take over an abandoned attempt; only one redelivery can win.
    const { count } = await this.prisma.stripeWebhookEvent.updateMany({
      where: {
        eventId: event.id,
        processedAt: null,
        createdAt: existing.createdAt,
      },
      data: { createdAt: new Date() },
    });
    return count === 1 ? "process" : "in_progress";
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed":
        return this.onCheckoutCompleted(event.data.object);
      case "checkout.session.expired":
        return this.sync.clearPendingCheckout(event.data.object.id);
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const subscription = event.data.object;
        const customerId = stripeIdOf(subscription.customer);
        if (customerId) {
          // Link by metadata only for a live subscription: a late event for an
          // ended one (e.g. after customer.deleted) must not re-attach a dead customer.
          await this.sync.reconcileCustomer(
            customerId,
            event.type,
            isLiveSubscriptionStatus(subscription.status)
              ? subscription.metadata?.userId
              : undefined,
          );
        }
        return;
      }
      case "invoice.paid":
      case "invoice.payment_failed":
        return this.onInvoice(event.data.object, event.type);
      case "customer.deleted":
        return this.sync.detachCustomer(event.data.object.id, event.type);
      case "charge.dispute.created":
        return this.onDisputeCreated(event.data.object);
      default:
        this.logger.debug(`Ignoring Stripe event ${event.type}`);
    }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    await this.sync.clearPendingCheckout(session.id);
    if (session.mode !== "subscription") return;

    const userId = checkoutSessionOwnerId(session);
    const customerId = stripeIdOf(session.customer);
    if (!userId || !customerId) {
      this.logger.warn(
        `checkout.session.completed ${session.id} has no owner or customer; ignored`,
      );
      return;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      this.logger.warn(`checkout.session.completed for unknown user ${userId}`);
      return;
    }
    const link = await this.sync.linkCustomer(
      userId,
      customerId,
      "checkout.session.completed",
    );
    if (link !== "linked") return;

    const result = await this.sync.reconcileCustomer(
      customerId,
      "checkout.session.completed",
    );
    const entitled = (result?.subscriptions ?? []).filter((s) =>
      isEntitledSubscriptionStatus(s.status),
    );
    if (entitled.length > 1) {
      this.logger.error(
        `User ${userId} has ${entitled.length} active subscriptions; refund the duplicate in Stripe`,
      );
      await this.sync.audit(userId, "billing.duplicate_subscription", "checkout", {
        subscriptionIds: entitled.map((s) => s.id),
      });
    }
  }

  private async onInvoice(
    invoice: Stripe.Invoice,
    type: "invoice.paid" | "invoice.payment_failed",
  ) {
    const customerId = stripeIdOf(invoice.customer);
    if (!customerId) return;
    const result = await this.sync.reconcileCustomer(customerId, type);
    if (!result) return;

    const meta = { invoiceId: invoice.id ?? null };
    if (type === "invoice.payment_failed") {
      await this.sync.audit(result.user.id, "payment.failed", invoice.billing_reason ?? undefined, {
        ...meta,
        attemptCount: invoice.attempt_count,
      });
    } else if (invoice.billing_reason === "subscription_cycle") {
      await this.sync.audit(result.user.id, "premium.renewed", type, meta);
    }
  }

  /** A chargeback ends the subscription so the disputed card is not billed again. */
  private async onDisputeCreated(dispute: Stripe.Dispute) {
    const charge = await this.stripe.charges.retrieve(stripeIdOf(dispute.charge)!);
    const customerId = stripeIdOf(charge.customer);
    if (!customerId) return;
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!user) return;

    const cancelled = await this.sync.cancelLiveSubscriptions(customerId);
    await this.sync.reconcileCustomer(customerId, "charge.dispute.created");
    await this.sync.audit(user.id, "payment.disputed", dispute.reason, {
      disputeId: dispute.id,
      cancelledSubscriptionIds: cancelled,
    });
    this.logger.warn(
      `Dispute ${dispute.id} for user ${user.id}: cancelled ${cancelled.length} subscription(s)`,
    );
  }

  /** Best-effort, at most hourly per process. */
  private pruneOldEvents(): void {
    const now = Date.now();
    if (now - this.lastPruneAt < PRUNE_INTERVAL_MS) return;
    this.lastPruneAt = now;
    this.prisma.stripeWebhookEvent
      .deleteMany({ where: { createdAt: { lt: new Date(now - EVENT_RETENTION_MS) } } })
      .catch((err: Error) =>
        this.logger.warn(`Pruning webhook events failed: ${err.message}`),
      );
  }
}
