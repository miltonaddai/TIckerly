import { allRules, evaluateRule, pushEvent } from "../services/alerts";
import { getQuotes } from "../services/market";

/** In-process alert evaluator. Runs a screen pass every 60 seconds. */
async function runScreenPass() {
  const quotes = await getQuotes();
  console.log(`Worker screen pass: ${quotes.length} quotes`);
  const bySymbol = new Map(quotes.map((item) => [item.symbol, item]));
  for (const [userId, userRules] of allRules()) {
    for (const rule of userRules.filter((item) => item.active)) {
      const event = evaluateRule(rule, bySymbol.get(rule.symbol));
      if (event) pushEvent(userId, event);
    }
  }
}

export async function startWorkers() {
  console.log("Alert evaluator running in-process every 60s");
  await runScreenPass();
  setInterval(() => {
    void runScreenPass();
  }, 60_000);
}

void startWorkers();
