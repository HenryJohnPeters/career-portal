import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PatchBuffer } from "./patch-buffer";
import { createFakeTimers, settle } from "./fake-timers";

type Contact = { name: string; phone: string; linkedin: string };

function setup(failWith: () => Error | null = () => null) {
  const clock = createFakeTimers();
  const sent: Partial<Contact>[] = [];
  let release: (() => void) | null = null;
  let holdNext = false;
  const buffer = new PatchBuffer<Contact>({
    delayMs: 600,
    timers: clock.timers,
    send: async (patch) => {
      sent.push(patch);
      if (holdNext) {
        holdNext = false;
        await new Promise<void>((resolve) => (release = resolve));
      }
      const error = failWith();
      if (error) throw error;
    },
  });
  return {
    buffer,
    clock,
    sent,
    hold: () => {
      holdNext = true;
    },
    release: () => release?.(),
  };
}

describe("PatchBuffer", () => {
  test("accumulates every field changed within the window into one PATCH", async () => {
    const { buffer, clock, sent } = setup();
    buffer.add({ name: "Jane" });
    clock.advance(300);
    buffer.add({ phone: "0123" });
    clock.advance(300);
    assert.equal(sent.length, 0);
    clock.advance(300);
    await settle();
    assert.deepEqual(sent, [{ name: "Jane", phone: "0123" }]);
    assert.equal(buffer.getState().status, "saved");
    assert.equal(buffer.hasUnsavedChanges(), false);
  });

  test("changes made during a PATCH go into the next one", async () => {
    const { buffer, clock, sent, hold, release } = setup();
    hold();
    buffer.add({ name: "Jane" });
    clock.advance(600);
    await settle();
    buffer.add({ phone: "0123" });
    assert.deepEqual(buffer.getState().unsaved, { name: "Jane", phone: "0123" });
    clock.advance(600);
    await settle();
    assert.equal(sent.length, 1);
    release();
    await settle();
    assert.deepEqual(sent, [{ name: "Jane" }, { phone: "0123" }]);
  });

  test("a failed PATCH keeps its fields (newer edits win) and flush retries", async () => {
    let fail = true;
    const { buffer, clock, sent } = setup(() => (fail ? new Error("Bad request") : null));
    buffer.add({ name: "Jane", linkedin: "https://linkedin.com/in/jane" });
    clock.advance(600);
    await settle();
    assert.equal(buffer.getState().status, "error");
    assert.equal(buffer.getState().error, "Bad request");
    buffer.add({ name: "Janet" });

    fail = false;
    assert.equal(await buffer.flush(), true);
    assert.deepEqual(sent[1], { name: "Janet", linkedin: "https://linkedin.com/in/jane" });
    assert.deepEqual(buffer.getState().unsaved, {});
  });

  test("flush sends immediately and resolves false while a failure is outstanding", async () => {
    const { buffer, sent } = setup(() => new Error("down"));
    buffer.add({ phone: "1" });
    assert.equal(await buffer.flush(), false);
    assert.equal(sent.length, 1);
    assert.equal(buffer.hasUnsavedChanges(), true);
  });

  test("dispose sends pending changes", async () => {
    const { buffer, sent } = setup();
    buffer.add({ phone: "07700" });
    buffer.dispose();
    await settle();
    assert.deepEqual(sent, [{ phone: "07700" }]);
  });
});
