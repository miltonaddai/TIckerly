import { Link, useRouterState } from "@tanstack/react-router";
import { ChartCandlestick, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import type { ReactNode } from "react";

const APP_LINKS = [
  { to: "/home", label: "Home" },
  { to: "/screener", label: "Screener" },
  { to: "/alerts", label: "Alerts" },
] as const;

type NavProps = {
  variant?: "marketing" | "app";
  profile?: Profile | null;
};

function NavLabel({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span className="relative py-1" data-active={active || undefined}>
      {children}
      <span className="nav-underline" />
    </span>
  );
}

export function GlassNav({ variant = "marketing", profile }: NavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="pointer-events-none sticky top-5 z-40 mt-5 flex justify-center px-6 sm:px-10 lg:px-16 xl:px-20">
      <nav className="glass-nav pointer-events-auto flex h-14 w-full items-center justify-between rounded-full px-6">
        <Link to="/" className="flex items-center gap-2 text-white">
          <ChartCandlestick className="size-5" strokeWidth={2} />
          <span className="font-logo text-[1.15rem] leading-none">Tickerly</span>
        </Link>

        {variant === "app" ? (
          <div className="hidden items-center gap-8 text-[15px] text-white/70 sm:flex">
            {APP_LINKS.map((link) => {
              const active = pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  data-active={active || undefined}
                  className="group relative"
                >
                  <NavLabel active={active}>
                    <span className={cn(active ? "text-white" : "group-hover:text-white")}>
                      {link.label}
                    </span>
                  </NavLabel>
                </Link>
              );
            })}
          </div>
        ) : pathname === "/" ? (
          <div className="hidden items-center gap-8 text-[15px] text-white/70 sm:flex">
            <a href="#how" className="group relative hover:text-white">
              <NavLabel>How it works</NavLabel>
            </a>
            <a href="#faq" className="group relative hover:text-white">
              <NavLabel>FAQ</NavLabel>
            </a>
          </div>
        ) : (
          <div />
        )}

        {variant === "app" ? (
          <Link to="/profile" className="shrink-0">
            <Avatar className="size-10">
              {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.firstName} /> : null}
              <AvatarFallback>
                {(profile?.firstName?.[0] ?? "T").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link
            to="/login"
            data-active={pathname === "/login" || undefined}
            className="group relative flex items-center gap-1.5 text-[15px] text-white/90 hover:text-white"
          >
            <LogIn className="size-4" />
            <NavLabel active={pathname === "/login"}>Login</NavLabel>
          </Link>
        )}
      </nav>
    </header>
  );
}
