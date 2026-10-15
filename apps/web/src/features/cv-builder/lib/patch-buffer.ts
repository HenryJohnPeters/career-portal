import type { Timers } from "./draft-autosaver";

/*
 * Collects field changes and sends them as one PATCH once the user pauses
 * (contact details while typing, theme while dragging a colour picker).
 * Changes made while a PATCH is in flight go into the next one, and a failed
 * PATCH keeps its fields pending (newer edits win), so nothing is dropped.
 */

export type PatchStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface PatchBufferState<T> {
  status: PatchStatus;
  error: string | null;
  /** Fields the server has not confirmed yet (in flight or waiting). */
  unsaved: Partial<T>;
}

export interface PatchBufferOptions<T> {
  send: (patch: Partial<T>) => Promise<unknown>;
  delayMs: number;
  describeError?: (err: unknown) => string;
  /** A send failed while no component shows the status (e.g. after unmount). */
  onBackgroundError?: (message: string) => void;
  savedDisplayMs?: number;
  timers?: Timers;
}

const browserTimers: Timers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) =>
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const defaultDescribe = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Couldn't save your changes.";

const isEmpty = (value: object) => Object.keys(value).length === 0;

export class PatchBuffer<T extends object> {
  private pending: Partial<T> = {};
  private sending: Partial<T> = {};
  private state: PatchBufferState<T> = { status: "idle", error: null, unsaved: {} };
  private readonly listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private timer: unknown = null;
  private idleTimer: unknown = null;
  private readonly timers: Timers;

  constructor(private readonly options: PatchBufferOptions<T>) {
    this.timers = options.timers ?? browserTimers;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): PatchBufferState<T> => this.state;

  /** Queue changes; they are sent after `delayMs` without further changes. */
  add(patch: Partial<T>): void {
    if (isEmpty(patch)) return;
    this.pending = { ...this.pending, ...patch };
    this.clearTimer();
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.options.delayMs);
    this.update({ status: this.state.status === "saving" ? "saving" : "pending" });
  }

  /** Send pending changes now. Resolves true once the server has everything. */
  flush(): Promise<boolean> {
    this.clearTimer();
    if (!isEmpty(this.pending)) {
      this.queue = this.queue.then(() => this.sendPending());
    }
    return this.queue.then(() => isEmpty(this.pending) && isEmpty(this.sending) && this.state.status !== "error");
  }

  hasUnsavedChanges(): boolean {
    return !isEmpty(this.pending) || !isEmpty(this.sending);
  }

  /** Unmount: send what is pending (the instance stays usable). */
  dispose(): void {
    this.clearIdleTimer();
    void this.flush();
  }

  private async sendPending(): Promise<void> {
    if (isEmpty(this.pending)) return;
    const patch = this.pending;
    this.pending = {};
    this.sending = patch;
    this.update({ status: "saving", error: null });
    try {
      await this.options.send(patch);
      this.sending = {};
      const more = !isEmpty(this.pending);
      this.update({ status: more ? "pending" : "saved", error: null });
      if (!more) this.scheduleIdle();
    } catch (err) {
      this.sending = {};
      // Keep the failed fields for a retry; edits made since win.
      this.pending = { ...patch, ...this.pending };
      const message = (this.options.describeError ?? defaultDescribe)(err);
      this.update({ status: "error", error: message });
      if (this.listeners.size === 0) this.options.onBackgroundError?.(message);
    }
  }

  private scheduleIdle(): void {
    this.clearIdleTimer();
    this.idleTimer = this.timers.setTimeout(() => {
      this.idleTimer = null;
      if (this.state.status === "saved") this.update({ status: "idle" });
    }, this.options.savedDisplayMs ?? 2000);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      this.timers.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      this.timers.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private update(patch: Partial<Omit<PatchBufferState<T>, "unsaved">>): void {
    this.state = {
      ...this.state,
      ...patch,
      unsaved: { ...this.sending, ...this.pending },
    };
    for (const listener of this.listeners) listener();
  }
}
