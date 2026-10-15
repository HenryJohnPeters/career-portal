import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, User } from "@careerportal/shared/types";
import { api } from "../api-client";
import { queryKeys } from "../query-keys";

/** GET /auth/me. AuthProvider fetches the user itself; this backs queryKeys.me for components that want it. */
export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => api.get<ApiResponse<User>>("/auth/me", { signal }),
    retry: false,
    enabled,
  });
}
