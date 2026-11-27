import { AuthError, getProfile, updateProfile } from "./auth";
import { env } from "../env";
import { isAllowedOrigin } from "../middleware/security";
import type { PlanId, Profile, Session } from "../types";

export function hasActiveSubscription(profile: Profile | null | undefined) {
  if (!profile) return false;
  return profile.subscriptionStatus === "active" || profile.subscriptionStatus === "trialing";
}

function returnOrigin(origin?: string) {
  const candidate = origin?.replace(/\/$/, "");
  if (candidate && isAllowedOrigin(candidate)) return candidate;
  return env.appOrigin;
}

/** Plans are activated locally; the success page confirms with `session_id=local`. */
export async function createCheckoutSession(_session: Session, _plan: PlanId, origin?: string) {
  return { url: `${returnOrigin(origin)}/subscribe/success?session_id=local` };
}

export async function createPortalSession(_session: Session) {
  return { url: `${env.appOrigin}/subscribe` };
}

export async function confirmCheckout(session: Session, _checkoutSessionId: string, plan?: PlanId) {
  await updateProfile(session, {
    plan: plan ?? "pro",
    subscriptionStatus: "active",
    onboardingComplete: true,
  });
  const profile = await getProfile(session);
  if (!profile) throw new AuthError("Profile missing");
  return profile;
}
