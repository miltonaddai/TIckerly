import type { Profile } from "@/lib/types";

function parseFlag(value: unknown) {
  if (value === true || value === 1) return true;
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase() === "true";
}

export const isDemoMode = parseFlag(import.meta.env.VITE_DEMO_MODE);

export const DEMO_PROFILE: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@tickerly.app",
  firstName: "Demo",
  avatarUrl: null,
  plan: "max",
  assetClass: ["stocks"],
  experience: "1_3_years",
  currency: "USD ($)",
  timezone: "Eastern Time (UTC-5)",
  twoFactorEnabled: true,
  linkedBrokers: 2,
  renewsAt: "Sep 20, 2026",
  cardLast4: "4417",
  onboardingComplete: true,
  subscriptionStatus: "active",
};
