export interface LruCacheOptions<V> {
  maxEntries: number;
  /** Upper bound on the summed `sizeOf` of all entries. */
  maxBytes: number;
  ttlMs: number;
  sizeOf: (value: V) => number;
  now?: () => number;
}

interface Entry<V> {
  value: V;
  size: number;
  expiresAt: number;
}

/**
 * In-memory LRU bounded by entry count, total size and age. A Map keeps
 * insertion order, so re-inserting on access makes the first key the least
 * recently used.
 */
export class LruCache<V> {
  private readonly entries = new Map<string, Entry<V>>();
  private totalBytes = 0;
  private readonly now: () => number;

  constructor(private readonly options: LruCacheOptions<V>) {
    this.now = options.now ?? Date.now;
  }

  get size(): number {
    return this.entries.size;
  }

  get bytes(): number {
    return this.totalBytes;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.remove(key, entry);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  /** Stores `value` unless it alone exceeds `maxBytes`; evicts LRU entries to fit. */
  set(key: string, value: V, ttlMs = this.options.ttlMs): void {
    const existing = this.entries.get(key);
    if (existing) this.remove(key, existing);

    const size = this.options.sizeOf(value);
    if (size > this.options.maxBytes) return;

    this.entries.set(key, { value, size, expiresAt: this.now() + ttlMs });
    this.totalBytes += size;

    for (const [oldKey, entry] of this.entries) {
      if (
        this.entries.size <= this.options.maxEntries &&
        this.totalBytes <= this.options.maxBytes
      ) {
        break;
      }
      this.remove(oldKey, entry);
    }
  }

  delete(key: string): void {
    const entry = this.entries.get(key);
    if (entry) this.remove(key, entry);
  }

  clear(): void {
    this.entries.clear();
    this.totalBytes = 0;
  }

  private remove(key: string, entry: Entry<V>): void {
    this.entries.delete(key);
    this.totalBytes -= entry.size;
  }
}
