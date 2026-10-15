import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import {
  getErrorMessage,
  isAbortError,
  isApiError,
  requestUpgradeForError,
  shouldRetryRequest,
} from "@careerportal/web/data-access";
import { showToast } from "./toast";
import { reportError } from "./report-error";

/**
 * `meta` understood by the global error handlers:
 * - `silent: true` — the feature shows the error (and any upgrade prompt) itself;
 *   the global handler does nothing.
 * - `errorMessage` (mutations) — toast text used instead of the server message.
 */
export interface AppQueryMeta extends Record<string, unknown> {
  silent?: boolean;
}

export interface AppMutationMeta extends Record<string, unknown> {
  silent?: boolean;
  errorMessage?: string;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: AppQueryMeta;
    mutationMeta: AppMutationMeta;
  }
}

/** 4xx responses are expected outcomes (validation, quota, not found), not bugs. */
function isUnexpected(error: unknown): boolean {
  if (isAbortError(error)) return false;
  return !(isApiError(error) && error.status >= 400 && error.status < 500);
}

/**
 * Query errors render in place (ErrorState); only quota/premium errors open the
 * global UpgradeDialog. Mutation errors open the UpgradeDialog for quota/premium
 * errors and otherwise toast, so no user action fails silently.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isUnexpected(error)) reportError(error, { queryKey: query.queryKey });
        if (query.meta?.silent) return;
        requestUpgradeForError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (isAbortError(error)) return;
        if (isUnexpected(error)) {
          reportError(error, { mutationKey: mutation.options.mutationKey });
        }
        if (mutation.meta?.silent) return;
        if (requestUpgradeForError(error)) return;
        showToast("error", mutation.meta?.errorMessage ?? getErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        retry: shouldRetryRequest,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
