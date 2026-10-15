import { useQuery } from "@tanstack/react-query";
import type {
  AiUsageStatus,
  ApiResponse,
  PlanUsage,
} from "@careerportal/shared/types";
import { api } from "../api-client";
import { queryKeys } from "../query-keys";

/** GET /account/usage — every meter, fair-use status and premium feature flags. */
export function usePlanUsage(enabled = true) {
  return useQuery({
    queryKey: queryKeys.planUsage,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<PlanUsage>>("/account/usage", { signal }),
    enabled,
  });
}

/** Legacy GET /auth/ai-usage. Prefer usePlanUsage. */
export function useAiUsage() {
  return useQuery({
    queryKey: queryKeys.aiUsage,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<AiUsageStatus>>("/auth/ai-usage", { signal }),
  });
}
