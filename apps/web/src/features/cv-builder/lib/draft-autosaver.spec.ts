import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { DraftAutosaver, changedFields, fieldsEqual } from "./draft-autosaver";
import { createFakeTimers, settle } from "./fake-timers";

type Section = { title: string; content: string };

function setup(options: { failWith?: () => Error | null; validate?: (f: Section) => string | null } = {}) {
  const clock = createFakeTimers();
  const calls: { id: string; changes: Partial<Section> }[] = [];
  const backgroundErrors: string[] = [];
  let release: (() => void) | null = null;
  let holdNext = false;

  const saver = new DraftAutosaver<Section>({
    delayMs: 1500,
    timers: clock.timers,
    validate: options.validate,
    onBackgroundError: (message) => backgroundErrors.push(message),
    save: async (id, changes) => {
      calls.push({ id, changes });
      if (holdNext) {
        holdNext = false;
        await new Promise<void>((resolve) => (release = resolve));
      }
      const error = options.failWith?.();
      if (error) throw error;
    },
  });

  return {
    saver,
    clock,
    calls,
    backgroundErrors,
    /** The next save waits until release() is called. */
    hold: () => {
      holdNext = true;
    },
    release: () => release?.(),
  };
}

const A: Section = { title: "Skills", content: "TypeScript" };
const B: Section = { title: "Experience", content: "Acme 2020-2024" };

