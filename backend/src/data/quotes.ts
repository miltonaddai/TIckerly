import { UNIVERSE_SYMBOLS } from "./universe";

/**
 * Generated quotes. Values are deterministic per symbol and drift slowly with time
 * so movers, alerts and the screener stay active. These are not real prices.
 */

const NAMES: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", NVDA: "NVIDIA Corp.", AMZN: "Amazon.com Inc.",
  GOOGL: "Alphabet Inc.", META: "Meta Platforms Inc.", TSLA: "Tesla Inc.", AVGO: "Broadcom Inc.",
  JPM: "JPMorgan Chase & Co.", V: "Visa Inc.", UNH: "UnitedHealth Group", XOM: "Exxon Mobil Corp.",
  MA: "Mastercard Inc.", COST: "Costco Wholesale", HD: "Home Depot Inc.", PG: "Procter & Gamble",
  JNJ: "Johnson & Johnson", ABBV: "AbbVie Inc.", NFLX: "Netflix Inc.", BAC: "Bank of America",
  KO: "Coca-Cola Co.", CRM: "Salesforce Inc.", PEP: "PepsiCo Inc.", ORCL: "Oracle Corp.",
  AMD: "Advanced Micro Devices", CSCO: "Cisco Systems", LIN: "Linde plc", WMT: "Walmart Inc.",
  TMO: "Thermo Fisher Scientific", MRK: "Merck & Co.", ACN: "Accenture plc", MCD: "McDonald's Corp.",
  ABT: "Abbott Laboratories", GE: "GE Aerospace", IBM: "IBM", CAT: "Caterpillar Inc.",
  DHR: "Danaher Corp.", VZ: "Verizon Communications", DIS: "Walt Disney Co.", ADBE: "Adobe Inc.",
  QCOM: "Qualcomm Inc.", NOW: "ServiceNow Inc.", TXN: "Texas Instruments", INTC: "Intel Corp.",
  AMAT: "Applied Materials", AMGN: "Amgen Inc.", ISRG: "Intuitive Surgical", PFE: "Pfizer Inc.",
  NEE: "NextEra Energy", CMCSA: "Comcast Corp.", UBER: "Uber Technologies", HON: "Honeywell",
  LOW: "Lowe's Companies", BA: "Boeing Co.", SPGI: "S&P Global", BKNG: "Booking Holdings",
  UNP: "Union Pacific", T: "AT&T Inc.", PLTR: "Palantir Technologies", COIN: "Coinbase Global",
  C: "Citigroup Inc.", GS: "Goldman Sachs", AXP: "American Express", BLK: "BlackRock Inc.",
  MS: "Morgan Stanley", F: "Ford Motor Co.", GM: "General Motors", CVX: "Chevron Corp.",
  COP: "ConocoPhillips", WFC: "Wells Fargo", INTU: "Intuit Inc.", PANW: "Palo Alto Networks",
  SBUX: "Starbucks Corp.", NKE: "Nike Inc.", MDT: "Medtronic plc", DE: "Deere & Co.",
  LMT: "Lockheed Martin", RTX: "RTX Corp.", SPY: "SPDR S&P 500 ETF",
};

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
  return UNIVERSE_SYMBOLS.map((symbol) => {
    const base = 15 + rand(symbol, "price") ** 2 * 600;
    const changePct = round((rand(symbol, `chg:${tick}`) - 0.5) * 9);
    const price = round(base * (1 + changePct / 100));
    const shares = 3e8 + rand(symbol, "shares") * 1.2e10;
    const avgVolume = Math.round(2e6 + rand(symbol, "avgvol") * 8e7);
    const volume = Math.round(avgVolume * (0.4 + rand(symbol, `vol:${tick}`) * 2.2));
    const pe = symbol === "SPY" ? undefined : round(6 + rand(symbol, "pe") * 70, 1);
    return {
      symbol,
      name: NAMES[symbol] ?? symbol,
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
