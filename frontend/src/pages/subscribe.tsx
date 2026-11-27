import { useState } from "react";
import { PlanSelect } from "@/components/plan-select";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { billingApi } from "@/lib/queries";
import { PENDING_PLAN_KEY } from "@/lib/subscription";
import type { PlanId } from "@/lib/types";
import { useOnboardingStore } from "@/stores/onboarding";

export function SubscribePage() {
  const { profile, updateProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function choose(plan: PlanId) {
    setPending(true);
    setError(null);
    const draft = useOnboardingStore.getState().draft(profile);
    try {
      await updateProfile({
        ...(draft.firstName ? { firstName: draft.firstName } : {}),
        assetClass: draft.assetClass,
        experience: draft.experience,
      });
      sessionStorage.setItem(PENDING_PLAN_KEY, plan);
      const { url } = await billingApi.checkout(plan);
      useOnboardingStore.getState().reset();
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to start checkout");
      setPending(false);
    }
  }

  return (
    <PlanSelect
      title="Subscribe to Tickerly"
      subtitle="Fourteen days free on Pro or Max. App access starts after checkout."
      pending={pending}
      error={error}
      onChoose={(plan) => void choose(plan)}
    />
  );
}
