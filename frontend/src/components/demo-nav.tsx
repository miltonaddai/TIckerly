import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, X } from "lucide-react";
import { isDemoMode } from "@/lib/demo";
import { cn } from "@/lib/utils";

const PAGES = [
  {
    group: "Marketing",
    items: [{ to: "/", label: "Landing" }],
  },
  {
    group: "Auth",
    items: [
      { to: "/login", label: "Login" },
      { to: "/register", label: "Create account" },
    ],
  },
  {
    group: "Onboarding",
    items: [
      { to: "/onboarding/name", label: "First name" },
      { to: "/onboarding/asset", label: "Asset class" },
      { to: "/onboarding/experience", label: "Experience" },
    ],
  },
  {
    group: "App",
    items: [
      { to: "/home", label: "Home" },
      { to: "/screener", label: "Screener" },
      { to: "/alerts", label: "Alerts" },
      { to: "/profile", label: "Profile" },
    ],
  },
] as const;

export function DemoNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isDemoMode) return null;

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto glass w-64 rounded-3xl p-3"
          >
            <div className="mb-2 flex items-center justify-between px-2 pt-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/80">Demo pages</p>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-300">
                ON
              </span>
            </div>
            <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto px-1 pb-1">
              {PAGES.map((section) => (
                <div key={section.group}>
                  <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.16em] text-white/35">
                    {section.group}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          preload={false}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "block rounded-xl px-2 py-1.5 text-sm transition",
                            active
                              ? "bg-white/12 text-white"
                              : "text-white/65 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        aria-label={open ? "Close demo navigation" : "Open demo navigation"}
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto grid size-12 place-items-center rounded-full bg-white text-[#0a0518] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-105"
      >
        {open ? <X className="size-5" /> : <Compass className="size-5" />}
      </button>
    </div>
  );
}
