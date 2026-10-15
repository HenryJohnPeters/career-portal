import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResponse,
  DashboardSummary,
  DeleteAccountRequest,
  DeleteAccountResponse,
  DismissOnboardingResponse,
  UpdateProfileRequest,
  User,
} from "@careerportal/shared/types";
import { AI_TIMEOUT_MS, api } from "../api-client";
import { queryKeys } from "../query-keys";

/**
 * PATCH /account/profile. Updates the cached `me` query; AuthProvider keeps
 * its own copy, so call `refreshUser()` after success to update the header.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.patch<ApiResponse<User>>("/account/profile", data),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.me, res);
    },
  });
}

/** GET /account/export → the JSON export as a Blob plus a download filename. */
export function useExportAccount() {
  return useMutation({
    mutationFn: async (): Promise<{ blob: Blob; filename: string }> => {
      const { blob, filename } = await api.getBlobWithFilename(
        "/account/export",
        { timeoutMs: AI_TIMEOUT_MS },
      );
      const today = new Date().toISOString().slice(0, 10);
      return { blob, filename: filename ?? `career-portal-export-${today}.json` };
    },
  });
}

/**
 * DELETE /account { confirmEmail }. On success the caller must sign out
 * (supabase.auth.signOut) and clear the query cache before navigating away.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: DeleteAccountRequest) =>
      api.delete<ApiResponse<DeleteAccountResponse>>("/account", data, {
        timeoutMs: AI_TIMEOUT_MS,
      }),
  });
}

/** POST /account/onboarding/dismiss — hides the dashboard checklist. */
export function useDismissOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<ApiResponse<DismissOnboardingResponse>>(
        "/account/onboarding/dismiss",
      ),
    onSuccess: () => {
      qc.setQueryData<ApiResponse<DashboardSummary>>(
        queryKeys.dashboardSummary,
        (old) =>
          old && {
            ...old,
            data: {
              ...old.data,
              onboarding: { ...old.data.onboarding, dismissed: true },
            },
          },
      );
      qc.setQueryData<ApiResponse<User>>(
        queryKeys.me,
        (old) =>
          old && {
            ...old,
            data: { ...old.data, onboardingDismissedAt: new Date().toISOString() },
          },
      );
    },
  });
}
