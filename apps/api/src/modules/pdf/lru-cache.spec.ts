import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { LruCache } from "./lru-cache";

function cache(options: { maxEntries?: number; maxBytes?: number; ttlMs?: number } = {}) {
  let now = 0;
  const lru = new LruCache<string>({
    maxEntries: options.maxEntries ?? 3,
    maxBytes: options.maxBytes ?? 1_000,
    ttlMs: options.ttlMs ?? 1_000,
    sizeOf: (v) => v.length,
    now: () => now,
  });
  return { lru, advance: (ms: number) => (now += ms) };
}

describe("LruCache", () => {
  test("evicts the least recently used entry past maxEntries", () => {
    const { lru } = cache();
    lru.set("a", "1");
    lru.set("b", "2");
    lru.set("c", "3");
    lru.get("a"); // a is now most recent
    lru.set("d", "4");
    assert.equal(lru.get("b"), undefined);
    assert.equal(lru.get("a"), "1");
    assert.equal(lru.size, 3);
  });

  test("evicts until the byte budget fits", () => {
    const { lru } = cache({ maxEntries: 10, maxBytes: 10 });
    lru.set("a", "aaaa");
    lru.set("b", "bbbb");
    lru.set("c", "cccc");
    assert.equal(lru.get("a"), undefined);
    assert.equal(lru.bytes, 8);
  });

  test("never stores a value larger than the budget", () => {
    const { lru } = cache({ maxBytes: 3 });
    lru.set("big", "xxxx");
    assert.equal(lru.get("big"), undefined);
    assert.equal(lru.bytes, 0);
  });

  test("expires entries after their ttl", () => {
    const { lru, advance } = cache({ ttlMs: 100 });
    lru.set("a", "1");
    lru.set("b", "2", 500);
    advance(150);
    assert.equal(lru.get("a"), undefined);
    assert.equal(lru.get("b"), "2");
    assert.equal(lru.bytes, 1);
  });

  test("replacing a key keeps byte accounting exact", () => {
    const { lru } = cache();
    lru.set("a", "1234");
    lru.set("a", "12");
    assert.equal(lru.bytes, 2);
    lru.delete("a");
    assert.equal(lru.bytes, 0);
  });
});
