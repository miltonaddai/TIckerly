import { create } from "zustand";
import { DEMO_PROFILE, isDemoMode } from "@/lib/demo";
import { queryClient } from "@/lib/query-client";
import { authApi, profileApi, type RegisterResult } from "@/lib/queries";
import type { Profile } from "@/lib/types";
import { useOnboardingStore } from "@/stores/onboarding";

type AuthState = {
  profile: Profile | null;
  isLoading: boolean;
  hydrated: boolean;
  hydrate: (force?: boolean) => Promise<Profile | null>;
  setProfile: (profile: Profile | null) => void;
  login: (email: string, password: string) => Promise<Profile>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>;
  updatePassword: (password: string) => Promise<void>;
};

let inflight: Promise<Profile | null> | null = null;

function cacheProfile(profile: Profile | null) {
  queryClient.setQueryData(["me"], profile);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: isDemoMode ? DEMO_PROFILE : null,
  isLoading: !isDemoMode,
  hydrated: isDemoMode,

  setProfile: (profile) => {
    cacheProfile(profile);
    set({ profile, isLoading: false, hydrated: true });
  },

  hydrate: async (force = false) => {
    if (isDemoMode) {
      get().setProfile(DEMO_PROFILE);
      return DEMO_PROFILE;
    }
    if (get().hydrated && !force) return get().profile;
    if (inflight && !force) return inflight;

    inflight = (async () => {
      set({ isLoading: true });
      try {
        const profile = await authApi.me();
        get().setProfile(profile);
        return profile;
      } catch {
        get().setProfile(null);
        return null;
      }
    })();

    try {
      return await inflight;
    } finally {
      inflight = null;
    }
  },

  login: async (email, password) => {
    const profile = await authApi.login(email, password);
    get().setProfile(profile);
    return profile;
  },

  register: async (email, password) => {
    const result = await authApi.register(email, password);
    if (result.profile) get().setProfile(result.profile);
    return result;
  },

  logout: async () => {
    await authApi.logout();
    // Without a session the API serves the demo user, so reload that profile.
    await get().hydrate(true);
    queryClient.removeQueries({ queryKey: ["notifications"] });
    useOnboardingStore.getState().reset();
  },

  updateProfile: async (patch) => {
    const profile = await profileApi.update(patch);
    get().setProfile(profile);
    return profile;
  },

  updatePassword: async (password) => {
    await authApi.updatePassword(password);
  },
}));
