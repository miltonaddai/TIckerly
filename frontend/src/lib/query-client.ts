import { QueryClient } from "@tanstack/react-query";
import { DEMO_PROFILE, isDemoMode } from "@/lib/demo";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 20_000 },
  },
});

if (isDemoMode) {
  queryClient.setQueryData(["me"], DEMO_PROFILE);
}
