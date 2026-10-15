/**
 * App-level confirmation dialog (PLAN §3):
 * `{ open, title, description, confirmLabel, destructive?, onConfirm, onCancel, requireText? }`
 * plus optional `loading`, `cancelLabel` and `requireTextLabel`.
 * `onConfirm` receives the typed confirmation text (e.g. the email for account deletion).
 * Implemented once in @careerportal/web/ui (accessible modal with focus trap).
 */
export { ConfirmDialog } from "@careerportal/web/ui";
export type { ConfirmDialogProps } from "@careerportal/web/ui";
