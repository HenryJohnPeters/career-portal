import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, DashboardSummary } from "@careerportal/shared/types";
import { api } from "../api-client";
import { queryKeys } from "../query-keys";

/**
 * GET /dashboard/summary — counts, pipeline, action centre and onboarding.
 * Also drives the sidebar's overdue follow-up badge, so it refreshes when the
 * user comes back to the tab (at most once a minute).
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<DashboardSummary>>("/dashboard/summary", { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
