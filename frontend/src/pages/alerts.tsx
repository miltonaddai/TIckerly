import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Newspaper, Plus } from "lucide-react";
import { ChangeText, LiveBadge } from "@/components/market";
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
import { Badge } from "@/components/ui/badge";
import { useLoadingOverlay } from "@/components/rive-loader";
import { alertsApi } from "@/lib/queries";
import { formatPrice, formatRelativeTime } from "@/lib/utils";

const CARD =
  "neu-outset border border-white/6 bg-[rgba(22,22,32,0.72)]";

export function AlertsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("NVDU");
  const [type, setType] = useState("PRICE_TARGET");
  const [target, setTarget] = useState("175");

  const query = useQuery({ queryKey: ["alerts"], queryFn: alertsApi.list, refetchInterval: 15_000 });
  const create = useMutation({
    mutationFn: alertsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setOpen(false);
    },
  });

  const alerts = query.data ?? [];
  useLoadingOverlay(query.isLoading || create.isPending);

  return (
    <section className="grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-6 overflow-hidden px-6 pb-2 pt-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:px-16 xl:px-20">
      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium">Live Alerts</h1>
            <LiveBadge />
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-white/40 sm:block">Streaming · {alerts.length} today</p>
            <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Set Alert
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent p-2">
          {query.isLoading ? (
            <div className="min-h-40" />
          ) : alerts.length ? (
            <div className="flex flex-col gap-5">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${CARD} rounded-2xl px-5 py-4`}
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{alert.symbol}</span>
                        {alert.types.map((tag) => (
                          <Badge key={tag}>{tag.replaceAll("_", " ")}</Badge>
                        ))}
                        {alert.isNew ? (
                          <Badge className="border-white/20 bg-white/15 text-white">NEW</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-white/55">{alert.description}</p>
                    </div>
                    <div className="flex w-[5.5rem] shrink-0 flex-col items-end">
                      <span className="tabular-nums leading-none">
                        {formatPrice(alert.price, alert.price > 1000 ? 0 : 2)}
                      </span>
                      <ChangeText value={alert.changePct} className="mt-1.5 text-sm leading-none" />
                    </div>
                    <div className="w-16 shrink-0 text-right text-xs text-white/35">
                      {formatRelativeTime(alert.createdAt)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-white/45">No alerts yet. Set one for a ticker in the universe.</p>
          )}
        </div>
      </div>

      <div className="section-divider lg:hidden" aria-hidden />
      <div className="section-divider-y hidden self-stretch lg:block" aria-hidden />

      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-medium">Live News</h2>
            <LiveBadge />
          </div>
          <p className="text-xs text-white/40">Generated quotes</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Newspaper className="size-10 text-white/25" strokeWidth={1.5} />
          <p className="text-sm text-white/45">No live headlines yet</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Set Alert</DialogTitle>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate({ symbol, type, target: Number(target) });
            }}
          >
            <div className="space-y-1">
              <Label className="font-sans text-sm">Ticker</Label>
              <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
              <Label className="font-sans text-sm">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRICE_TARGET">Price target</SelectItem>
                  <SelectItem value="VOLUME_SURGE">Volume surge</SelectItem>
                  <SelectItem value="VOLATILITY">Volatility</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "PRICE_TARGET" ? (
              <div className="space-y-1">
                <Label className="font-sans text-sm">Target</Label>
                <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={create.isPending}>
              Create alert
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
