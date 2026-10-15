/*
 * Debounced autosave for an editor that has one item open at a time (a CV
 * section or a cover letter). Framework-free, so its timing rules are unit
 * tested (draft-autosaver.spec.ts):
 *
 * - Every save carries the id of the item it was made from. Opening another
 *   item can never write the previous item's text into it.
 * - Saves run one at a time, in the order they were made.
 * - Opening another item, flush(), close() and dispose() save pending edits
 *   instead of dropping them.
 * - discard() restores the text the item had when it was opened, reverting any
 *   autosave that already reached the server.
 */

export type DraftFields = Record<string, string>;

export interface Draft<F extends DraftFields> {
  id: string;
  fields: F;
}

/** pending = edited, waiting for the debounce; saving = request in flight. */
export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface AutosaveState<F extends DraftFields> {
  /** The open item, with the editor's current text. */
  draft: Draft<F> | null;
  status: AutosaveStatus;
  /** Why the open item's last save failed. */
  error: string | null;
}

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const browserTimers: Timers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) =>
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface DraftAutosaverOptions<F extends DraftFields> {
  /** Persist the fields that differ from the last save. Rejects on failure. */
  save: (id: string, changes: Partial<F>) => Promise<unknown>;
  /** Pause after the last edit before saving. */
  delayMs?: number;
  /** A message blocks the save (e.g. an empty title). */
  validate?: (fields: F) => string | null;
  /** User-facing message for a failed save. */
  describeError?: (err: unknown) => string;
  /**
   * A save failed where no status shows it: the item is no longer open, or no
   * component is subscribed (e.g. the editor unmounted).
   */
  onBackgroundError?: (message: string) => void;
  /** How long "saved" shows before returning to "idle". */
  savedDisplayMs?: number;
  timers?: Timers;
}

