import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

/** Visible, enabled, tabbable descendants in DOM order. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (el) =>
      el.getAttribute("aria-hidden") !== "true" &&
      el.getClientRects().length > 0,
  );
}

/** Open traps, innermost last: only the top one handles keys. */
const trapStack: symbol[] = [];

export interface FocusTrapOptions {
  /** Called on Escape while this trap is the innermost one. */
  onEscape?: () => void;
  /** Element to focus on activation (default: first focusable, else the container). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Return focus to the previously focused element on deactivation (default true). */
  restoreFocus?: boolean;
}

/**
 * Keeps Tab / Shift+Tab inside `containerRef` while `active`, handles Escape,
 * and restores focus when the trap is released. The container should have
 * tabIndex={-1} so it can take focus when it has no focusable children.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {},
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const token = Symbol("focus-trap");
    trapStack.push(token);
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = requestAnimationFrame(() => {
      if (container.contains(document.activeElement)) return;
      const target =
        optionsRef.current.initialFocusRef?.current ??
        getFocusableElements(container)[0] ??
        container;
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (trapStack[trapStack.length - 1] !== token) return;

      if (event.key === "Escape") {
        const onEscape = optionsRef.current.onEscape;
        if (onEscape) {
          event.preventDefault();
          event.stopPropagation();
          onEscape();
        }
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      const outside = !container.contains(current);
      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      const index = trapStack.lastIndexOf(token);
      if (index !== -1) trapStack.splice(index, 1);
      if (
        optionsRef.current.restoreFocus !== false &&
        previouslyFocused?.isConnected
      ) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef]);
}

let scrollLocks = 0;
let overflowBeforeLock = "";

/** Prevents the page behind an overlay from scrolling; nested locks are counted. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (scrollLocks === 0) {
      overflowBeforeLock = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    scrollLocks += 1;
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = overflowBeforeLock;
    };
  }, [active]);
}
