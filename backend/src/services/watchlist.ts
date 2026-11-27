import { AuthError } from "./auth";
import { getQuotes } from "./market";
import type { Quote, Session } from "../types";

const memory = new Map<string, string[]>();

function normalizeSymbol(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
}

async function listSymbols(session: Session) {
  return memory.get(session.sub) ?? [];
}

async function quotesFor(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  const quotes = await getQuotes(symbols);
  const bySymbol = new Map(quotes.map((item) => [item.symbol, item]));
  return symbols.map(
    (symbol) =>
      bySymbol.get(symbol) ?? {
        symbol,
        name: symbol,
        price: 0,
        changePct: 0,
        volume: 0,
      },
  );
}

export async function getWatchlist(session: Session) {
  return quotesFor(await listSymbols(session));
}

export async function addWatchlistSymbol(session: Session, raw: string, cap: number) {
  const symbol = normalizeSymbol(raw);
  if (!symbol) throw new AuthError("Enter a ticker symbol", 400);
  const current = await listSymbols(session);
  if (current.includes(symbol)) return quotesFor(current);
  if (current.length >= cap) {
    throw new AuthError("Watchlist limit reached for your plan.", 403);
  }

  memory.set(session.sub, [...current, symbol]);
  return quotesFor([...current, symbol]);
}

export async function removeWatchlistSymbol(session: Session, raw: string) {
  const symbol = normalizeSymbol(raw);
  if (!symbol) throw new AuthError("Enter a ticker symbol", 400);

  const next = (memory.get(session.sub) ?? []).filter((item) => item !== symbol);
  memory.set(session.sub, next);
  return quotesFor(next);
}