export function fieldsEqual<F extends DraftFields>(
  a: F | undefined,
  b: F | undefined,
): boolean {
  if (!a || !b) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/** The fields of `next` that differ from `base` (all of them without a base); null when equal. */
export function changedFields<F extends DraftFields>(
  base: F | undefined,
  next: F,
): Partial<F> | null {
  const changes: Partial<F> = {};
  let changed = false;
  for (const key of Object.keys(next) as (keyof F)[]) {
    if (!base || base[key] !== next[key]) {
      changes[key] = next[key];
      changed = true;
    }
  }
  return changed ? changes : null;
}

const defaultDescribe = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Couldn't save your changes.";

export class DraftAutosaver<F extends DraftFields> {
  private state: AutosaveState<F> = { draft: null, status: "idle", error: null };
  private readonly listeners = new Set<() => void>();
  /** Field values the server has confirmed, per item. */
  private readonly saved = new Map<string, F>();
  /** Latest local values per item (saved or not), so reopening never shows stale text. */
  private readonly local = new Map<string, F>();
  /** Saves queued or in flight, per item. */
  private readonly queued = new Map<string, number>();
  /** Items that were deleted: their queued saves are skipped. */
  private readonly forgotten = new Set<string>();
  /** The open item's text when it was opened (what discard() restores). */
  private baseline: Draft<F> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private saveTimer: unknown = null;
  private idleTimer: unknown = null;
  private readonly timers: Timers;
  private readonly delayMs: number;
  private readonly savedDisplayMs: number;

  constructor(private readonly options: DraftAutosaverOptions<F>) {
    this.timers = options.timers ?? browserTimers;
    this.delayMs = options.delayMs ?? 1500;
    this.savedDisplayMs = options.savedDisplayMs ?? 2000;
  }

  // --- store API (useSyncExternalStore) ---

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): AutosaveState<F> => this.state;

  // --- editing ---

  /**
   * Open an item in the editor. `serverFields` is the item as last fetched;
   * unsaved local text for it (e.g. after a failed save) takes precedence.
   * The previously open item's pending edits are saved first.
   */
  open(id: string, serverFields: F): void {
    const current = this.state.draft;
    if (current?.id === id) return;
    if (current) void this.flush();

    this.forgotten.delete(id);
    const busy = (this.queued.get(id) ?? 0) > 0;
    const unsaved = this.local.has(id) && !fieldsEqual(this.local.get(id), this.saved.get(id));
    if (!busy && !unsaved) {
      this.saved.set(id, serverFields);
      this.local.set(id, serverFields);
    }
    const fields = this.local.get(id) ?? serverFields;
    this.baseline = { id, fields };
    const dirty = !fieldsEqual(fields, this.saved.get(id));
    this.setState({ draft: { id, fields }, status: dirty ? "pending" : "idle", error: null });
    if (dirty) this.scheduleSave(id);
  }

  /** Apply editor changes to the open item and schedule a save. */
  edit(patch: Partial<F>): void {
    const draft = this.state.draft;
    if (!draft) return;
    const fields = { ...draft.fields, ...patch } as F;
    if (fieldsEqual(fields, draft.fields)) return;
    this.local.set(draft.id, fields);
    const dirty = !fieldsEqual(fields, this.saved.get(draft.id));
    if (dirty) {
      this.scheduleSave(draft.id);
    } else {
      this.clearSaveTimer();
    }
    this.setState({
      draft: { id: draft.id, fields },
      status: dirty ? "pending" : this.isQueued(draft.id) ? "saving" : "idle",
      error: dirty ? this.state.error : null,
    });
  }

  /**
   * Save every unsaved item now (the open one included). Resolves true when
   * the server has all local text — callers use it before exporting a PDF.
   */
  flush(): Promise<boolean> {
    this.clearSaveTimer();
    for (const [id, fields] of this.local) {
      if (!this.forgotten.has(id) && !fieldsEqual(fields, this.saved.get(id))) {
        void this.enqueue(id, fields);
      }
    }
    return this.queue.then(() => this.allSaved());
  }

  /** Save the open item and close the editor. Stays open (false) when the save fails. */
  async close(): Promise<boolean> {
    const draft = this.state.draft;
    if (!draft) return true;
    await this.flush();
    const open = this.state.draft;
    if (!open || open.id !== draft.id) return true;
    if (!fieldsEqual(open.fields, this.saved.get(open.id))) return false;
    this.setState({ draft: null, status: "idle", error: null });
    return true;
  }

  /** Close the open item, restoring the text it had when opened (also on the server). */
  discard(): Promise<boolean> {
    const draft = this.state.draft;
    if (!draft) return Promise.resolve(true);
    this.clearSaveTimer();
    const restored =
      this.baseline?.id === draft.id ? this.baseline.fields : draft.fields;
    this.local.set(draft.id, restored);
    this.setState({ draft: null, status: "idle", error: null });
    return this.enqueue(draft.id, restored);
  }

  /** The item was deleted: close it if open and drop any unsaved or queued text. */
  forget(id: string): void {
    this.forgotten.add(id);
    this.saved.delete(id);
    this.local.delete(id);
    if (this.state.draft?.id === id) {
      this.clearSaveTimer();
      this.setState({ draft: null, status: "idle", error: null });
    }
  }

  /** Every item was replaced server-side (e.g. a bulk apply): start over. */
  reset(): void {
    for (const id of this.local.keys()) this.forgotten.add(id);
    this.saved.clear();
    this.local.clear();
    this.baseline = null;
    this.clearSaveTimer();
    this.setState({ draft: null, status: "idle", error: null });
  }

  /** Unmount: save what is pending. The instance stays usable (React StrictMode remounts). */
  dispose(): void {
    this.clearIdleTimer();
    void this.flush();
  }

  /** Unsaved local text, or a save still running. */
  hasUnsavedChanges(): boolean {
    for (const count of this.queued.values()) if (count > 0) return true;
    return !this.allSaved();
  }

  // --- internals ---

  private allSaved(): boolean {
    for (const [id, fields] of this.local) {
      if (!this.forgotten.has(id) && !fieldsEqual(fields, this.saved.get(id))) {
        return false;
      }
    }
    return true;
  }

  private isQueued(id: string): boolean {
    return (this.queued.get(id) ?? 0) > 0;
  }

  private isOpen(id: string): boolean {
    return this.state.draft?.id === id;
  }

  private scheduleSave(id: string): void {
    this.clearSaveTimer();
    this.saveTimer = this.timers.setTimeout(() => {
      this.saveTimer = null;
      // open() flushes and clears this timer before switching items, so it
      // always belongs to the open item; the check is a safety net.
      const draft = this.state.draft;
      if (draft?.id === id) void this.enqueue(id, draft.fields);
    }, this.delayMs);
  }

  private clearSaveTimer(): void {
    if (this.saveTimer !== null) {
      this.timers.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      this.timers.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private enqueue(id: string, fields: F): Promise<boolean> {
    this.queued.set(id, (this.queued.get(id) ?? 0) + 1);
    const run = this.queue
      .then(() => this.persist(id, fields))
      .finally(() => {
        const left = (this.queued.get(id) ?? 1) - 1;
        if (left > 0) this.queued.set(id, left);
        else this.queued.delete(id);
      });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async persist(id: string, fields: F): Promise<boolean> {
    if (this.forgotten.has(id)) return true;
    const saved = this.saved.get(id);
    const changes = changedFields(saved, fields);
    if (!changes) return true;

    const invalid = this.options.validate?.(fields) ?? null;
    if (invalid) {
      this.reportError(id, invalid);
      return false;
    }

    if (this.isOpen(id)) this.patchState({ status: "saving", error: null });
    try {
      await this.options.save(id, changes);
    } catch (err) {
      if (!this.forgotten.has(id)) {
        this.reportError(id, (this.options.describeError ?? defaultDescribe)(err));
      }
      return false;
    }

    if (this.forgotten.has(id)) return true;
    this.saved.set(id, { ...(saved ?? fields), ...changes } as F);
    const open = this.state.draft;
    if (open?.id === id) {
      const dirty = !fieldsEqual(open.fields, this.saved.get(id));
      this.patchState({ status: dirty ? "pending" : "saved", error: null });
      if (!dirty) this.scheduleIdle();
    }
    return true;
  }

  private reportError(id: string, message: string): void {
    const open = this.isOpen(id);
    if (open) this.patchState({ status: "error", error: message });
    if (!open || this.listeners.size === 0) this.options.onBackgroundError?.(message);
  }

  private scheduleIdle(): void {
    this.clearIdleTimer();
    this.idleTimer = this.timers.setTimeout(() => {
      this.idleTimer = null;
      if (this.state.status === "saved") this.patchState({ status: "idle" });
    }, this.savedDisplayMs);
  }

  private patchState(patch: Partial<AutosaveState<F>>): void {
    this.setState({ ...this.state, ...patch });
  }

  private setState(next: AutosaveState<F>): void {
    this.state = next;
    for (const listener of this.listeners) listener();
  }
}
