import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("glass rounded-[28px]", className)}>{children}</div>;
}

export function ChangeText({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const up = value >= 0;
  const sign = up ? "+" : "";
  return (
    <span className={cn(up ? "change-up" : "change-down", "tabular-nums", className)}>
      {sign}
      {value.toFixed(2)}%
    </span>
  );
}

export function ChangePill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex min-w-[72px] justify-center rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
        up ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300",
      )}
    >
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function Sparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-7 items-end gap-[3px]">
      {values.map((value, index) => (
        <span
          key={index}
          className={cn("w-[3px] rounded-full", positive ? "bg-emerald-400" : "bg-red-400")}
          style={{
            height: `${Math.max(18, (value / max) * 100)}%`,
            opacity: 0.35 + (index / values.length) * 0.65,
          }}
        />
      ))}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-300">
      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
      LIVE
    </span>
  );
}
