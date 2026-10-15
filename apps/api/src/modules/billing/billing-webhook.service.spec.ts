import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import type { PrismaService } from "../../common/prisma.service";
import { WEBHOOK_EVENT_STALE_MS } from "./billing-state.util";
import { BillingWebhookService } from "./billing-webhook.service";
import type { BillingConfig } from "./stripe.client";
import type { SubscriptionSyncService } from "./subscription-sync.service";

type EventRow = { eventId: string; eventType: string; createdAt: Date; processedAt: Date | null };

function fakePrisma() {
  const events = new Map<string, EventRow>();
  const users = [{ id: "user-1", stripeCustomerId: "cus_1" }];
  return {
    events,
    stripeWebhookEvent: {
      create: async ({ data }: { data: { eventId: string; eventType: string } }) => {
        if (events.has(data.eventId)) {
          throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
            code: "P2002",
            clientVersion: "test",
          });
        }
        const row = { ...data, createdAt: new Date(), processedAt: null };
        events.set(data.eventId, row);
        return row;
      },
      findUnique: async ({ where }: { where: { eventId: string } }) => events.get(where.eventId) ?? null,
      update: async ({ where, data }: { where: { eventId: string }; data: Partial<EventRow> }) => {
        const row = events.get(where.eventId)!;
        Object.assign(row, data);
        return row;
      },
      updateMany: async ({ where, data }: { where: Partial<EventRow>; data: Partial<EventRow> }) => {
        const row = events.get(where.eventId!);
        if (!row || row.processedAt !== null || row.createdAt.getTime() !== where.createdAt!.getTime()) {
          return { count: 0 };
        }
        Object.assign(row, data);
        return { count: 1 };
      },
      deleteMany: async ({ where }: { where: { eventId?: string; processedAt?: null } }) => {
        const row = where.eventId ? events.get(where.eventId) : undefined;
        if (row && row.processedAt === null) events.delete(row.eventId);
        return { count: row ? 1 : 0 };
      },
    },
    user: {
      findUnique: async ({ where }: { where: { id?: string; stripeCustomerId?: string } }) =>
        users.find((u) => u.id === where.id || u.stripeCustomerId === where.stripeCustomerId) ?? null,
    },
  };
}

function fakeSync() {
  const calls: { method: string; args: unknown[] }[] = [];
  let fail = false;
  const record =
    (method: string, result: unknown = undefined) =>
    async (...args: unknown[]) => {
      calls.push({ method, args });
      if (fail) throw new Error("stripe down");
      return result;
    };
  const sync = {
    reconcileCustomer: record("reconcileCustomer", { user: { id: "user-1" }, subscriptions: [] }),
    clearPendingCheckout: record("clearPendingCheckout"),
    linkCustomer: record("linkCustomer", "linked"),
    detachCustomer: record("detachCustomer"),
    audit: record("audit"),
  };
  return {
    calls,
    setFail: (value: boolean) => (fail = value),
    sync: sync as unknown as SubscriptionSyncService,
  };
}

const config = { webhookSecret: "whsec_test" } as BillingConfig;

function event(id: string, type: string, object: Record<string, unknown>): Stripe.Event {
  return { id, type, data: { object } } as unknown as Stripe.Event;
}

const subscriptionUpdated = (id = "evt_1") =>
  event(id, "customer.subscription.updated", {
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    metadata: { userId: "user-1" },
  });

describe("BillingWebhookService", () => {
  let db: ReturnType<typeof fakePrisma>;
  let sync: ReturnType<typeof fakeSync>;
  let service: BillingWebhookService;

  beforeEach(() => {
    db = fakePrisma();
    sync = fakeSync();
    service = new BillingWebhookService(
      db as unknown as PrismaService,
      sync.sync,
      {} as Stripe,
      config,
    );
  });

  test("processes a new event once and acknowledges redeliveries", async () => {
    assert.equal(await service.handle(subscriptionUpdated()), "processed");
    assert.ok(db.events.get("evt_1")?.processedAt);
    assert.deepEqual(sync.calls[0], {
      method: "reconcileCustomer",
      args: ["cus_1", "customer.subscription.updated", "user-1"],
    });

    assert.equal(await service.handle(subscriptionUpdated()), "duplicate");
    assert.equal(sync.calls.length, 1);
  });

  test("a redelivery during processing is not acknowledged", async () => {
    db.events.set("evt_1", {
      eventId: "evt_1",
      eventType: "customer.subscription.updated",
      createdAt: new Date(),
      processedAt: null,
    });
    assert.equal(await service.handle(subscriptionUpdated()), "in_progress");
    assert.equal(sync.calls.length, 0);
  });

  test("an abandoned attempt is reclaimed and processed", async () => {
    db.events.set("evt_1", {
      eventId: "evt_1",
      eventType: "customer.subscription.updated",
      createdAt: new Date(Date.now() - WEBHOOK_EVENT_STALE_MS - 1000),
      processedAt: null,
    });
    assert.equal(await service.handle(subscriptionUpdated()), "processed");
    assert.equal(sync.calls.length, 1);
  });

  test("a failed attempt releases the event so Stripe's retry processes it", async () => {
    sync.setFail(true);
    await assert.rejects(service.handle(subscriptionUpdated()), /stripe down/);
    assert.equal(db.events.has("evt_1"), false);

    sync.setFail(false);
    assert.equal(await service.handle(subscriptionUpdated()), "processed");
  });

  test("an ended subscription never links its customer by metadata", async () => {
    // e.g. customer.subscription.deleted arriving after customer.deleted
    await service.handle(
      event("evt_7", "customer.subscription.deleted", {
        id: "sub_1",
        customer: "cus_gone",
        status: "canceled",
        metadata: { userId: "user-1" },
      }),
    );
    assert.deepEqual(sync.calls[0], {
      method: "reconcileCustomer",
      args: ["cus_gone", "customer.subscription.deleted", undefined],
    });
  });

  test("invoice.payment_succeeded is ignored (invoice.paid covers it)", async () => {
    await service.handle(event("evt_2", "invoice.payment_succeeded", { id: "in_1", customer: "cus_1" }));
    assert.equal(sync.calls.length, 0);
  });

  test("only a renewal invoice is audited as a renewal", async () => {
    await service.handle(
      event("evt_3", "invoice.paid", { id: "in_1", customer: "cus_1", billing_reason: "subscription_create" }),
    );
    await service.handle(
      event("evt_4", "invoice.paid", { id: "in_2", customer: "cus_1", billing_reason: "subscription_cycle" }),
    );
    const audits = sync.calls.filter((c) => c.method === "audit");
    assert.equal(audits.length, 1);
    assert.equal(audits[0].args[1], "premium.renewed");
  });

  test("checkout.session.completed requires the session to name its user", async () => {
    await service.handle(
      event("evt_5", "checkout.session.completed", {
        id: "cs_1",
        mode: "subscription",
        customer: "cus_x",
        client_reference_id: null,
        metadata: {},
      }),
    );
    assert.deepEqual(sync.calls.map((c) => c.method), ["clearPendingCheckout"]);

    await service.handle(
      event("evt_6", "checkout.session.completed", {
        id: "cs_2",
        mode: "subscription",
        customer: "cus_1",
        client_reference_id: "user-1",
        metadata: { userId: "user-1" },
      }),
    );
    assert.deepEqual(
      sync.calls.slice(1).map((c) => c.method),
      ["clearPendingCheckout", "linkCustomer", "reconcileCustomer"],
    );
  });
});
