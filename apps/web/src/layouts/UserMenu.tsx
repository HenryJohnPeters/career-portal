import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, CreditCard, LogOut, Settings } from "lucide-react";
import type { User } from "@careerportal/shared/types";

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-neutral-100 hover:text-text-primary focus:bg-neutral-100 focus:text-text-primary focus:outline-none dark:hover:bg-white/5 dark:focus:bg-white/5";

interface UserMenuProps {
  user: User | null;
  premium: boolean;
  onLogout: () => void;
}

/**
 * Account menu (Settings, Billing, Log out) following the WAI-ARIA menu
 * button pattern: Enter/Space/ArrowDown open it, arrows move, Escape closes
 * and returns focus to the button.
 */
export function UserMenu({ user, premium, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [focusOnOpen, setFocusOnOpen] = useState<"first" | "last" | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { pathname } = useLocation();

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const focusItem = (index: number) => {
    const items = menuItems();
    if (items.length === 0) return;
    items[(index + items.length) % items.length].focus();
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || !focusOnOpen) return;
    focusItem(focusOnOpen === "first" ? 0 : -1);
    setFocusOnOpen(null);
  }, [open, focusOnOpen]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openMenu = (focus: "first" | "last" | null) => {
    setOpen(true);
    setFocusOnOpen(focus);
  };

  const onButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (open) {
      setOpen(false);
      return;
    }
    // detail === 0: activated from the keyboard (Enter/Space) → focus the first item.
    openMenu(event.detail === 0 ? "first" : null);
  };

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // Opened with the mouse, focus stays on the button: Escape must still close it.
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? "first" : "last");
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(-1);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={`${menuId}-button`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu${user?.name ? ` for ${user.name}` : ""}`}
        onClick={onButtonClick}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-bold shadow-sm select-none"
        >
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[10rem] truncate text-sm font-medium text-text-primary">
          {user?.name}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-button`}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-border bg-bg-elevated p-1.5 shadow-lg animate-scale-in"
        >
          <div role="none" className="px-3 py-2 border-b border-border mb-1">
            <p className="truncate text-sm font-semibold text-text-primary">{user?.name}</p>
            <p className="truncate text-xs text-text-tertiary">{user?.email}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
              {premium ? (user?.isTrialing ? "Premium trial" : "Premium") : "Free plan"}
            </p>
          </div>
          <Link to="/app/settings" role="menuitem" tabIndex={-1} className={ITEM_CLASS} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
          <Link to="/app/billing" role="menuitem" tabIndex={-1} className={ITEM_CLASS} onClick={() => setOpen(false)}>
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            {premium ? "Billing" : "Upgrade & billing"}
          </Link>
          <div role="separator" className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={`${ITEM_CLASS} hover:!text-red-600 focus:!text-red-600`}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
