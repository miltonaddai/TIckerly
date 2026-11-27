import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoadingOverlay } from "@/components/rive-loader";
import type { PlanId } from "@/lib/types";
import { cn } from "@/lib/utils";

export const PLANS: {
  id: PlanId;
  name: string;
  price: string;
  accent: string;
  features: string[];
  cta: string;
  featured?: boolean;
}[] = [
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    accent: "text-pro",
    features: [
      "Real-time price alerts",
      "25 tracked tickers",
      "Daily market digest",
      "Email + push notifications",
    ],
    cta: "Choose Pro",
  },
  {
    id: "max",
    name: "Max",
    price: "$49",
    accent: "text-max",
    features: [
      "Everything in Pro",
      "Unlimited tracked tickers",
      "Options & futures data",
      "Priority AI insights",
    ],
    cta: "Choose Max",
    featured: true,
  },
];

export function PlanSelect({
  title = "Select Your Plan",
  subtitle = "Fourteen days free. Card only if required after the trial.",
  pending = false,
  error,
  onChoose,
}: {
  title?: string;
  subtitle?: string;
  pending?: boolean;
  error?: string | null;
  onChoose: (plan: PlanId) => void;
}) {
  useLoadingOverlay(pending);
  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col px-6 pb-16 pt-8 text-center">
      <h1 className="font-serif text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-white/45">{subtitle}</p>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <div className="mt-10 grid min-h-0 flex-1 gap-px overflow-hidden rounded-[32px] bg-white/10 md:grid-cols-2">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={cn(
              "flex flex-col justify-center bg-[#070712]/80 p-8 text-left sm:p-12",
              plan.featured && "bg-gradient-to-br from-cyan-500/10 via-[#070712]/80 to-violet-500/10",
            )}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className={cn("font-serif text-4xl", plan.accent)}>{plan.name}</span>
              {plan.featured ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                  Most chosen
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-light tracking-tight sm:text-6xl">{plan.price}</span>
              <span className="mb-1.5 text-sm text-white/40">/ month</span>
            </div>
            <ul className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/75">
                  <Check className="size-4 shrink-0 text-white/50" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="neu-outset mt-10 h-12 w-full rounded-full"
              variant={plan.featured ? "default" : "glass"}
              disabled={pending}
              onClick={() => onChoose(plan.id)}
            >
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
