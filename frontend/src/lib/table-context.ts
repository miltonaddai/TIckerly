import { applyScreen } from "@/lib/screener";
import { queryClient } from "@/lib/query-client";
import type { LiveAlert, Quote } from "@/lib/types";
import { useScreenerStore } from "@/stores/screener";

export function currentTableContext(pathname: string) {
  const quotes = queryClient.getQueryData<{ quotes: Quote[] }>(["quotes"])?.quotes ?? [];
  const watchlist = queryClient.getQueryData<Quote[]>(["watchlist"]) ?? [];
  const alerts = queryClient.getQueryData<LiveAlert[]>(["alerts"]) ?? [];

  if (pathname.startsWith("/screener")) {
    const filters = useScreenerStore.getState().filters;
    return {
      page: "screener" as const,
      symbols: applyScreen(quotes, filters)
        .slice(0, 40)
        .map((row) => row.symbol),
    };
  }
  if (pathname.startsWith("/home")) {
    const movers = [...quotes]
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, 12);
    return {
      page: "home" as const,
      symbols: [...new Set([...movers, ...watchlist].map((row) => row.symbol))],
    };
  }
  if (pathname.startsWith("/alerts")) {
    return { page: "alerts" as const, symbols: [...new Set(alerts.map((row) => row.symbol))] };
  }
  if (pathname.startsWith("/profile")) {
    return { page: "profile" as const, symbols: watchlist.map((row) => row.symbol) };
  }
  return { page: "other" as const, symbols: [] as string[] };
}
