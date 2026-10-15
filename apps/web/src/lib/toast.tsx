import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface ToastEntry {
  id: number;
  type: ToastType;
  message: string;
  /** Bumped when an identical toast is shown again (restarts its timer). */
  repeat: number;
}

/*
 * A small external store so toasts can be raised from outside React (e.g. the
 * React Query MutationCache error handler) as well as through useToast().
 */
const MAX_VISIBLE = 3;
const DURATION_MS: Record<ToastType, number> = {
  success: 3500,
  warning: 6000,
  error: 6000,
};

let toasts: ToastEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => toasts;

/** Show a toast. An identical visible toast is refreshed instead of stacked. */
export function showToast(type: ToastType, message: string): void {
  const text = message.trim();
  if (!text) return;
  const existing = toasts.find((t) => t.type === type && t.message === text);
  if (existing) {
    toasts = toasts.map((t) =>
      t.id === existing.id ? { ...t, repeat: t.repeat + 1 } : t,
    );
  } else {
    toasts = [...toasts, { id: nextId++, type, message: text, repeat: 0 }].slice(
      -MAX_VISIBLE,
    );
  }
  emit();
}

export function dismissToast(id: number): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

const TOAST_API = {
  toast: showToast,
  dismiss: dismissToast,
} as const;

/** `const { toast } = useToast(); toast("error", "…")` — stable across renders. */
export function useToast() {
  return TOAST_API;
}

/** Renders its children plus the toast viewport (mount once, near the root). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}

function ToastViewport() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const errors = items.filter((t) => t.type === "error");
  const others = items.filter((t) => t.type !== "error");

  // Both live regions stay mounted so additions are reliably announced.
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col items-end gap-2 pointer-events-none">
      <div role="alert" aria-live="assertive" className="flex flex-col items-end gap-2">
        {errors.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
      <div role="status" aria-live="polite" className="flex flex-col items-end gap-2">
        {others.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </div>
  );
}

const ICON_MAP = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const STYLE_MAP = {
  success:
    "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
  error:
    "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  warning:
    "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
};

const EXIT_MS = 200;

function ToastItem({ toast }: { toast: ToastEntry }) {
  const { id, type, repeat } = toast;
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>();

  const close = useCallback(() => {
    setVisible(false);
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => dismissToast(id), EXIT_MS);
  }, [id]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(exitTimer.current);
    };
  }, []);

  // Restart the countdown when the same message repeats; hold it while hovered/focused.
  useEffect(() => {
    if (paused) return;
    clearTimeout(exitTimer.current);
    setVisible(true);
    const timer = setTimeout(close, DURATION_MS[type]);
    return () => clearTimeout(timer);
  }, [repeat, type, paused, close]);

  const Icon = ICON_MAP[toast.type];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full sm:w-auto sm:max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-200 motion-reduce:transition-none ${
        STYLE_MAP[toast.type]
      } ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex-1 break-words">{toast.message}</span>
      <button
        type="button"
        onClick={close}
        className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
