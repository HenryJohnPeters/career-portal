import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton, useBodyScrollLock, useFocusTrap } from "@careerportal/web/ui";

interface SideDrawerProps {
  /** Escape, the close button and a backdrop click call this. */
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  /** Pinned to the bottom of the panel. */
  footer?: ReactNode;
}

/**
 * Modal panel that slides in from the right. Render it only while open: it
 * traps focus, closes on Escape and returns focus to the opener on unmount,
 * so a closed drawer never lingers in the tab order or accessibility tree.
 */
export function SideDrawer({ onClose, title, subtitle, icon, children, footer }: SideDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [entered, setEntered] = useState(false);

  useFocusTrap(panelRef, true, { onEscape: onClose });
  useBodyScrollLock(true);

  // Slide in on the frame after mounting.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full sm:w-[520px] flex-col bg-bg-elevated border-l border-border shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none focus:outline-none ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-text-primary truncate">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 text-xs text-text-secondary">{subtitle}</div>}
          </div>
          <IconButton label="Close details" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <footer className="border-t border-border px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
