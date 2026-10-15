import { removeStorageByPrefix } from "./storage";

/*
 * Users' own unsent work kept in this browser's storage (take-home answers).
 * It must never outlive the session on a shared device: sign-out clears it,
 * and editors still mounted at that moment (whose unmount / pagehide flush
 * runs after the purge) may only write while the account they were opened
 * under is still the signed-in one.
 */

const PRIVATE_DRAFT_PREFIXES = ["careerportal:techtest-draft:"];

let owner: string | null = null;

/** Deletes every private draft and blocks writes until an account is signed in again. */
export function clearPrivateDrafts(): void {
  owner = null;
  for (const prefix of PRIVATE_DRAFT_PREFIXES) removeStorageByPrefix(prefix);
}

/** The signed-in account (null when signed out). Called by AuthProvider on every session change. */
export function setPrivateDraftOwner(userId: string | null): void {
  owner = userId;
}

/** Whose drafts may be written now; editors capture it when they mount. */
export function privateDraftOwner(): string | null {
  return owner;
}

/** True when a draft opened under `openedBy` may still be written. */
export function canWritePrivateDraft(openedBy: string | null): boolean {
  return openedBy !== null && openedBy === owner;
}
