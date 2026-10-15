import { useSyncExternalStore } from "react";
import type { PremiumFeature, QuotaKey } from "@careerportal/shared/types";
import { isPremiumRequiredError, isQuotaError } from "./api-client";

/*
 * Global upgrade prompt (PLAN §2.1). A tiny external store: anything can call
 * requestUpgrade() — the MutationCache error handler for quota/premium API
 * errors, or a locked button — and the single <UpgradeDialog> rendered by the
 * app shell subscribes with useUpgradePrompt().
 */

export interface UpgradePromptRequest {
  reason: "quota_exceeded" | "premium_required";
  quota?: QuotaKey;
  feature?: PremiumFeature;
  /** Server/feature copy to show instead of the generic text. */
  message?: string;
  /** Quota context, when known (e.g. from the API error details). */
  limit?: number;
  used?: number;
  resetsAt?: string | null;
}

export interface UpgradePrompt extends UpgradePromptRequest {
  /** Increments for every prompt opened, usable as a React key. */
  id: number;
}

let current: UpgradePrompt | null = null;
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

/** Open the upgrade prompt. An identical prompt that is already open is kept (no stacking). */
export function requestUpgrade(request: UpgradePromptRequest): void {
  if (
    current &&
    current.reason === request.reason &&
    current.quota === request.quota &&
    current.feature === request.feature
  ) {
    return;
  }
  current = { ...request, id: nextId++ };
  emit();
}

export function dismissUpgrade(): void {
  if (!current) return;
  current = null;
  emit();
}

/** Current prompt, outside React. */
export function getUpgradePrompt(): UpgradePrompt | null {
  return current;
}

/**
 * Open the prompt for a quota/premium API error.
 * Returns true when the error was one of those (so callers can skip a toast).
 */
export function requestUpgradeForError(err: unknown): boolean {
  if (isQuotaError(err)) {
    requestUpgrade({
      reason: "quota_exceeded",
      quota: err.details.quota,
      message: err.message,
      limit: err.details.limit,
      used: err.details.used,
      resetsAt: err.details.resetsAt,
    });
    return true;
  }
  if (isPremiumRequiredError(err)) {
    requestUpgrade({
      reason: "premium_required",
      feature: err.details.feature,
      message: err.message,
    });
    return true;
  }
  return false;
}

/** The open prompt (or null); re-renders when it opens or closes. */
export function useUpgradePrompt(): UpgradePrompt | null {
  return useSyncExternalStore(subscribe, getUpgradePrompt, getUpgradePrompt);
}
