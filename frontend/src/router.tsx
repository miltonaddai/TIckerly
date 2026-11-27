import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ShaderBackground } from "@/components/shader-background";
import { GlassNav } from "@/components/glass-nav";
import { DemoNav } from "@/components/demo-nav";
import { AppFooter } from "@/components/app-footer";
import { AiChat } from "@/components/ai-chat";
import { useAuth } from "@/hooks/use-auth";
import { LoadingProvider, useLoadingOverlay } from "@/components/rive-loader";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import {
  OnboardingAssetPage,
  OnboardingExperiencePage,
  OnboardingNamePage,
} from "@/pages/onboarding";
import { HomePage } from "@/pages/home";
import { ScreenerPage } from "@/pages/screener";
import { AlertsPage } from "@/pages/alerts";
import { ProfilePage } from "@/pages/profile";

const APP_PREFIXES = ["/home", "/screener", "/alerts", "/profile"];

function Shell() {
  const { profile } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isApp = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const lockViewport = pathname.startsWith("/alerts") || pathname.startsWith("/home");

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-x-hidden",
        lockViewport ? "h-svh overflow-hidden" : "min-h-svh",
      )}
    >
      <ShaderBackground />
      <GlassNav variant={isApp ? "app" : "marketing"} profile={profile} />
      <main
        className={cn(
          "relative z-10 flex flex-1 flex-col",
          lockViewport && "min-h-0",
        )}
      >
        <Outlet />
      </main>
      {isApp ? <AppFooter /> : null}
      {isApp ? <AiChat /> : null}
      <DemoNav />
    </div>
  );
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <Shell />
      </LoadingProvider>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({
  component: Root,
  // No auth gate: load the current (or demo) profile for display only.
  beforeLoad: () => {
    void useAuthStore.getState().hydrate();
  },
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LandingPage });
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});
const onboardingNameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding/name",
  component: OnboardingNamePage,
});
const onboardingAssetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding/asset",
  component: OnboardingAssetPage,
});
const onboardingExperienceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding/experience",
  component: OnboardingExperiencePage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: HomePage,
});
const screenerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screener",
  component: ScreenerPage,
});
const alertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/alerts",
  component: AlertsPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  onboardingNameRoute,
  onboardingAssetRoute,
  onboardingExperienceRoute,
  homeRoute,
  screenerRoute,
  alertsRoute,
  profileRoute,
]);

function RoutePending() {
  useLoadingOverlay(true);
  return null;
}

export const router = createRouter({
  routeTree,
  defaultPendingComponent: RoutePending,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
