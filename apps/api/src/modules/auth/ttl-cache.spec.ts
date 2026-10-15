import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TtlCache } from "./ttl-cache";

function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("TtlCache", () => {
  test("returns values until they expire", () => {
    const c = clock();
    const cache = new TtlCache<string>(10, 1_000, c.now);
    cache.set("a", "1");
    c.advance(999);
    assert.equal(cache.get("a"), "1");
    c.advance(1);
    assert.equal(cache.get("a"), undefined);
    assert.equal(cache.size, 0, "expired entries are dropped on read");
  });

  test("evicts the least recently used entry past the bound", () => {
    const cache = new TtlCache<number>(2, 60_000, clock().now);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // a is now more recent than b
    cache.set("c", 3);
    assert.equal(cache.get("b"), undefined);
    assert.equal(cache.get("a"), 1);
    assert.equal(cache.get("c"), 3);
    assert.equal(cache.size, 2);
  });

  test("set refreshes the TTL and delete removes", () => {
    const c = clock();
    const cache = new TtlCache<number>(10, 1_000, c.now);
    cache.set("a", 1);
    c.advance(900);
    cache.set("a", 2);
    c.advance(900);
    assert.equal(cache.get("a"), 2);
    cache.delete("a");
    assert.equal(cache.get("a"), undefined);
  });
});
