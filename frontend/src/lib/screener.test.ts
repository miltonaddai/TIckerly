import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCREEN_FILTERS,
  SCREEN_PRESETS,
  applyScreen,
  filterLabel,
  formatFilterValue,
  isPresetActive,
  matchesFilter,
  presetFilters,
} from "@/lib/screener";
import type { Quote, ScreenerFilter } from "@/lib/types";

const pear: Quote = { symbol: "PEAR", name: "Pear Computing", price: 228, changePct: 1.6, volume: 40_000_000, marketCap: 3e12, pe: 31 };
const penny: Quote = { symbol: "TINY", name: "Tiny Co.", price: 2, changePct: -4, volume: 200_000 };

function filter(partial: Partial<ScreenerFilter>): ScreenerFilter {
  return { id: "f", field: "price", op: "gt", value: 0, label: "", ...partial };
}

describe("formatFilterValue", () => {
  it("formats each kind of field", () => {
    expect(formatFilterValue("marketCap", 50_000_000_000)).toBe("50.0B");
    expect(formatFilterValue("volume", 1_000_000)).toBe("1.0M");
    expect(formatFilterValue("changePct", 3)).toBe("3%");
    expect(formatFilterValue("vsSma200", -5)).toBe("-5%");
    expect(formatFilterValue("volRatio", 2)).toBe("2x");
    expect(formatFilterValue("pe", 15)).toBe("15");
  });
});

describe("filterLabel", () => {
  it("builds a readable label", () => {
    expect(filterLabel({ field: "pe", op: "lt", value: 30 })).toBe("P/E < 30");
    expect(filterLabel({ field: "marketCap", op: "gte", value: 5_000_000_000 })).toBe("Market cap ≥ 5.0B");
  });
});

describe("matchesFilter / applyScreen", () => {
  it("handles every operator, including the boundaries", () => {
    expect(matchesFilter(pear, filter({ op: "gt", value: 228 }))).toBe(false);
    expect(matchesFilter(pear, filter({ op: "gte", value: 228 }))).toBe(true);
    expect(matchesFilter(pear, filter({ op: "lt", value: 228 }))).toBe(false);
    expect(matchesFilter(pear, filter({ op: "lte", value: 228 }))).toBe(true);
  });

  it("never matches a missing field", () => {
    expect(matchesFilter(penny, filter({ field: "pe", op: "lt", value: 100 }))).toBe(false);
  });

  it("returns everything with no filters and narrows with filters", () => {
    expect(applyScreen([pear, penny], [])).toEqual([pear, penny]);
    expect(applyScreen([pear, penny], [filter({ value: 5 })])).toEqual([pear]);
  });
});

describe("presets", () => {
  it("gives each preset filter a stable id and label", () => {
    const value = SCREEN_PRESETS.find((preset) => preset.id === "value")!;
    const filters = presetFilters(value);
    expect(filters.map((item) => item.id)).toEqual(["value-0", "value-1", "value-2"]);
    expect(filters[1].label).toBe("P/E < 30");
  });

  it("detects the active preset regardless of filter order", () => {
    const large = SCREEN_PRESETS.find((preset) => preset.id === "large")!;
    const reversed = [...presetFilters(large)].reverse();
    expect(isPresetActive(reversed, large)).toBe(true);
    expect(isPresetActive(reversed.slice(1), large)).toBe(false);
    expect(isPresetActive(presetFilters(SCREEN_PRESETS[0]), large)).toBe(false);
  });

  it("defaults to the liquid-names preset", () => {
    expect(isPresetActive(DEFAULT_SCREEN_FILTERS, SCREEN_PRESETS[0])).toBe(true);
    expect(SCREEN_PRESETS[0].id).toBe("liquid");
  });
});
