import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResponse,
  BillingRedirect,
  SubscriptionStatus,
} from "@careerportal/shared/types";
import { api } from "../api-client";
import { invalidateUsage, queryKeys } from "../query-keys";

/** GET /billing/status */
export function useSubscriptionStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.subscriptionStatus,
    queryFn: ({ signal }) =>
      api.get<ApiResponse<SubscriptionStatus>>("/billing/status", { signal }),
    enabled,
  });
}

/** POST /billing/checkout → Stripe Checkout URL (or the billing portal when a payment needs fixing). */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: () => api.post<ApiResponse<BillingRedirect>>("/billing/checkout"),
  });
}

/**
 * POST /billing/checkout/verify. On success the subscription, the signed-in
 * user (`me`, observed by AuthProvider) and usage meters refresh in the
 * background; no extra refreshUser() call is needed.
 */
export function useVerifyCheckoutSession() {
  const qc = useQueryClient();
  return useMutation({
    // BillingPage handles failures itself (falls back to polling the status).
    meta: { silent: true },
    mutationFn: (sessionId: string) =>
      api.post<ApiResponse<SubscriptionStatus>>("/billing/checkout/verify", {
        sessionId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
      qc.invalidateQueries({ queryKey: queryKeys.me });
      void invalidateUsage(qc);
    },
  });
}

/** POST /billing/portal → Stripe customer portal URL. */
export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () => api.post<ApiResponse<BillingRedirect>>("/billing/portal"),
  });
}
