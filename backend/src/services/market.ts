import { generateQuoteRows } from "../data/quotes";
import type { Quote } from "../types";

/** Quotes are regenerated at most once a minute. */
const CACHE_MS = 60 * 1000;

type CacheEntry = { at: number; quotes: Quote[] };

let memory: CacheEntry | null = null;

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function deriveSignal(quote: Quote) {
  if ((quote.volRatio ?? 0) >= 2 && quote.changePct >= 2) return "Volume surge";
  if (quote.changePct >= 3) return "Strong up";
  if (quote.changePct <= -3) return "Selloff";
  if ((quote.vsSma50 ?? 0) > 8) return "Above 50DMA";
  if ((quote.vsSma50 ?? 0) < -8) return "Below 50DMA";
  if ((quote.pe ?? 99) > 0 && (quote.pe ?? 99) < 15) return "Value";
  if (quote.changePct > 0.4) return "Bid";
  if (quote.changePct < -0.4) return "Offer";
  return "Quiet";
}

function mapQuote(row: Record<string, unknown>): Quote | null {
  const symbol = String(row.symbol ?? "").toUpperCase();
  const price = num(row.price);
  if (!symbol || price == null) return null;
  const avg50 = num(row.priceAvg50);
  const avg200 = num(row.priceAvg200);
  const volume = num(row.volume) ?? 0;
  const avgVolume = num(row.avgVolume);
  const quote: Quote = {
    symbol,
    name: String(row.name ?? symbol),
    price,
    changePct: num(row.changePercentage) ?? 0,
    volume,
    avgVolume,
    marketCap: num(row.marketCap),
    pe: num(row.pe),
    eps: num(row.eps),
    priceAvg50: avg50,
    priceAvg200: avg200,
    dayLow: num(row.dayLow),
    dayHigh: num(row.dayHigh),
    yearLow: num(row.yearLow),
    yearHigh: num(row.yearHigh),
    vsSma50: avg50 ? (price / avg50 - 1) * 100 : undefined,
    vsSma200: avg200 ? (price / avg200 - 1) * 100 : undefined,
    volRatio: avgVolume ? volume / avgVolume : undefined,
  };
  quote.signal = deriveSignal(quote);
  return quote;
}

function refreshQuotes() {
  const quotes = generateQuoteRows()
    .map(mapQuote)
    .filter((row): row is Quote => Boolean(row));
  memory = { at: Date.now(), quotes };
  return quotes;
}

export async function getQuotes(symbols?: string[]): Promise<Quote[]> {
  const quotes = memory && Date.now() - memory.at < CACHE_MS ? memory.quotes : refreshQuotes();
  return symbols ? quotes.filter((item) => symbols.includes(item.symbol)) : quotes;
}

export function getCachedQuotes() {
  return memory?.quotes ?? [];
}

export function quotesFetchedAt() {
  return memory?.at ?? 0;
}

export async function getQuote(symbol: string) {
  const quotes = await getQuotes();
  return quotes.find((item) => item.symbol === symbol.toUpperCase()) ?? null;
}

export async function getMarketSnapshot() {
  const quotes = await getQuotes();
  return { quotes, fetchedAt: quotesFetchedAt() };
}

export async function getMovers() {
  const quotes = await getQuotes();
  return [...quotes].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 12);
}
