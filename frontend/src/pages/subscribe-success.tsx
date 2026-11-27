import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { useLoadingOverlay } from "@/components/rive-loader";
import { ApiError } from "@/lib/api";
import { billingApi } from "@/lib/queries";
import { PENDING_PLAN_KEY, hasActiveSubscription } from "@/lib/subscription";
import type { PlanId } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

export function SubscribeSuccessPage() {
  const navigate = useNavigate();
  const { session_id: sessionId } = useSearch({ from: "/subscribe/success" });
  const [error, setError] = useState<string | null>(null);
  useLoadingOverlay(!error);

  useEffect(() => {
    let cancelled = false;
    async function complete() {
      const stored = sessionStorage.getItem(PENDING_PLAN_KEY);
      const plan = stored === "max" || stored === "pro" ? (stored as PlanId) : undefined;
      try {
        if (sessionId) {
          const profile = await billingApi.confirm(sessionId, plan);
          useAuthStore.getState().setProfile(profile);
          sessionStorage.removeItem(PENDING_PLAN_KEY);
          if (!cancelled && hasActiveSubscription(profile)) {
            navigate({ to: "/home" });
            return;
          }
        }
        const profile = await useAuthStore.getState().hydrate(true);
        if (!cancelled && hasActiveSubscription(profile)) {
          sessionStorage.removeItem(PENDING_PLAN_KEY);
          navigate({ to: "/home" });
          return;
        }
        if (!cancelled) setError("Your payment went through, but the subscription is not active yet. Refresh in a moment.");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Unable to confirm your subscription");
        }
      }
    }
    void complete();
    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId]);

  return (
    <AuthShell title="Activating">
      {error ? (
        <div className="space-y-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <Link to="/subscribe" className="text-white hover:underline">
            Back to plans
          </Link>
        </div>
      ) : (
        <p className="text-center text-white/60">Confirming your subscription…</p>
      )}
    </AuthShell>
  );
}
