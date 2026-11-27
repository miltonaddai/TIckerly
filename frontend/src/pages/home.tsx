import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChangeText, GlassPanel } from "@/components/market";
import { useLoadingOverlay } from "@/components/rive-loader";
import { WatchlistRowAction } from "@/components/watchlist-row-action";
import { marketApi } from "@/lib/queries";
import { formatCompact, formatPrice } from "@/lib/utils";

const MOVER_COLS = "grid-cols-[0.7fr_1.5fr_0.8fr_0.75fr_0.9fr_0.55fr_0.8fr_0.95fr]";
const ROW_HOVER =
  "group relative rounded-xl transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:-translate-y-px hover:bg-zinc-800/45 hover:shadow-[0_6px_16px_rgba(0,0,0,0.28)]";

function formatRatio(value?: number) {
  if (value == null || value === 0) return "—";
  return value.toFixed(1);
}

export function HomePage() {
  const snapshot = useQuery({
    queryKey: ["quotes"],
    queryFn: marketApi.quotes,
    staleTime: 60_000,
  });
  const watchlist = useQuery({
    queryKey: ["watchlist"],
    queryFn: marketApi.watchlist,
    staleTime: 60_000,
  });

  const rows = [...(snapshot.data?.quotes ?? [])]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 12);
  const saved = watchlist.data ?? [];
  const savedSymbols = new Set(saved.map((item) => item.symbol));
  useLoadingOverlay(snapshot.isLoading || watchlist.isLoading);

  return (
    <section className="grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8 overflow-hidden px-6 pb-16 pt-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)] lg:px-16 xl:grid-cols-[minmax(0,1fr)_24rem] xl:px-20">
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <h1 className="mb-5 shrink-0 text-2xl font-medium">Top Movers Today</h1>
        <GlassPanel className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-5">
          {snapshot.isError ? (
            <p className="p-6 text-sm text-red-300">Could not load market data.</p>
          ) : !rows.length ? (
            <div className={snapshot.isLoading ? "min-h-64" : undefined}>
              {snapshot.isLoading ? null : (
                <p className="p-6 text-sm text-white/45">No movers yet. Quotes refresh every 30 minutes.</p>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <div className="min-w-[960px]">
                <div className={`sticky top-0 z-20 grid ${MOVER_COLS} bg-[rgba(14,14,22,0.92)] px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/35 backdrop-blur-md`}>
                  <span>Symbol</span>
                  <span>Name</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Change</span>
                  <span className="text-right">Mkt Cap</span>
                  <span className="text-right">P/E</span>
                  <span className="text-right">Volume</span>
                  <span className="text-right">Setup</span>
                </div>
                <div className="divide-y divide-white/8 py-1">
                  {rows.map((row, index) => (
                    <motion.div
                      key={row.symbol}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`grid ${MOVER_COLS} items-center px-3 py-3.5 text-sm ${ROW_HOVER}`}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <span className="font-semibold">{row.symbol}</span>
                        {savedSymbols.has(row.symbol) ? (
                          <span className="size-5 shrink-0" />
                        ) : (
                          <WatchlistRowAction symbol={row.symbol} mode="add" />
                        )}
                      </span>
                      <span className="truncate text-white/45">{row.name}</span>
                      <span className="text-right tabular-nums">{formatPrice(row.price)}</span>
                      <span className="text-right">
                        <ChangeText value={row.changePct} />
                      </span>
                      <span className="text-right tabular-nums">
                        {row.marketCap != null ? formatCompact(row.marketCap) : "—"}
                      </span>
                      <span className="text-right tabular-nums">{formatRatio(row.pe)}</span>
                      <span className="text-right tabular-nums text-white/80">{formatCompact(row.volume)}</span>
                      <span className="text-right text-white/70">{row.signal ?? "—"}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <h2 className="mb-5 shrink-0 text-2xl font-medium">Watchlist</h2>
        <GlassPanel className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
          <div className="min-h-0 flex-1 divide-y divide-white/8 overflow-y-auto overscroll-contain py-1">
            {watchlist.isLoading ? (
              <div className="min-h-40" />
            ) : !saved.length ? (
              <p className="p-4 text-sm text-white/45">Hover a mover and click + to add it here.</p>
            ) : (
              saved.map((item) => (
                <div key={item.symbol} className={`flex items-center justify-between px-3 py-3 ${ROW_HOVER}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-semibold">{item.symbol}</div>
                      <WatchlistRowAction symbol={item.symbol} mode="remove" />
                    </div>
                    <div className="text-xs text-white/40">{item.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums">{formatPrice(item.price)}</div>
                    <ChangeText value={item.changePct} className="text-xs" />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
