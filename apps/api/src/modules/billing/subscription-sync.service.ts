import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../common/prisma.service";
import { lockedTransaction } from "../../common/plan";
import { isActivePremium } from "../../common/subscription.util";
import {
  EMPTY_SNAPSHOT,
  earliestTrialStart,
  isEntitledSubscriptionStatus,
  isLiveSubscriptionStatus,
  pickMostRelevantSubscription,
  premiumTransition,
  snapshotDiffers,
  toSubscriptionSnapshot,
} from "./billing-state.util";
import {
  BILLING_CONFIG,
  STRIPE_CLIENT,
  isStripeResourceMissing,
  type BillingConfig,
} from "./stripe.client";

/** Status reads re-check Stripe at most this often per user. */
const STATUS_SYNC_COOLDOWN_MS = 15_000;
const COOLDOWN_MAP_MAX = 5_000;
/** A background read falls back to stored state quickly instead of retrying. */
const READ_SYNC_REQUEST: Stripe.RequestOptions = {
  timeout: 5_000,
  maxNetworkRetries: 0,
};

export interface ReconcileResult {
  user: User;
  /** The customer's subscriptions; null when the customer no longer exists in Stripe. */
  subscriptions: Stripe.Subscription[] | null;
}

/**
 * Derives a user's subscription state from ALL of their Stripe customer's
 * subscriptions (never from a single event), so out-of-order events or a
 * stale secondary subscription cannot overwrite the one that is paid for.
 */
