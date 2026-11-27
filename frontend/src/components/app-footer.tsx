import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/home", label: "Home" },
  { to: "/screener", label: "Screener" },
  { to: "/alerts", label: "Alerts" },
  { to: "/profile", label: "Profile" },
] as const;

export function AppFooter() {
  return (
    <footer className="relative z-10 w-full shrink-0 px-6 pb-5 pt-1 sm:px-10 lg:px-16 xl:px-20">
      <div className="section-divider mb-4" />
      <div className="flex flex-col items-start justify-between gap-2 text-[11px] tracking-wide text-white/28 sm:flex-row sm:items-center">
        <span className="font-serif text-sm text-white/35">Tickerly</span>
        <p>© {new Date().getFullYear()} Tickerly · Screens are not investment advice</p>
        <nav className="flex gap-5">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="transition hover:text-white/55">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
