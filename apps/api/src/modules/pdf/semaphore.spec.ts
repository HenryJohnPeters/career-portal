import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Semaphore, SemaphoreRejectedError } from "./semaphore";

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe("Semaphore", () => {
  test("grants up to max slots, then queues in order", async () => {
    const sem = new Semaphore(2);
    await sem.acquire();
    await sem.acquire();
    const order: number[] = [];
    void sem.acquire().then(() => order.push(1));
    void sem.acquire().then(() => order.push(2));
    await tick();
    assert.deepEqual(order, []);
    assert.equal(sem.waiting, 2);
    sem.release();
    await tick();
    assert.deepEqual(order, [1]);
    sem.release();
    await tick();
    assert.deepEqual(order, [1, 2]);
    assert.equal(sem.active, 2);
  });

  test("rejects when the queue is full", async () => {
    const sem = new Semaphore(1, 1);
    await sem.acquire();
    const queued = sem.acquire();
    await assert.rejects(sem.acquire(), (err: unknown) =>
      err instanceof SemaphoreRejectedError && err.reason === "queue_full",
    );
    sem.release();
    await queued;
    sem.release();
  });

  test("rejects a waiter after maxWaitMs and forgets it", async () => {
    const sem = new Semaphore(1, 5, 20);
    await sem.acquire();
    await assert.rejects(sem.acquire(), (err: unknown) =>
      err instanceof SemaphoreRejectedError && err.reason === "wait_timeout",
    );
    assert.equal(sem.waiting, 0);
    sem.release();
    assert.equal(sem.active, 0);
  });

  test("run always releases its slot", async () => {
    const sem = new Semaphore(1);
    await assert.rejects(sem.run(() => Promise.reject(new Error("boom"))));
    assert.equal(sem.active, 0);
    assert.equal(await sem.run(async () => 7), 7);
  });
});
