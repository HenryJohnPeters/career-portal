import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, DashboardSummary } from "@careerportal/shared/types";
import { api } from "../api-client";
import { queryKeys } from "../query-keys";

/** GET /dashboard/summary — counts, pipeline, action centre and onboarding. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<DashboardSummary>>("/dashboard/summary", { signal }),
  });
}
