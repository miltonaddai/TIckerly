import { COMPANIES } from "./universe";

/**
 * Generated quotes. Values are deterministic per symbol and drift slowly with time
 * so movers, alerts and the screener stay active. These are not real prices.
 */

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic value in [0, 1) for a symbol + salt. */
function rand(symbol: string, salt: string) {
  return hash(`${symbol}:${salt}`) / 2 ** 32;
}

function round(value: number, digits = 2) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function generateQuoteRows(now = Date.now()): Record<string, unknown>[] {
  // Changes every 5 minutes so the in-process alert evaluator sees movement.
  const tick = Math.floor(now / (5 * 60 * 1000));
  return COMPANIES.map(({ symbol, name, etf }) => {
    const base = 15 + rand(symbol, "price") ** 2 * 600;
    const changePct = round((rand(symbol, `chg:${tick}`) - 0.5) * 9);
    const price = round(base * (1 + changePct / 100));
    const shares = 3e8 + rand(symbol, "shares") * 1.2e10;
    const avgVolume = Math.round(2e6 + rand(symbol, "avgvol") * 8e7);
    const volume = Math.round(avgVolume * (0.4 + rand(symbol, `vol:${tick}`) * 2.2));
    const pe = etf ? undefined : round(6 + rand(symbol, "pe") * 70, 1);
    return {
      symbol,
      name,
      price,
      changePercentage: changePct,
      volume,
      avgVolume,
      marketCap: Math.round(price * shares),
      pe,
      eps: pe ? round(price / pe) : undefined,
      priceAvg50: round(base * (0.88 + rand(symbol, "sma50") * 0.24)),
      priceAvg200: round(base * (0.75 + rand(symbol, "sma200") * 0.4)),
      dayLow: round(price * 0.985),
      dayHigh: round(price * 1.015),
      yearLow: round(base * 0.7),
      yearHigh: round(base * 1.3),
    };
  });
}
