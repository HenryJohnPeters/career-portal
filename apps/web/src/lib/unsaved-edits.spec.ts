import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { flushUnsavedEdits, isLeavingPage, registerUnsavedEdits, setLeavingPage } from "./unsaved-edits";

describe("flushUnsavedEdits", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
  });

  test("is true with nothing registered", async () => {
    assert.equal(await flushUnsavedEdits(), true);
  });

  test("flushes every registered editor and reports whether all saved", async () => {
    const calls: string[] = [];
    cleanups.push(registerUnsavedEdits(async () => (calls.push("a"), true)));
    const unregisterB = registerUnsavedEdits(async () => (calls.push("b"), false));
    assert.equal(await flushUnsavedEdits(), false);
    assert.deepEqual(calls.sort(), ["a", "b"]);

    unregisterB();
    assert.equal(await flushUnsavedEdits(), true);
  });

  test("a rejected flush counts as not saved", async () => {
    cleanups.push(registerUnsavedEdits(() => Promise.reject(new Error("offline"))));
    assert.equal(await flushUnsavedEdits(), false);
  });

  test("gives up after the timeout instead of hanging", async () => {
    cleanups.push(registerUnsavedEdits(() => new Promise<boolean>(() => undefined)));
    const started = Date.now();
    assert.equal(await flushUnsavedEdits(20), false);
    assert.ok(Date.now() - started < 1000);
  });
});

test("leaving flag round-trips", () => {
  assert.equal(isLeavingPage(), false);
  setLeavingPage(true);
  assert.equal(isLeavingPage(), true);
  setLeavingPage(false);
});
