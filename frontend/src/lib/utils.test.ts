import { describe, expect, it } from "vitest";
import { formatCompact, formatPercent, formatPrice, formatRelativeTime } from "@/lib/utils";

describe("formatters", () => {
  it("formats prices with two decimals", () => {
    expect(formatPrice(178.4)).toBe("178.40");
  });

  it("compacts large volumes", () => {
    expect(formatCompact(5_000_000)).toBe("5.0M");
    expect(formatCompact(10_000_000_000)).toBe("10.0B");
  });

  it("keeps a signed percent", () => {
    expect(formatPercent(4.82)).toBe("+4.82%");
    expect(formatPercent(-1.2)).toBe("-1.20%");
  });

  it("describes recent timestamps", () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("just now");
  });
});
