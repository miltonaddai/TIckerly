import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { marketApi } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function WatchlistRowAction({
  symbol,
  mode,
}: {
  symbol: string;
  mode: "add" | "remove";
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      mode === "add" ? marketApi.addWatchlist(symbol) : marketApi.removeWatchlist(symbol),
    onSuccess: (data) => queryClient.setQueryData(["watchlist"], data),
  });

  const Icon = mode === "add" ? Plus : Minus;
  return (
    <button
      type="button"
      aria-label={mode === "add" ? `Add ${symbol} to watchlist` : `Remove ${symbol} from watchlist`}
      disabled={mutation.isPending}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white",
        "opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/20",
        "focus-visible:opacity-100 focus-visible:outline-none",
      )}
      onClick={(event) => {
        event.stopPropagation();
        mutation.mutate();
      }}
    >
      <Icon className="size-3" />
    </button>
  );
}
