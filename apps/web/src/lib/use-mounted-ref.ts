import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * `.current` is true while the component is mounted (StrictMode-safe). Check
 * it after an await before navigating: a request that finishes after the user
 * moved on must not pull them back.
 */
export function useMountedRef(): MutableRefObject<boolean> {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
