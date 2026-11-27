import { describe, expect, it } from "vitest";
import { allRules, createRule, evaluateRule, listAlerts, listRules, pushEvent } from "./alerts";
import { newSession } from "../lib/session";
import type { AlertRule, LiveAlert, Quote } from "../types";

const quote: Quote = { symbol: "PEAR", name: "Pear Computing", price: 200, changePct: 1, volume: 1_000_000, volRatio: 1 };

function rule(partial: Partial<AlertRule>): AlertRule {
  return { id: "r1", userId: "u1", symbol: "PEAR", type: "PRICE_TARGET", active: true, ...partial };
}

describe("evaluateRule", () => {
  it("returns null without a quote", () => {
    expect(evaluateRule(rule({ target: 100 }), null)).toBeNull();
    expect(evaluateRule(rule({ target: 100 }), undefined)).toBeNull();
  });

  it("fires a price target at or above the target", () => {
    expect(evaluateRule(rule({ target: 200 }), quote)?.description).toBe("Crossed above your $200.00 target");
    expect(evaluateRule(rule({ target: 250 }), quote)).toBeNull();
  });

  it("ignores a price target with no target set", () => {
    expect(evaluateRule(rule({ target: undefined }), quote)).toBeNull();
  });

  it("fires a volume surge at 1.8x average volume", () => {
    expect(evaluateRule(rule({ type: "VOLUME_SURGE" }), { ...quote, volRatio: 1.79 })).toBeNull();
    const hit = evaluateRule(rule({ type: "VOLUME_SURGE" }), { ...quote, volRatio: 2.04 });
    expect(hit?.description).toBe("Volume is 2.0x average");
    expect(hit?.types).toEqual(["VOLUME_SURGE"]);
  });

  it("fires volatility on large moves in either direction", () => {
    expect(evaluateRule(rule({ type: "VOLATILITY" }), { ...quote, changePct: 2.4 })).toBeNull();
    expect(evaluateRule(rule({ type: "VOLATILITY" }), { ...quote, changePct: 2.5 })).not.toBeNull();
    expect(evaluateRule(rule({ type: "VOLATILITY" }), { ...quote, changePct: -3.1 })).not.toBeNull();
  });

  it("copies price data from the quote into the event", () => {
    const hit = evaluateRule(rule({ target: 150 }), { ...quote, price: 210, changePct: -0.5 });
    expect(hit).toMatchObject({ symbol: "PEAR", price: 210, changePct: -0.5, isNew: true });
    expect(Date.parse(hit!.createdAt)).not.toBeNaN();
  });

  it("does not fire rule types without an evaluator", () => {
    expect(evaluateRule(rule({ type: "EARNINGS" }), { ...quote, changePct: 9, volRatio: 9 })).toBeNull();
  });
});

describe("rule storage", () => {
  it("keeps rules and events per user and sanitises the symbol", async () => {
    const alice = newSession("alice", "alice@example.com");
    const bob = newSession("bob", "bob@example.com");

    const event = await createRule(alice, { symbol: " nv$du ", type: "PRICE_TARGET", target: 500 });
    expect(event.symbol).toBe("NVDU");
    expect(event.description).toBe("Watching NVDU for a $500.00 print");

    expect(listRules("alice")).toHaveLength(1);
    expect(listAlerts("alice")).toHaveLength(1);
    expect(listRules("bob")).toHaveLength(0);
    expect(listAlerts(bob.sub)).toHaveLength(0);
    expect(allRules().map(([userId]) => userId)).toContain("alice");
  });

  it("describes non-price rules by type", async () => {
    const event = await createRule(newSession("carol", "carol@example.com"), {
      symbol: "TSLO",
      type: "VOLUME_SURGE",
    });
    expect(event.description).toBe("Watching TSLO for a volume surge trigger");
  });

  it("caps a user's event history at 50, newest first", () => {
    const base: LiveAlert = {
      id: "",
      symbol: "PEAR",
      types: ["VOLATILITY"],
      description: "",
      price: 1,
      changePct: 0,
      createdAt: new Date().toISOString(),
    };
    for (let i = 0; i < 60; i += 1) pushEvent("dave", { ...base, id: `e${i}` });
    const events = listAlerts("dave");
    expect(events).toHaveLength(50);
    expect(events[0].id).toBe("e59");
  });
});
