/** Thrown when a semaphore cannot grant a slot (queue full or wait too long). */
export class SemaphoreRejectedError extends Error {
  constructor(readonly reason: "queue_full" | "wait_timeout") {
    super(`Semaphore rejected: ${reason}`);
  }
}

interface Waiter {
  grant: () => void;
  timer: NodeJS.Timeout;
}

/**
 * In-memory counting semaphore with a bounded wait queue, used by the PDF
 * renderer to cap concurrent browser pages. `acquire` rejects instead of
 * queueing without limit, so a burst turns into fast 503s rather than a pile
 * of requests that time out client-side.
 */
export class Semaphore {
  private readonly queue: Waiter[] = [];
  private running = 0;

  constructor(
    private readonly max: number,
    private readonly maxQueue = Number.POSITIVE_INFINITY,
    private readonly maxWaitMs = Number.POSITIVE_INFINITY,
  ) {}

  get active(): number {
    return this.running;
  }

  get waiting(): number {
    return this.queue.length;
  }

  acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return Promise.resolve();
    }
    if (this.queue.length >= this.maxQueue) {
      return Promise.reject(new SemaphoreRejectedError("queue_full"));
    }
    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        grant: () => {
          clearTimeout(waiter.timer);
          this.running++;
          resolve();
        },
        timer: setTimeout(() => {
          const index = this.queue.indexOf(waiter);
          if (index !== -1) this.queue.splice(index, 1);
          reject(new SemaphoreRejectedError("wait_timeout"));
        }, Math.min(this.maxWaitMs, 2_147_483_647)),
      };
      this.queue.push(waiter);
    });
  }

  release(): void {
    if (this.running <= 0) return;
    this.running--;
    this.queue.shift()?.grant();
  }

  /** Runs `fn` while holding a slot; the slot is always released. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
