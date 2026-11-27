import type { Profile } from "@/lib/types";

export const PENDING_PLAN_KEY = "tickerly_pending_plan";

export function hasActiveSubscription(profile: Profile | null | undefined) {
  if (!profile) return false;
  return profile.subscriptionStatus === "active" || profile.subscriptionStatus === "trialing";
}
