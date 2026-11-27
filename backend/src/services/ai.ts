import type { Quote, Session } from "../types";
import { getMovers, getQuote, getQuotes } from "./market";
import { getWatchlist } from "./watchlist";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function analyzeTicker(symbol: string) {
  const quote = await getQuote(symbol);
  return {
    symbol,
    signal: quote?.signal ?? "Watch",
    analysis: quote
      ? `${symbol} is ${quote.changePct >= 0 ? "up" : "down"} ${Math.abs(quote.changePct).toFixed(2)}% at ${quote.price}, P/E ${quote.pe ?? "n/a"}.`
      : `${symbol} is not in the current universe.`,
  };
}

export async function chatWithMarket(
  session: Session,
  input: { page: string; symbols: string[]; messages: ChatTurn[] },
) {
  return ruleBasedReply(session, input);
}

function fmtPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/** Rule-based market assistant built from the current quote snapshot. */
async function ruleBasedReply(session: Session, input: { page: string; symbols: string[]; messages: ChatTurn[] }) {
  const question = input.messages[input.messages.length - 1]?.content ?? "";
  const all = await getQuotes();
  const mentioned = [...new Set((question.toUpperCase().match(/\b[A-Z]{1,5}\b/g) ?? []))]
    .map((symbol) => all.find((quote) => quote.symbol === symbol))
    .filter((quote): quote is Quote => Boolean(quote))
    .slice(0, 4);

  const lines: string[] = [];
  if (mentioned.length) {
    for (const quote of mentioned) {
      const pe = quote.pe != null ? `, P/E ${quote.pe.toFixed(1)}` : "";
      const vs50 = quote.vsSma50 != null ? `, ${quote.vsSma50.toFixed(1)}% vs 50DMA` : "";
      lines.push(`- **${quote.symbol}** ${quote.price} (${fmtPct(quote.changePct)})${pe}${vs50} — ${quote.signal ?? "Quiet"}`);
    }
  } else {
    const movers = await getMovers();
    lines.push("**Top movers right now:**");
    for (const quote of movers.slice(0, 5)) {
      lines.push(`- **${quote.symbol}** ${fmtPct(quote.changePct)} at ${quote.price} — ${quote.signal ?? "Quiet"}`);
    }
    const watchlist = await getWatchlist(session);
    if (watchlist.length) {
      const worst = [...watchlist].sort((a, b) => a.changePct - b.changePct)[0];
      lines.push("", `Weakest on your watchlist: **${worst.symbol}** (${fmtPct(worst.changePct)}).`);
    }
  }
  lines.push("", "Not investment advice.");
  return lines.join("\n");
}
