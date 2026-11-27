import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      profile: state.profile,
      isLoading: state.isLoading,
      login: state.login,
      register: state.register,
      logout: state.logout,
      updateProfile: state.updateProfile,
      updatePassword: state.updatePassword,
    })),
  );
}
