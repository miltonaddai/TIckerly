import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { ChangeText, GlassPanel } from "@/components/market";
import { useLoadingOverlay } from "@/components/rive-loader";
import { WatchlistRowAction } from "@/components/watchlist-row-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marketApi } from "@/lib/queries";
import {
  FILTER_FIELDS,
  OPS,
  SCREEN_PRESETS,
  applyScreen,
  isPresetActive,
  presetFilters,
} from "@/lib/screener";
import type { Quote, ScreenerField, ScreenerFilter } from "@/lib/types";
import { formatCompact, formatPrice, formatRelativeTime, cn } from "@/lib/utils";
import { useScreenerStore } from "@/stores/screener";

function inputScale(field: ScreenerField) {
  if (field === "marketCap") return { divisor: 1_000_000_000, suffix: "B" };
  if (field === "volume" || field === "avgVolume") return { divisor: 1_000_000, suffix: "M" };
  return { divisor: 1, suffix: "" };
}

function quoteValue(quote: Quote, field: ScreenerField) {
  const value = quote[field];
  if (typeof value !== "number") return "—";
  if (field === "marketCap" || field === "volume" || field === "avgVolume") return formatCompact(value);
  if (field === "changePct" || field === "vsSma50" || field === "vsSma200") return `${value.toFixed(1)}%`;
  if (field === "volRatio") return `${value.toFixed(2)}x`;
  return value.toFixed(2);
}

