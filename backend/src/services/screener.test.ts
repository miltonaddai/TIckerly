import { describe, expect, it } from "vitest";
import { applyScreen, matchesFilter, scoreMatch } from "./screener";
import type { Quote, ScreenerFilter } from "../types";

const ford: Quote = {
  symbol: "F",
  name: "Ford",
  price: 11.42,
  changePct: -1.24,
  volume: 52_300_000,
  marketCap: 45_600_000_000,
  pe: 12.1,
};

const nvda: Quote = {
  symbol: "NVDA",
  name: "NVIDIA",
  price: 178.42,
  changePct: 4.82,
  volume: 312_400_000,
  marketCap: 4_380_000_000_000,
  pe: 48.2,
};

const filters: ScreenerFilter[] = [
  { id: "mcap", field: "marketCap", op: "gt", value: 10_000_000_000, label: "" },
  { id: "pe", field: "pe", op: "lt", value: 25, label: "" },
  { id: "vol", field: "volume", op: "gt", value: 5_000_000, label: "" },
];

describe("screener engine", () => {
  it("accepts value names that clear every rule", () => {
    expect(matchesFilter(ford, filters[1])).toBe(true);
    expect(applyScreen([ford, nvda], filters).map((q) => q.symbol)).toEqual(["F"]);
  });

  it("rejects expensive growth names on P/E", () => {
    expect(matchesFilter(nvda, filters[1])).toBe(false);
  });

  it("scores partial matches between 0 and 1", () => {
    expect(scoreMatch(nvda, filters)).toBeCloseTo(2 / 3);
    expect(scoreMatch(ford, filters)).toBe(1);
  });
});
