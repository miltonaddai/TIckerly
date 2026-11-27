import type { Quote, ScreenerField, ScreenerFilter } from "@/lib/types";
import { formatCompact } from "@/lib/utils";

export const FILTER_FIELDS: { id: ScreenerField; label: string; hint: string }[] = [
  { id: "marketCap", label: "Market cap", hint: "USD" },
  { id: "pe", label: "P/E", hint: "ratio" },
  { id: "eps", label: "EPS", hint: "USD" },
  { id: "price", label: "Price", hint: "USD" },
  { id: "changePct", label: "Change %", hint: "today" },
  { id: "volume", label: "Volume", hint: "shares" },
  { id: "avgVolume", label: "Avg volume", hint: "shares" },
  { id: "volRatio", label: "Volume vs avg", hint: "x" },
  { id: "vsSma50", label: "vs 50-day MA", hint: "%" },
  { id: "vsSma200", label: "vs 200-day MA", hint: "%" },
];

export const OPS = [
  { id: "gt" as const, label: ">" },
  { id: "gte" as const, label: "≥" },
  { id: "lt" as const, label: "<" },
  { id: "lte" as const, label: "≤" },
];

export function formatFilterValue(field: ScreenerField, value: number) {
  if (field === "marketCap" || field === "volume" || field === "avgVolume") return formatCompact(value);
  if (field === "changePct" || field === "vsSma50" || field === "vsSma200") return `${value}%`;
  if (field === "volRatio") return `${value}x`;
  return String(value);
}

export function filterLabel(filter: Pick<ScreenerFilter, "field" | "op" | "value">) {
  const field = FILTER_FIELDS.find((item) => item.id === filter.field)?.label ?? filter.field;
  const op = OPS.find((item) => item.id === filter.op)?.label ?? filter.op;
  return `${field} ${op} ${formatFilterValue(filter.field, filter.value)}`;
}

export function matchesFilter(quote: Quote, filter: ScreenerFilter) {
  const actual = quote[filter.field];
  if (typeof actual !== "number" || Number.isNaN(actual)) return false;
  switch (filter.op) {
    case "gt":
      return actual > filter.value;
    case "gte":
      return actual >= filter.value;
    case "lt":
      return actual < filter.value;
    case "lte":
      return actual <= filter.value;
    default:
      return false;
  }
}

export function applyScreen(quotes: Quote[], filters: ScreenerFilter[]) {
  if (!filters.length) return quotes;
  return quotes.filter((quote) => filters.every((filter) => matchesFilter(quote, filter)));
}

export const SCREEN_PRESETS: { id: string; label: string; filters: Omit<ScreenerFilter, "id" | "label">[] }[] = [
  {
    id: "liquid",
    label: "Liquid names",
    filters: [
      { field: "price", op: "gt", value: 5 },
      { field: "volume", op: "gt", value: 1_000_000 },
    ],
  },
  {
    id: "large",
    label: "Large cap",
    filters: [
      { field: "marketCap", op: "gt", value: 50_000_000_000 },
      { field: "volume", op: "gt", value: 1_000_000 },
    ],
  },
  {
    id: "gainers",
    label: "Gainers",
    filters: [{ field: "changePct", op: "gt", value: 0 }],
  },
  {
    id: "value",
    label: "Value",
    filters: [
      { field: "pe", op: "gt", value: 0 },
      { field: "pe", op: "lt", value: 30 },
      { field: "marketCap", op: "gt", value: 5_000_000_000 },
    ],
  },
];

export function presetFilters(preset: (typeof SCREEN_PRESETS)[number]): ScreenerFilter[] {
  return preset.filters.map((filter, index) => ({
    ...filter,
    id: `${preset.id}-${index}`,
    label: filterLabel(filter),
  }));
}

export function isPresetActive(filters: ScreenerFilter[], preset: (typeof SCREEN_PRESETS)[number]) {
  if (filters.length !== preset.filters.length) return false;
  const key = (item: { field: string; op: string; value: number }) => `${item.field}:${item.op}:${item.value}`;
  const have = new Set(filters.map(key));
  return preset.filters.every((filter) => have.has(key(filter)));
}

export const DEFAULT_SCREEN_FILTERS: ScreenerFilter[] = presetFilters(SCREEN_PRESETS[0]);
