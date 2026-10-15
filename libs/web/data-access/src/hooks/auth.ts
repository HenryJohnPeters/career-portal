import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, User } from "@careerportal/shared/types";
import { api } from "../api-client";
import { queryKeys } from "../query-keys";

/**
 * GET /auth/me. This query is the app's source of truth for the signed-in
 * user: AuthProvider (apps/web/src/lib/auth.tsx) observes it, so
 * `setQueryData(queryKeys.me, …)` or invalidating `queryKeys.me` updates the
 * user everywhere without a blocking reload.
 */
export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => api.get<ApiResponse<User>>("/auth/me", { signal }),
    enabled,
    staleTime: 5 * 60_000,
    // AuthProvider renders /auth/me failures itself.
    meta: { silent: true },
  });
}
