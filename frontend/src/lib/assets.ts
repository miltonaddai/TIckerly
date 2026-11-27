import type { AssetClass } from "@/lib/types";

export const ASSET_OPTIONS: { id: AssetClass; label: string }[] = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "futures", label: "Futures" },
  { id: "options", label: "Options" },
];

const ALLOWED = new Set<AssetClass>(ASSET_OPTIONS.map((item) => item.id));

export function normalizeAssetClasses(value: unknown): AssetClass[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const selected = ASSET_OPTIONS.map((item) => item.id).filter((id) =>
    list.some((entry) => entry === id && ALLOWED.has(id)),
  );
  return selected.length ? selected : ["stocks"];
}

export function formatAssetClasses(value: AssetClass[] | undefined) {
  const selected = new Set(normalizeAssetClasses(value));
  return ASSET_OPTIONS.filter((item) => selected.has(item.id))
    .map((item) => item.label)
    .join(", ");
}
