import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import type { PrismaService } from "../../common/prisma.service";
import { EMPTY_SNAPSHOT, type SubscriptionLike } from "./billing-state.util";
import type { BillingConfig } from "./stripe.client";
import { SubscriptionSyncService } from "./subscription-sync.service";

/* In-memory fakes: just enough Prisma and Stripe for the sync service. */

type Row = Record<string, unknown> & { id: string };
const PERIOD_END = Math.floor(Date.now() / 1000) + 30 * 86_400;

function sub(id: string, status: string, created: number, extra: Partial<SubscriptionLike> = {}) {
  return {
    id,
    status,
    created,
    cancel_at: null,
    cancel_at_period_end: false,
    trial_start: null,
    trial_end: null,
    items: { data: [{ price: { id: "price_premium" }, current_period_end: PERIOD_END }] },
    ...extra,
  };
}

function matches(row: Row, where: Record<string, unknown>) {
  return Object.entries(where).every(([k, v]) => row[k] === v);
}

/** Like Prisma, every read returns a fresh copy of the row. */
function fakePrisma(users: Row[]) {
  const audit: Row[] = [];
  const copy = (row: Row | undefined) => (row ? { ...row } : null);
  const db = {
    audit,
    users,
    user: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) =>
        copy(users.find((u) => matches(u, where))),
      update: async ({ where, data }: { where: { id: string }; data: Row }) => {
        const row = users.find((u) => u.id === where.id);
        if (!row) throw new Error("P2025");
        Object.assign(row, data);
        return copy(row);
      },
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Row }) => {
        const hits = users.filter((u) => matches(u, where));
        hits.forEach((u) => Object.assign(u, data));
        return { count: hits.length };
      },
    },
    auditLog: {
      create: async ({ data }: { data: Row }) => {
        audit.push(data);
        return data;
      },
    },
    $executeRaw: async () => 1,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  };
  return db;
}

function fakeStripe() {
  const state = {
    subscriptions: [] as ReturnType<typeof sub>[],
    listError: null as unknown,
    listCalls: 0,
    cancelled: [] as string[],
  };
  const stripe = {
    subscriptions: {
      list: async () => {
        state.listCalls++;
        if (state.listError) throw state.listError;
        return { data: state.subscriptions };
      },
      cancel: async (id: string) => {
        state.cancelled.push(id);
        return { id };
      },
    },
  };
  return { state, stripe: stripe as unknown as Stripe };
}

const config: BillingConfig = {
  priceId: "price_premium",
  premiumPriceIds: new Set(["price_premium"]),
  webhookSecret: "whsec_test",
  clientUrl: "http://localhost:4200",
  trialDays: 7,
};

function premiumUser(overrides: Partial<Row> = {}): Row {
  return {
    ...EMPTY_SNAPSHOT,
    id: "user-1",
    email: "u1@example.com",
    stripeCustomerId: "cus_1",
    isPremium: true,
    subscriptionStatus: "active",
    stripeSubscriptionId: "sub_B",
    stripePriceId: "price_premium",
    stripeCurrentPeriodEnd: new Date(PERIOD_END * 1000),
    trialUsedAt: null,
    stripeCheckoutSessionId: null,
    stripeCheckoutSessionExpiresAt: null,
    ...overrides,
  };
}

