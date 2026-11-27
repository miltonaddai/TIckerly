import { uid } from "../lib/crypto";
import { getQuote } from "./market";
import type { AlertRule, AlertType, LiveAlert, Quote, Session } from "../types";

const rules = new Map<string, AlertRule[]>();
const events = new Map<string, LiveAlert[]>();

export function listAlerts(userId: string) {
  return events.get(userId) ?? [];
}

export function listRules(userId: string) {
  return rules.get(userId) ?? [];
}

export async function createRule(session: Session, input: { symbol: string; type: AlertType; target?: number }) {
  const symbol = input.symbol.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const existing = rules.get(session.sub) ?? [];
  const rule: AlertRule = {
    id: uid(),
    userId: session.sub,
    symbol,
    type: input.type,
    target: input.target,
    active: true,
  };
  rules.set(session.sub, [...existing, rule]);

  const quote = await getQuote(symbol);
  const event: LiveAlert = {
    id: uid(),
    symbol,
    types: [input.type],
    isNew: true,
    description:
      input.type === "PRICE_TARGET" && input.target
        ? `Watching ${symbol} for a $${input.target.toFixed(2)} print`
        : `Watching ${symbol} for a ${input.type.replaceAll("_", " ").toLowerCase()} trigger`,
    price: quote?.price ?? 0,
    changePct: quote?.changePct ?? 0,
    createdAt: new Date().toISOString(),
  };
  events.set(session.sub, [event, ...listAlerts(session.sub)]);
  return event;
}

export function evaluateRule(rule: AlertRule, quote: Quote | null | undefined): LiveAlert | null {
  if (!quote) return null;
  let hit = false;
  let description = "";
  if (rule.type === "PRICE_TARGET" && rule.target && quote.price >= rule.target) {
    hit = true;
    description = `Crossed above your $${rule.target.toFixed(2)} target`;
  }
  if (rule.type === "VOLUME_SURGE" && (quote.volRatio ?? 0) >= 1.8) {
    hit = true;
    description = `Volume is ${(quote.volRatio ?? 0).toFixed(1)}x average`;
  }
  if (rule.type === "VOLATILITY" && Math.abs(quote.changePct) >= 2.5) {
    hit = true;
    description = "Session move exceeded your volatility threshold";
  }
  if (!hit) return null;
  return {
    id: uid(),
    symbol: rule.symbol,
    types: [rule.type],
    isNew: true,
    description,
    price: quote.price,
    changePct: quote.changePct,
    createdAt: new Date().toISOString(),
  };
}

export function pushEvent(userId: string, alert: LiveAlert) {
  events.set(userId, [alert, ...listAlerts(userId)].slice(0, 50));
}

export function allRules() {
  return [...rules.entries()];
}