describe("DraftAutosaver", () => {
  test("never writes the previous section's text into the newly opened one", async () => {
    const { saver, clock, calls } = setup();
    saver.open("b", B);
    saver.edit({ content: "Acme 2020-2025" });
    clock.advance(1500);
    await settle();

    saver.open("a", A);
    clock.advance(5000);
    await saver.discard();

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { id: "b", changes: { content: "Acme 2020-2025" } });
    assert.ok(calls.every((c) => c.id !== "a"));
  });

  test("switching while the previous section's save is in flight never writes to the new one", async () => {
    const { saver, clock, calls, hold, release } = setup();
    saver.open("b", B);
    hold();
    saver.edit({ content: "Acme 2020-2025" });
    clock.advance(1500);
    await settle();

    saver.open("a", A);
    saver.edit({ content: "TypeScript, Go" });
    const discarded = saver.discard();
    release();
    await discarded;
    clock.advance(5000);
    await settle();

    assert.deepEqual(calls, [{ id: "b", changes: { content: "Acme 2020-2025" } }]);
    assert.equal(saver.hasUnsavedChanges(), false);
  });

  test("debounces edits into one save of the changed fields", async () => {
    const { saver, clock, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "TypeScript, React" });
    clock.advance(1000);
    saver.edit({ content: "TypeScript, React, Node" });
    clock.advance(1000);
    assert.equal(calls.length, 0);
    clock.advance(500);
    await settle();
    assert.deepEqual(calls, [{ id: "a", changes: { content: "TypeScript, React, Node" } }]);
    assert.equal(saver.getState().status, "saved");
  });

  test("opening another item saves the pending edits instead of dropping them", async () => {
    const { saver, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "edited" });
    saver.open("b", B);
    await settle();
    assert.deepEqual(calls, [{ id: "a", changes: { content: "edited" } }]);
    assert.equal(saver.getState().draft?.id, "b");
  });

  test("discard reverts text that autosave already wrote", async () => {
    const { saver, clock, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "experiment" });
    clock.advance(1500);
    await settle();
    await saver.discard();
    assert.deepEqual(calls, [
      { id: "a", changes: { content: "experiment" } },
      { id: "a", changes: { content: "TypeScript" } },
    ]);
    assert.equal(saver.getState().draft, null);
  });

  test("discard before any autosave sends nothing", async () => {
    const { saver, clock, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "experiment" });
    await saver.discard();
    clock.advance(5000);
    await settle();
    assert.equal(calls.length, 0);
  });

  test("saves run one at a time and in order", async () => {
    const { saver, clock, calls, hold, release } = setup();
    saver.open("a", A);
    hold();
    saver.edit({ content: "one" });
    clock.advance(1500);
    await settle();
    saver.edit({ content: "two" });
    clock.advance(1500);
    await settle();
    assert.equal(calls.length, 1, "second save waits for the first");
    release();
    await settle();
    assert.deepEqual(
      calls.map((c) => c.changes.content),
      ["one", "two"],
    );
  });

  test("reopening an item during its save shows the newest text, not the stale server copy", async () => {
    const { saver, calls, hold, release } = setup();
    saver.open("a", A);
    hold();
    saver.edit({ content: "newest" });
    saver.open("b", B);
    await settle();
    // The cache still has the old text while the save is in flight.
    saver.open("a", A);
    assert.equal(saver.getState().draft?.fields.content, "newest");
    release();
    await settle();
    assert.equal(calls.length, 1);
    assert.equal(await saver.flush(), true);
  });

  test("a failed save keeps the text, reports the error and retries on flush", async () => {
    let fail = true;
    const { saver, clock, calls } = setup({
      failWith: () => (fail ? new Error("Network down") : null),
    });
    saver.open("a", A);
    saver.edit({ content: "important" });
    clock.advance(1500);
    await settle();
    assert.equal(saver.getState().status, "error");
    assert.equal(saver.getState().error, "Network down");
    assert.equal(saver.hasUnsavedChanges(), true);

    fail = false;
    assert.equal(await saver.flush(), true);
    assert.equal(calls.length, 2);
    assert.equal(saver.hasUnsavedChanges(), false);
  });

  test("errors for an item that is no longer open are reported in the background", async () => {
    const { saver, backgroundErrors } = setup({ failWith: () => new Error("Too long") });
    saver.open("a", A);
    saver.edit({ content: "x" });
    saver.open("b", B);
    await settle();
    assert.deepEqual(backgroundErrors, ["Too long"]);
    assert.equal(saver.getState().status, "idle");
  });

  test("errors of the open item are reported in the background when nothing is subscribed", async () => {
    const { saver, backgroundErrors } = setup({ failWith: () => new Error("Offline") });
    saver.open("a", A);
    const unsubscribe = saver.subscribe(() => undefined);
    saver.edit({ content: "x" });
    await saver.flush();
    assert.deepEqual(backgroundErrors, [], "the subscribed editor shows it inline");
    unsubscribe();
    saver.edit({ content: "y" });
    saver.dispose();
    await settle();
    assert.deepEqual(backgroundErrors, ["Offline"]);
  });

  test("validation blocks the save without calling the server", async () => {
    const { saver, clock, calls } = setup({
      validate: (f) => (f.title.trim() ? null : "Title required"),
    });
    saver.open("a", A);
    saver.edit({ title: "  " });
    clock.advance(1500);
    await settle();
    assert.equal(calls.length, 0);
    assert.equal(saver.getState().error, "Title required");
    assert.equal(await saver.close(), false, "close keeps the editor open");
  });

  test("close saves and closes; flush resolves once everything is saved", async () => {
    const { saver, calls } = setup();
    saver.open("a", A);
    saver.edit({ title: "Core skills" });
    assert.equal(await saver.close(), true);
    assert.equal(saver.getState().draft, null);
    assert.deepEqual(calls, [{ id: "a", changes: { title: "Core skills" } }]);
  });

  test("forget drops queued saves for a deleted item", async () => {
    const { saver, clock, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "doomed" });
    saver.forget("a");
    clock.advance(5000);
    assert.equal(await saver.flush(), true);
    assert.equal(calls.length, 0);
  });

  test("dispose flushes pending edits", async () => {
    const { saver, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "typed just before leaving" });
    saver.dispose();
    await settle();
    assert.deepEqual(calls, [{ id: "a", changes: { content: "typed just before leaving" } }]);
  });

  test("editing back to the saved text cancels the pending save", async () => {
    const { saver, clock, calls } = setup();
    saver.open("a", A);
    saver.edit({ content: "temp" });
    saver.edit({ content: A.content });
    clock.advance(5000);
    await settle();
    assert.equal(calls.length, 0);
    assert.equal(saver.getState().status, "idle");
  });
});

describe("field helpers", () => {
  test("fieldsEqual compares every key", () => {
    assert.equal(fieldsEqual({ a: "1" }, { a: "1" }), true);
    assert.equal(fieldsEqual({ a: "1" }, { a: "2" }), false);
    assert.equal(fieldsEqual<Record<string, string>>({ a: "1" }, { a: "1", b: "" }), false);
    assert.equal(fieldsEqual(undefined, { a: "1" }), false);
  });

  test("changedFields returns only differences", () => {
    assert.deepEqual(changedFields({ a: "1", b: "2" }, { a: "1", b: "3" }), { b: "3" });
    assert.equal(changedFields({ a: "1" }, { a: "1" }), null);
    assert.deepEqual(changedFields(undefined, { a: "1" }), { a: "1" });
  });
});
