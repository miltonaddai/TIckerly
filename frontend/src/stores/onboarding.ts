import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ASSET_OPTIONS, normalizeAssetClasses } from "@/lib/assets";
import type { AssetClass, ExperienceLevel, Profile } from "@/lib/types";

export type OnboardingDraft = {
  firstName: string;
  assetClass: AssetClass[];
  experience: ExperienceLevel;
};

type OnboardingState = OnboardingDraft & {
  setFirstName: (firstName: string) => void;
  setAssetClass: (assetClass: AssetClass[]) => void;
  toggleAsset: (id: AssetClass) => void;
  setExperience: (experience: ExperienceLevel) => void;
  draft: (profile?: Profile | null) => OnboardingDraft;
  reset: () => void;
};

const INITIAL: OnboardingDraft = {
  firstName: "",
  assetClass: ["stocks"],
  experience: "just_starting",
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      setFirstName: (firstName) => set({ firstName }),
      setAssetClass: (assetClass) => set({ assetClass: normalizeAssetClasses(assetClass) }),
      toggleAsset: (id) =>
        set((state) => {
          if (state.assetClass.includes(id)) {
            const next = state.assetClass.filter((item) => item !== id);
            return { assetClass: next.length ? next : state.assetClass };
          }
          return {
            assetClass: ASSET_OPTIONS.map((item) => item.id).filter(
              (item) => item === id || state.assetClass.includes(item),
            ),
          };
        }),
      setExperience: (experience) => set({ experience }),
      draft: (profile) => {
        const state = get();
        return {
          firstName: state.firstName.trim() || profile?.firstName || "",
          assetClass: normalizeAssetClasses(state.assetClass.length ? state.assetClass : profile?.assetClass),
          experience: state.experience || profile?.experience || "just_starting",
        };
      },
      reset: () => set(INITIAL),
    }),
    {
      name: "tickerly_onboarding_draft",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        firstName: state.firstName,
        assetClass: state.assetClass,
        experience: state.experience,
      }),
    },
  ),
);