@Injectable()
export class SubscriptionSyncService {
  private readonly logger = new Logger(SubscriptionSyncService.name);
  private readonly lastSyncAt = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @Inject(BILLING_CONFIG) private readonly config: BillingConfig,
  ) {}

  async getUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  /**
   * Fresh state for user-facing reads. Without `force`, Stripe is asked at
   * most once per cooldown and a Stripe outage falls back to the stored state.
   */
  async syncUser(userId: string, source: string, force = false): Promise<User> {
    const user = await this.getUser(userId);
    if (!user.stripeCustomerId) return user;
    if (!force && this.inCooldown(userId)) return user;
    try {
      const request = force ? undefined : READ_SYNC_REQUEST;
      return (await this.reconcile(user, source, request)).user;
    } catch (err) {
      if (force) throw err;
      this.logger.warn(
        `Stripe sync failed for user ${userId} (${source}): ${(err as Error).message}`,
      );
      return user;
    }
  }

  /** Re-reads the user's customer from Stripe and stores the result. */
  async reconcile(
    user: User,
    source: string,
    request?: Stripe.RequestOptions,
  ): Promise<ReconcileResult> {
    if (!user.stripeCustomerId) return { user, subscriptions: [] };
    this.markSynced(user.id);
    const subscriptions = await this.listSubscriptions(
      user.stripeCustomerId,
      request,
    );
    if (subscriptions === null) {
      // Deleted in Stripe, or an id from the other mode/account. The id is
      // kept (a key mix-up then heals on the next sync); checkout and the
      // portal replace or drop it.
      this.logger.warn(
        `Stripe customer of user ${user.id} not found; clearing subscription state`,
      );
    }
    const updated = await this.apply(user.id, subscriptions ?? [], source);
    return { user: updated ?? user, subscriptions };
  }

  /** Webhook entry point: reconciles whichever user owns `customerId`. */
  async reconcileCustomer(
    customerId: string,
    source: string,
    metadataUserId?: string,
  ): Promise<ReconcileResult | null> {
    let user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });
    if (!user && metadataUserId) {
      // Subscription created before the customer link was stored: link only a
      // user that has no customer yet.
      const { count } = await this.prisma.user.updateMany({
        where: { id: metadataUserId, stripeCustomerId: null },
        data: { stripeCustomerId: customerId },
      });
      if (count === 1) user = await this.getUser(metadataUserId);
    }
    if (!user) {
      this.logger.warn(`No user for Stripe customer ${customerId} (${source})`);
      return null;
    }
    return this.reconcile(user, source);
  }

  /**
   * Links the customer of a completed checkout to its user, replacing a
   * previous customer (e.g. one recreated after deletion) unless that one
   * still grants premium: then the new payment is a duplicate to refund, and
   * the paid-for state is kept.
   */
  async linkCustomer(
    userId: string,
    customerId: string,
    source: string,
  ): Promise<"linked" | "other_user" | "duplicate"> {
    const user = await this.getUser(userId);
    if (user.stripeCustomerId === customerId) return "linked";

    const owner = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (owner) {
      this.logger.error(
        `Refusing to link customer ${customerId} to user ${userId}: linked to user ${owner.id} (${source})`,
      );
      return "other_user";
    }
    if (user.stripeCustomerId && isActivePremium(user)) {
      this.logger.error(
        `User ${userId} paid via second customer ${customerId} while premium; refund the duplicate in Stripe`,
      );
      await this.audit(userId, "billing.duplicate_subscription", source, {
        customerId,
      });
      return "duplicate";
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
    await this.audit(userId, "billing.customer_linked", source);
    return "linked";
  }

  /** Forgets a customer that was deleted in Stripe. */
  async detachCustomer(customerId: string, source: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!user) return;
    await this.apply(user.id, [], source, {
      stripeCustomerId: null,
      stripeCheckoutSessionId: null,
      stripeCheckoutSessionExpiresAt: null,
    });
  }

  /** Cancels every subscription of the customer that has not ended yet; returns their ids. */
  async cancelLiveSubscriptions(customerId: string): Promise<string[]> {
    const live = ((await this.listSubscriptions(customerId)) ?? []).filter(
      (s) => isLiveSubscriptionStatus(s.status),
    );
    for (const sub of live) {
      try {
        await this.stripe.subscriptions.cancel(sub.id);
      } catch (err) {
        if (!isStripeResourceMissing(err)) throw err;
      }
    }
    return live.map((s) => s.id);
  }

  /** Newest first; null when the customer does not exist. */
  async listSubscriptions(
    customerId: string,
    request?: Stripe.RequestOptions,
  ): Promise<Stripe.Subscription[] | null> {
    try {
      const page = await this.stripe.subscriptions.list(
        { customer: customerId, status: "all", limit: 20 },
        request,
      );
      return page.data;
    } catch (err) {
      if (isStripeResourceMissing(err)) return null;
      throw err;
    }
  }

  async clearPendingCheckout(sessionId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { stripeCheckoutSessionId: sessionId },
      data: { stripeCheckoutSessionId: null, stripeCheckoutSessionExpiresAt: null },
    });
  }

  /** Writes a billing audit row; never throws (audit must not break billing). */
  async audit(
    userId: string,
    action: string,
    reason?: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, reason, metadata },
      });
    } catch (err) {
      this.logger.error(
        `Audit write failed for ${userId}/${action}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Stores the state of the most relevant subscription. Runs under a per-user
   * advisory lock (DB work only), so concurrent webhooks and reads write one
   * transition audit row, not several.
   */
  private async apply(
    userId: string,
    subscriptions: Stripe.Subscription[],
    source: string,
    extra?: Prisma.UserUpdateInput,
  ): Promise<User | null> {
    const picked = pickMostRelevantSubscription(
      subscriptions,
      this.config.premiumPriceIds,
    );
    const snapshot = picked
      ? toSubscriptionSnapshot(picked, this.config.premiumPriceIds)
      : EMPTY_SNAPSHOT;
    const trialStartedAt = earliestTrialStart(subscriptions);

    return lockedTransaction(this.prisma, `billing:${userId}`, async (tx) => {
      const before = await tx.user.findUnique({ where: { id: userId } });
      if (!before) return null;

      const markTrialUsed = trialStartedAt !== null && !before.trialUsedAt;
      if (!extra && !markTrialUsed && !snapshotDiffers(before, snapshot)) {
        return before;
      }

      const after = await tx.user.update({
        where: { id: userId },
        data: {
          ...snapshot,
          ...(markTrialUsed && { trialUsedAt: trialStartedAt }),
          ...extra,
        },
      });

      const details = {
        subscriptionId: snapshot.stripeSubscriptionId,
        status: snapshot.subscriptionStatus,
        priceId: snapshot.stripePriceId,
        periodEnd: snapshot.stripeCurrentPeriodEnd?.toISOString() ?? null,
      };
      const reason = `${source}:${snapshot.subscriptionStatus ?? "none"}`;
      const transition = premiumTransition(
        isActivePremium(before),
        isActivePremium(after),
      );
      if (transition) {
        await tx.auditLog.create({
          data: { userId, action: transition, reason, metadata: details },
        });
      }
      if (picked && isEntitledSubscriptionStatus(picked.status) && !snapshot.isPremium) {
        this.logger.warn(
          `Subscription ${picked.id} has unrecognised price ${snapshot.stripePriceId}; premium not granted`,
        );
        await tx.auditLog.create({
          data: { userId, action: "premium.price_mismatch", reason, metadata: details },
        });
      }
      return after;
    });
  }

  private inCooldown(userId: string): boolean {
    const last = this.lastSyncAt.get(userId);
    return last !== undefined && Date.now() - last < STATUS_SYNC_COOLDOWN_MS;
  }

  private markSynced(userId: string): void {
    const now = Date.now();
    if (this.lastSyncAt.size >= COOLDOWN_MAP_MAX) {
      for (const [id, at] of this.lastSyncAt) {
        if (now - at >= STATUS_SYNC_COOLDOWN_MS) this.lastSyncAt.delete(id);
      }
    }
    this.lastSyncAt.set(userId, now);
  }
}