describe("SubscriptionSyncService", () => {
  let db: ReturnType<typeof fakePrisma>;
  let fake: ReturnType<typeof fakeStripe>;
  let service: SubscriptionSyncService;

  function setup(users: Row[]) {
    db = fakePrisma(users);
    fake = fakeStripe();
    service = new SubscriptionSyncService(
      db as unknown as PrismaService,
      fake.stripe,
      config,
    );
  }

  beforeEach(() => setup([premiumUser()]));

  test("an event for a stale past_due subscription keeps the user premium on the active one", async () => {
    fake.state.subscriptions = [sub("sub_A", "past_due", 200), sub("sub_B", "active", 100)];
    const result = await service.reconcileCustomer("cus_1", "invoice.payment_failed");

    assert.equal(result?.user.isPremium, true);
    assert.equal(result?.user.stripeSubscriptionId, "sub_B");
    assert.equal(db.audit.length, 0);
  });

  test("a cancellation downgrades once and writes one audit row", async () => {
    fake.state.subscriptions = [sub("sub_B", "canceled", 100)];
    await service.reconcileCustomer("cus_1", "customer.subscription.deleted");
    await service.reconcileCustomer("cus_1", "invoice.payment_failed");

    const user = db.users[0];
    assert.equal(user.isPremium, false);
    assert.equal(user.subscriptionStatus, "canceled");
    assert.deepEqual(db.audit.map((a) => a.action), ["premium.downgraded"]);
  });

  test("an upgrade records the trial and its end", async () => {
    setup([premiumUser({ isPremium: false, subscriptionStatus: null, stripeSubscriptionId: null })]);
    fake.state.subscriptions = [
      sub("sub_T", "trialing", 100, { trial_start: 1_000, trial_end: PERIOD_END }),
    ];
    const result = await service.reconcileCustomer("cus_1", "customer.subscription.created");

    assert.equal(result?.user.isPremium, true);
    assert.equal(result?.user.subscriptionStatus, "trialing");
    assert.equal((result?.user.trialUsedAt as Date).getTime(), 1_000_000);
    assert.equal((result?.user.trialEnd as Date).getTime(), PERIOD_END * 1000);
    assert.deepEqual(db.audit.map((a) => a.action), ["premium.upgraded"]);
  });

  test("a customer missing from Stripe clears the state but keeps the id", async () => {
    fake.state.listError = new Stripe.errors.StripeInvalidRequestError({
      type: "invalid_request_error",
      code: "resource_missing",
      message: "No such customer",
    });
    const result = await service.reconcile(db.users[0] as never, "status_read");

    assert.equal(result.subscriptions, null);
    assert.equal(result.user.isPremium, false);
    assert.equal(result.user.stripeSubscriptionId, null);
    assert.equal(result.user.stripeCustomerId, "cus_1");
  });

  test("links a subscription's metadata user only when that user has no customer", async () => {
    setup([premiumUser({ id: "user-2", stripeCustomerId: null, isPremium: false })]);
    fake.state.subscriptions = [sub("sub_N", "active", 100)];
    const linked = await service.reconcileCustomer("cus_new", "customer.subscription.created", "user-2");
    assert.equal(linked?.user.stripeCustomerId, "cus_new");
    assert.equal(linked?.user.isPremium, true);

    const other = await service.reconcileCustomer("cus_other", "customer.subscription.created", "user-2");
    assert.equal(other, null);
    assert.equal(db.users[0].stripeCustomerId, "cus_new");
  });

  test("linkCustomer refuses a customer that belongs to another user", async () => {
    setup([premiumUser(), premiumUser({ id: "user-2", stripeCustomerId: null })]);
    assert.equal(await service.linkCustomer("user-2", "cus_1", "test"), "other_user");
    assert.equal(db.users[1].stripeCustomerId, null);
    assert.equal(await service.linkCustomer("user-2", "cus_2", "test"), "linked");
    assert.equal(db.users[1].stripeCustomerId, "cus_2");
    assert.equal(await service.linkCustomer("user-2", "cus_2", "test"), "linked");
  });

  test("linkCustomer never moves a premium user off the customer they pay through", async () => {
    assert.equal(await service.linkCustomer("user-1", "cus_second", "test"), "duplicate");
    assert.equal(db.users[0].stripeCustomerId, "cus_1");
    assert.deepEqual(db.audit.map((a) => a.action), ["billing.duplicate_subscription"]);

    // A lapsed user's stale customer is replaced by the one they just paid through.
    setup([premiumUser({ isPremium: false, subscriptionStatus: "canceled" })]);
    assert.equal(await service.linkCustomer("user-1", "cus_second", "test"), "linked");
    assert.equal(db.users[0].stripeCustomerId, "cus_second");
  });

  test("status reads hit Stripe at most once per cooldown; forced syncs always do", async () => {
    fake.state.subscriptions = [sub("sub_B", "active", 100)];
    await service.syncUser("user-1", "status_read");
    await service.syncUser("user-1", "status_read");
    assert.equal(fake.state.listCalls, 1);
    await service.syncUser("user-1", "checkout_verify", true);
    assert.equal(fake.state.listCalls, 2);
  });

  test("a Stripe outage falls back to stored state for reads but fails forced syncs", async () => {
    fake.state.listError = new Stripe.errors.StripeConnectionError({ type: "api_error", message: "down" });
    const user = await service.syncUser("user-1", "status_read");
    assert.equal(user.isPremium, true);
    await assert.rejects(service.syncUser("user-1", "checkout", true));
  });

  test("users without a Stripe customer never call Stripe", async () => {
    setup([premiumUser({ stripeCustomerId: null, isPremium: false })]);
    await service.syncUser("user-1", "status_read", true);
    assert.equal(fake.state.listCalls, 0);
  });

  test("cancelLiveSubscriptions cancels only subscriptions that have not ended", async () => {
    fake.state.subscriptions = [
      sub("sub_live", "active", 300),
      sub("sub_due", "past_due", 200),
      sub("sub_done", "canceled", 100),
    ];
    assert.deepEqual(await service.cancelLiveSubscriptions("cus_1"), ["sub_live", "sub_due"]);
    assert.deepEqual(fake.state.cancelled, ["sub_live", "sub_due"]);
  });

  test("detachCustomer forgets a deleted customer", async () => {
    await service.detachCustomer("cus_1", "customer.deleted");
    const user = db.users[0];
    assert.equal(user.stripeCustomerId, null);
    assert.equal(user.isPremium, false);
    assert.deepEqual(db.audit.map((a) => a.action), ["premium.downgraded"]);
  });
});
