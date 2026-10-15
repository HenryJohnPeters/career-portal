import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, SubscriptionStatus } from "@careerportal/shared/types";
import { invalidateUsage, queryKeys, useVerifyCheckoutSession } from "@careerportal/web/data-access";
import { ACTIVATION_POLL_DELAYS_MS } from "./billing-status";

/**
 * "confirming": verifying / polling; "active": Premium confirmed;
 * "delayed": still not active after ~30s (the webhook may be late).
 */
export type ActivationPhase = "idle" | "confirming" | "active" | "delayed";

interface CheckoutActivationOptions {
  /** True when the page was opened from Checkout's success redirect. */
  enabled: boolean;
  /** Validated `session_id` from the redirect, if present. */
  sessionId: string | null;
  /** Re-reads GET /billing/status (which syncs from Stripe). */
  refetchStatus: () => Promise<SubscriptionStatus | undefined>;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * After Stripe Checkout: verify the session once, then poll the subscription
 * status with backoff until it is active. Driven by values captured on
 * mount, so cleaning the URL does not cancel it, and safe under StrictMode
 * (each run starts once). `retry` starts a new run.
 */
export function useCheckoutActivation({ enabled, sessionId, refetchStatus }: CheckoutActivationOptions) {
  const qc = useQueryClient();
  const { mutateAsync: verify } = useVerifyCheckoutSession();
  const [phase, setPhase] = useState<ActivationPhase>(enabled ? "confirming" : "idle");
  const [run, setRun] = useState(0);

  const verifyRef = useRef(verify);
  const refetchRef = useRef(refetchStatus);
  verifyRef.current = verify;
  refetchRef.current = refetchStatus;

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startedRunRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || startedRunRef.current === run) return;
    startedRunRef.current = run;
    const isCurrent = () => mountedRef.current && startedRunRef.current === run;

    const activate = async () => {
      setPhase("confirming");

      if (sessionId) {
        try {
          const res = await verifyRef.current(sessionId);
          if (!isCurrent()) return;
          if (res.data.isPremium) {
            // verify's onSuccess also refreshes the user and usage meters.
            qc.setQueryData<ApiResponse<SubscriptionStatus>>(queryKeys.subscriptionStatus, res);
            setPhase("active");
            return;
          }
        } catch {
          // Fall back to polling: the webhook can still activate the subscription.
        }
      }

      for (const delay of ACTIVATION_POLL_DELAYS_MS) {
        await sleep(delay);
        if (!isCurrent()) return;
        const status = await refetchRef.current().catch(() => undefined);
        if (!isCurrent()) return;
        if (status?.isPremium) {
          void qc.invalidateQueries({ queryKey: queryKeys.me });
          void invalidateUsage(qc);
          setPhase("active");
          return;
        }
      }
      setPhase("delayed");
    };

    void activate();
  }, [enabled, sessionId, run, qc]);

  const retry = useCallback(() => setRun((n) => n + 1), []);

  return { phase, retry };
}
