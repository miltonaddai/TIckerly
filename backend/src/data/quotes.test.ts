import { describe, expect, it } from "vitest";
import { generateQuoteRows } from "./quotes";
import { COMPANIES, UNIVERSE_SYMBOLS } from "./universe";

const FIVE_MINUTES = 5 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 15, 15, 0, 0);

describe("sample universe", () => {
  it("has unique, well-formed tickers and names", () => {
    expect(COMPANIES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(UNIVERSE_SYMBOLS).size).toBe(UNIVERSE_SYMBOLS.length);
    expect(new Set(COMPANIES.map((company) => company.name)).size).toBe(COMPANIES.length);
    for (const symbol of UNIVERSE_SYMBOLS) expect(symbol).toMatch(/^[A-Z]{1,5}$/);
  });
});

describe("generateQuoteRows", () => {
  it("returns one row per universe symbol", () => {
    const rows = generateQuoteRows(NOW);
    expect(rows).toHaveLength(UNIVERSE_SYMBOLS.length);
    expect(rows.map((row) => row.symbol)).toEqual([...UNIVERSE_SYMBOLS]);
  });

  it("is deterministic for the same moment", () => {
    expect(generateQuoteRows(NOW)).toEqual(generateQuoteRows(NOW));
  });

  it("holds steady within a five-minute window and drifts across windows", () => {
    const windowStart = Math.floor(NOW / FIVE_MINUTES) * FIVE_MINUTES;
    expect(generateQuoteRows(windowStart)).toEqual(generateQuoteRows(windowStart + FIVE_MINUTES - 1));
    const next = generateQuoteRows(windowStart + FIVE_MINUTES);
    const changed = next.filter((row, index) => row.price !== generateQuoteRows(windowStart)[index].price);
    expect(changed.length).toBeGreaterThan(0);
  });

  it("produces internally consistent values", () => {
    for (const row of generateQuoteRows(NOW)) {
      const price = row.price as number;
      expect(price).toBeGreaterThan(0);
      expect(Math.abs(row.changePercentage as number)).toBeLessThanOrEqual(4.5);
      expect(row.dayLow as number).toBeLessThanOrEqual(price);
      expect(row.dayHigh as number).toBeGreaterThanOrEqual(price);
      expect(row.yearLow as number).toBeLessThan(row.yearHigh as number);
      expect(row.volume as number).toBeGreaterThan(0);
      expect(row.marketCap as number).toBeGreaterThan(0);
      expect(typeof row.name).toBe("string");
    }
  });

  it("leaves P/E and EPS undefined for index funds", () => {
    const funds = generateQuoteRows(NOW).filter((row) => ["SPYY", "QQQQ", "DIAA", "IWMM"].includes(row.symbol as string));
    expect(funds).toHaveLength(4);
    for (const fund of funds) {
      expect(fund.pe).toBeUndefined();
      expect(fund.eps).toBeUndefined();
    }
    const stock = generateQuoteRows(NOW).find((row) => row.symbol === "PEAR");
    expect(stock?.pe).toBeGreaterThan(0);
  });
});
