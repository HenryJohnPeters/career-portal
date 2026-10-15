import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button, IconButton } from "./Button";
import { useBodyScrollLock, useFocusTrap } from "./focus-trap";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

export interface DialogProps {
  open: boolean;
  /** Escape, the close button and (unless disabled) a backdrop click call this. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Shown left of the title. */
  icon?: ReactNode;
  children?: ReactNode;
  /** Action buttons, right-aligned under the content. */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** "alertdialog" for confirmations that interrupt the user. */
  role?: "dialog" | "alertdialog";
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;
  hideCloseButton?: boolean;
  className?: string;
}

/**
 * Accessible modal: role="dialog" + aria-modal, labelled by its title,
 * focus trapped inside, Escape closes, focus returns to the opener.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  role = "dialog",
  initialFocusRef,
  closeOnBackdrop = true,
  hideCloseButton = false,
  className = "",
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef, open, { onEscape: onClose, initialFocusRef });
  useBodyScrollLock(open);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-elevated shadow-xl border border-border animate-scale-in focus:outline-none ${className}`}
      >
        {!hideCloseButton && (
          <IconButton label="Close dialog" size="sm" onClick={onClose} className="absolute top-4 right-4">
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        )}
        <div className="p-6">
          <div className={`flex items-start gap-4 ${hideCloseButton ? "" : "pr-8"}`}>
            {icon}
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 id={titleId} className="text-base font-semibold text-text-primary">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  {description}
                </div>
              )}
            </div>
          </div>
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** @deprecated Use `description`. */
  message?: ReactNode;
  /** Defaults to "Delete" for destructive dialogs, otherwise "Confirm". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button and trash icon. */
  destructive?: boolean;
  /** @deprecated Use `destructive` ("danger" = destructive). */
  variant?: "danger" | "warning";
  /** The user must type this (case-insensitive) before confirming, e.g. their email. */
  requireText?: string;
  /** Label for the confirmation input (default: "Type <requireText> to confirm"). */
  requireTextLabel?: ReactNode;
  /** Disables both buttons and shows a spinner on confirm while an action runs. */
  loading?: boolean;
  /** Receives the typed confirmation text ("" when `requireText` is not set). */
  onConfirm: (confirmText: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  variant,
  requireText,
  requireTextLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDestructive = destructive ?? variant === "danger";
  const [typed, setTyped] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const matches =
    !requireText || typed.trim().toLowerCase() === requireText.trim().toLowerCase();
  const close = () => {
    if (!loading) onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      role="alertdialog"
      size="sm"
      title={title}
      description={description ?? message}
      closeOnBackdrop={!loading}
      initialFocusRef={requireText ? inputRef : cancelRef}
      icon={
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isDestructive
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          }`}
        >
          {isDestructive ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
      }
      footer={
        <>
          <Button ref={cancelRef} type="button" variant="ghost" size="sm" onClick={close} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            loading={loading}
            disabled={!matches}
            onClick={() => onConfirm(typed.trim())}
          >
            {confirmLabel ?? (isDestructive ? "Delete" : "Confirm")}
          </Button>
        </>
      }
    >
      {requireText && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (matches && !loading) onConfirm(typed.trim());
          }}
        >
          <label htmlFor={inputId} className="label">
            {requireTextLabel ?? (
              <>
                Type <span className="font-mono normal-case tracking-normal text-text-primary">{requireText}</span> to confirm
              </>
            )}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={loading}
            className="input-base"
          />
        </form>
      )}
    </Dialog>
  );
}
