import { useEffect, useRef, useSyncExternalStore } from "react";

interface ExternalStore<S> {
  subscribe: (listener: () => void) => () => void;
  getState: () => S;
}

/**
 * Subscribe to part of an external store (DraftAutosaver, PatchBuffer). The
 * selector must return a primitive or an existing object, so components that
 * only need e.g. the open item's id don't re-render on every keystroke.
 */
export function useStoreSelector<S, R>(store: ExternalStore<S>, selector: (state: S) => R): R {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

/** A ref that always holds the latest value (for callbacks run from timers or unload events). */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
