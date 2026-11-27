import type { Quote, ScreenerFilter } from "../types";

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
  return quotes.filter((quote) => filters.every((filter) => matchesFilter(quote, filter)));
}

export function scoreMatch(quote: Quote, filters: ScreenerFilter[]) {
  if (filters.length === 0) return 0;
  const hits = filters.filter((filter) => matchesFilter(quote, filter)).length;
  return hits / filters.length;
}