export function ScreenerPage() {
  const filters = useScreenerStore((state) => state.filters);
  const view = useScreenerStore((state) => state.view);
  const sort = useScreenerStore((state) => state.sort);
  const setView = useScreenerStore((state) => state.setView);
  const applyFilters = useScreenerStore((state) => state.applyFilters);
  const toggleSort = useScreenerStore((state) => state.toggleSort);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ScreenerFilter[]>(filters);
  const [queryText, setQueryText] = useState("");

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
  const savedSymbols = new Set((watchlist.data ?? []).map((item) => item.symbol));

  const universe = snapshot.data?.quotes ?? [];
  useLoadingOverlay(snapshot.isLoading);
  const matches = useMemo(() => {
    const screened = applyScreen(universe, filters);
    const needle = queryText.trim().toUpperCase();
    const searched = needle
      ? screened.filter((row) => row.symbol.includes(needle) || row.name.toUpperCase().includes(needle))
      : screened;
    return [...searched].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.field === "symbol" || sort.field === "name") {
        return a[sort.field].localeCompare(b[sort.field]) * dir;
      }
      return ((a[sort.field] ?? -Infinity) - (b[sort.field] ?? -Infinity)) * dir;
    });
  }, [universe, filters, queryText, sort]);

  const columns = view === "technicals"
    ? ([
        ["symbol", "Symbol"],
        ["name", "Name"],
        ["price", "Price"],
        ["changePct", "Change"],
        ["vsSma50", "vs 50DMA"],
        ["vsSma200", "vs 200DMA"],
        ["volRatio", "Vol / avg"],
        ["signal", "Setup"],
      ] as const)
    : ([
        ["symbol", "Symbol"],
        ["name", "Name"],
        ["price", "Price"],
        ["changePct", "Change"],
        ["marketCap", "Mkt cap"],
        ["pe", "P/E"],
        ["eps", "EPS"],
        ["volume", "Volume"],
        ["signal", "Setup"],
      ] as const);

  function applyDraft(next: ScreenerFilter[]) {
    applyFilters(next);
    setOpen(false);
  }

  return (
    <section className="w-full px-6 pb-8 pt-12 sm:px-10 lg:px-16 xl:px-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Screener</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SCREEN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  isPresetActive(filters, preset)
                    ? "border-white/35 bg-white/15 text-white"
                    : "border-white/12 bg-white/5 text-white/70 hover:text-white",
                )}
                onClick={() => applyDraft(presetFilters(preset))}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              className="text-xs text-white/55 hover:text-white"
              onClick={() => {
                setDraft(filters);
                setOpen(true);
              }}
            >
              Customize
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <span
                key={filter.id}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                {filter.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/40">
            {snapshot.isLoading
              ? "Fetching quotes…"
              : `${matches.length} of ${universe.length} names match · cached ${
                  snapshot.data?.fetchedAt ? formatRelativeTime(new Date(snapshot.data.fetchedAt).toISOString()) : "—"
                }, refresh every 30 min`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search ticker or name"
            className="h-10 w-48 rounded-full px-4 text-sm"
          />
          <div className="flex gap-2">
            {(["fundamentals", "technicals"] as const).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={view === item ? "default" : "outline"}
                className="rounded-full capitalize"
                onClick={() => setView(item)}
              >
                <SlidersHorizontal className="size-3.5" />
                {item}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <GlassPanel className="overflow-x-auto p-3 sm:p-5">
        {snapshot.isError ? (
          <p className="p-6 text-sm text-red-300">Could not load quotes from Financial Modeling Prep.</p>
        ) : snapshot.isLoading ? (
          <div className="min-h-64" />
        ) : !universe.length ? (
          <p className="p-6 text-sm text-white/45">No quotes yet. Wait for the next refresh.</p>
        ) : !matches.length ? (
          <p className="p-6 text-sm text-white/45">No names match this screen. Loosen a filter or pick a preset.</p>
        ) : (
          <div className="min-w-[960px]">
            <div
              className="grid px-2 pb-2 text-[11px] uppercase tracking-[0.16em] text-white/35"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              {columns.map(([field, label]) => (
                <button
                  key={field}
                  type="button"
                  className={field === "symbol" || field === "name" || field === "signal" ? "text-left" : "text-right"}
                  onClick={() => {
                    if (field !== "signal") toggleSort(field);
                  }}
                >
                  {label}
                  {sort.field === field ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}
                </button>
              ))}
            </div>
            <div className="divide-y divide-white/8">
              {matches.map((row, index) => (
                <motion.div
                  key={row.symbol}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03 }}
                  className="group grid items-center rounded-xl px-2 py-3.5 text-sm transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:-translate-y-px hover:bg-zinc-800/45 hover:shadow-[0_6px_16px_rgba(0,0,0,0.28)]"
                  style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
                >
                  {columns.map(([field]) => (
                    <span
                      key={field}
                      className={
                        field === "symbol"
                          ? "font-semibold"
                          : field === "name"
                            ? "truncate text-white/45"
                            : field === "signal"
                              ? "text-right text-white/70"
                              : "text-right tabular-nums"
                      }
                    >
                      {field === "price" ? (
                        formatPrice(row.price)
                      ) : field === "changePct" ? (
                        <ChangeText value={row.changePct} />
                      ) : field === "symbol" ? (
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <span>{row.symbol}</span>
                          {savedSymbols.has(row.symbol) ? (
                            <span className="size-5 shrink-0" />
                          ) : (
                            <WatchlistRowAction symbol={row.symbol} mode="add" />
                          )}
                        </span>
                      ) : field === "name" ? (
                        row.name
                      ) : field === "signal" ? (
                        row.signal ?? "—"
                      ) : (
                        quoteValue(row, field)
                      )}
                    </span>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(92vw,640px)]">
          <DialogTitle>Customize screen</DialogTitle>
          <div className="mt-4 space-y-4">
            {draft.map((filter, index) => {
              const scale = inputScale(filter.field);
              return (
                <div key={filter.id} className="grid grid-cols-[1fr_5rem_1fr_auto] items-end gap-2">
                  <div className="space-y-1">
                    <Label className="font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">Field</Label>
                    <Select
                      value={filter.field}
                      onValueChange={(value) => {
                        const next = [...draft];
                        next[index] = { ...filter, field: value as ScreenerField };
                        setDraft(next);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_FIELDS.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">Op</Label>
                    <Select
                      value={filter.op}
                      onValueChange={(value) => {
                        const next = [...draft];
                        next[index] = { ...filter, op: value as ScreenerFilter["op"] };
                        setDraft(next);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPS.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">
                      Value{scale.suffix ? ` (${scale.suffix})` : ""}
                    </Label>
                    <Input
                      type="number"
                      className="h-11 rounded-xl"
                      value={filter.value / scale.divisor}
                      onChange={(e) => {
                        const next = [...draft];
                        next[index] = { ...filter, value: Number(e.target.value) * scale.divisor };
                        setDraft(next);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-0.5"
                    onClick={() => setDraft(draft.filter((item) => item.id !== filter.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() =>
                setDraft([
                  ...draft,
                  {
                    id: crypto.randomUUID(),
                    field: "changePct",
                    op: "gt",
                    value: 0,
                    label: "",
                  },
                ])
              }
            >
              <Plus className="size-4" /> Add condition
            </Button>
            <Button className="w-full" onClick={() => applyDraft(draft)}>
              Apply screen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
