import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { UNIVERSE_SYMBOLS } from "./data/universe";

const app = createApp();
let counter = 0;

type Json = Record<string, any>;

async function call(path: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.cookie) headers.Cookie = init.cookie;
  const response = await app.request(`/api${path}`, {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = (await response.json().catch(() => ({}))) as Json;
  return { status: response.status, json, headers: response.headers };
}

async function newUser(password = "correct-horse") {
  counter += 1;
  const email = `user${counter}@example.com`;
  const { status, headers } = await call("/auth/register", { body: { email, password } });
  expect(status).toBe(201);
  const cookie = (headers.get("set-cookie") ?? "").split(";")[0];
  return { email, password, cookie };
}

describe("auth routes", () => {
  it("rejects duplicate registration", async () => {
    const { email } = await newUser();
    const again = await call("/auth/register", { body: { email, password: "another-pass" } });
    expect(again.status).toBe(400);
    expect(again.json.error).toBe("Email already registered");
  });

  it("logs in with the right password and rejects the wrong one", async () => {
    const { email, password } = await newUser();
    const ok = await call("/auth/login", { body: { email, password } });
    expect(ok.status).toBe(200);
    expect(ok.json.data.email).toBe(email);
    const bad = await call("/auth/login", { body: { email, password: "wrong-password" } });
    expect(bad.status).toBe(401);
  });

  it("treats emails case-insensitively", async () => {
    const { email, password } = await newUser();
    const ok = await call("/auth/login", { body: { email: email.toUpperCase(), password } });
    expect(ok.status).toBe(200);
  });

  it("logs in as the built-in demo user", async () => {
    const res = await call("/auth/login", { body: { email: "demo@tickerly.app", password: "tickerly123" } });
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ firstName: "Demo", plan: "max", subscriptionStatus: "active" });
  });

  it("changes the password", async () => {
    const { email, cookie } = await newUser();
    expect((await call("/auth/password", { body: { password: "brand-new-pass" }, cookie })).status).toBe(200);
    expect((await call("/auth/login", { body: { email, password: "brand-new-pass" } })).status).toBe(200);
    expect((await call("/auth/login", { body: { email, password: "correct-horse" } })).status).toBe(401);
  });

  it("clears the cookie on logout", async () => {
    const { cookie } = await newUser();
    const res = await call("/auth/logout", { method: "POST", cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("validates the email format", async () => {
    const res = await call("/auth/register", { body: { email: "not-an-email", password: "long-enough" } });
    expect(res.status).toBe(400);
  });
});

describe("profile routes", () => {
  it("updates the profile and normalises asset classes", async () => {
    const { cookie } = await newUser();
    const res = await call("/profile", {
      method: "PATCH",
      body: { firstName: "Sam", assetClass: ["options", "stocks"] },
      cookie,
    });
    expect(res.status).toBe(200);
    expect(res.json.data.firstName).toBe("Sam");
    expect(res.json.data.assetClass).toEqual(["stocks", "options"]);
    expect((await call("/auth/me", { cookie })).json.data.firstName).toBe("Sam");
  });

  it("rejects unknown profile fields", async () => {
    const { cookie } = await newUser();
    const res = await call("/profile", { method: "PATCH", body: { isAdmin: true }, cookie });
    expect(res.status).toBe(400);
  });

  it("saves notification preferences", async () => {
    const { cookie } = await newUser();
    const defaults = await call("/profile/notifications", { cookie });
    expect(defaults.json.data).toEqual({ priceTargets: true, volumeSpikes: true, earnings: true, weeklyDigest: false });
    const prefs = { priceTargets: false, volumeSpikes: true, earnings: false, weeklyDigest: true };
    expect((await call("/profile/notifications", { method: "PUT", body: prefs, cookie })).status).toBe(200);
    expect((await call("/profile/notifications", { cookie })).json.data).toEqual(prefs);
  });
});

describe("billing routes", () => {
  it("activates a plan locally through checkout and confirm", async () => {
    const { cookie } = await newUser();
    expect((await call("/auth/me", { cookie })).json.data.subscriptionStatus).toBe("inactive");

    const checkout = await call("/billing/checkout", { body: { plan: "max" }, cookie });
    expect(checkout.json.data.url).toMatch(/\/subscribe\/success\?session_id=local$/);

    const confirm = await call("/billing/confirm", { body: { sessionId: "local", plan: "max" }, cookie });
    expect(confirm.json.data).toMatchObject({ plan: "max", subscriptionStatus: "active", onboardingComplete: true });
  });

  it("returns a portal url", async () => {
    const { cookie } = await newUser();
    const res = await call("/billing/portal", { method: "POST", cookie });
    expect(res.json.data.url).toMatch(/\/subscribe$/);
  });

  it("rejects unknown plans", async () => {
    const { cookie } = await newUser();
    expect((await call("/billing/checkout", { body: { plan: "enterprise" }, cookie })).status).toBe(400);
  });
});

describe("market routes", () => {
  it("returns the full quote snapshot", async () => {
    const res = await call("/market/quotes");
    expect(res.json.data.quotes).toHaveLength(UNIVERSE_SYMBOLS.length);
    expect(res.json.data.fetchedAt).toBeGreaterThan(0);
  });

  it("returns the 12 biggest movers by absolute change", async () => {
    const movers = (await call("/market/movers")).json.data as { changePct: number }[];
    expect(movers).toHaveLength(12);
    const sizes = movers.map((quote) => Math.abs(quote.changePct));
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
  });

  it("adds, de-duplicates and removes watchlist symbols", async () => {
    const { cookie } = await newUser();
    expect((await call("/market/watchlist", { cookie })).json.data).toEqual([]);

    const added = await call("/market/watchlist", { body: { symbol: "pear" }, cookie });
    expect(added.json.data.map((q: Json) => q.symbol)).toEqual(["PEAR"]);
    expect(added.json.data[0].name).toBe("Pear Computing");

    const dup = await call("/market/watchlist", { body: { symbol: "PEAR" }, cookie });
    expect(dup.json.data).toHaveLength(1);

    await call("/market/watchlist", { body: { symbol: "MHRD" }, cookie });
    const removed = await call("/market/watchlist/pear", { method: "DELETE", cookie });
    expect(removed.json.data.map((q: Json) => q.symbol)).toEqual(["MHRD"]);
  });

  it("returns placeholder quotes for symbols outside the universe", async () => {
    const { cookie } = await newUser();
    const res = await call("/market/watchlist", { body: { symbol: "ZZZZ" }, cookie });
    expect(res.json.data[0]).toMatchObject({ symbol: "ZZZZ", price: 0 });
  });

  it("keeps watchlists separate per user", async () => {
    const a = await newUser();
    const b = await newUser();
    await call("/market/watchlist", { body: { symbol: "NVDU" }, cookie: a.cookie });
    expect((await call("/market/watchlist", { cookie: b.cookie })).json.data).toEqual([]);
  });

  it("rejects symbols that sanitise to nothing", async () => {
    const { cookie } = await newUser();
    const res = await call("/market/watchlist", { body: { symbol: "$$$" }, cookie });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Enter a ticker symbol");
  });

  it("enforces the Pro plan watchlist cap of 25", async () => {
    const { cookie } = await newUser();
    for (const symbol of UNIVERSE_SYMBOLS.slice(0, 25)) {
      expect((await call("/market/watchlist", { body: { symbol }, cookie })).status).toBe(200);
    }
    const over = await call("/market/watchlist", { body: { symbol: UNIVERSE_SYMBOLS[25] }, cookie });
    expect(over.status).toBe(403);
  });

  it("screens quotes and sorts matches by score", async () => {
    const all = await call("/market/screener", {
      body: { filters: [{ id: "p", field: "price", op: "gt", value: 0, label: "" }] },
    });
    expect(all.json.data.matches).toHaveLength(UNIVERSE_SYMBOLS.length);
    expect(all.json.data.universe).toBe(UNIVERSE_SYMBOLS.length);

    const none = await call("/market/screener", {
      body: { filters: [{ id: "p", field: "price", op: "lt", value: 0, label: "" }] },
    });
    expect(none.json.data.matches).toEqual([]);
  });

  it("only returns screener matches that satisfy every filter", async () => {
    const res = await call("/market/screener", {
      body: {
        filters: [
          { id: "a", field: "changePct", op: "gt", value: 0, label: "" },
          { id: "b", field: "volume", op: "gte", value: 5_000_000, label: "" },
        ],
      },
    });
    for (const quote of res.json.data.matches as Json[]) {
      expect(quote.changePct).toBeGreaterThan(0);
      expect(quote.volume).toBeGreaterThanOrEqual(5_000_000);
      expect(quote.score).toBe(1);
    }
  });

  it("rejects unknown screener fields", async () => {
    const res = await call("/market/screener", {
      body: { filters: [{ id: "x", field: "dividend", op: "gt", value: 1, label: "" }] },
    });
    expect(res.status).toBe(400);
  });
});

describe("alert routes", () => {
  it("creates an alert and lists it for that user only", async () => {
    const a = await newUser();
    const b = await newUser();
    const created = await call("/alerts", { body: { symbol: "TSLO", type: "PRICE_TARGET", target: 300 }, cookie: a.cookie });
    expect(created.status).toBe(201);
    expect(created.json.data.symbol).toBe("TSLO");
    expect((await call("/alerts", { cookie: a.cookie })).json.data).toHaveLength(1);
    expect((await call("/alerts", { cookie: b.cookie })).json.data).toHaveLength(0);
  });

  it("enforces the Pro plan alert cap of 25", async () => {
    const { cookie } = await newUser();
    for (let i = 0; i < 25; i += 1) {
      expect((await call("/alerts", { body: { symbol: "PEAR", type: "VOLATILITY" }, cookie })).status).toBe(201);
    }
    const over = await call("/alerts", { body: { symbol: "PEAR", type: "VOLATILITY" }, cookie });
    expect(over.status).toBe(403);
  });

  it("rejects invalid alert types and non-positive targets", async () => {
    const { cookie } = await newUser();
    expect((await call("/alerts", { body: { symbol: "PEAR", type: "MOON" }, cookie })).status).toBe(400);
    expect((await call("/alerts", { body: { symbol: "PEAR", type: "PRICE_TARGET", target: -5 }, cookie })).status).toBe(400);
  });
});

describe("assistant routes", () => {
  it("summarises symbols mentioned in the question", async () => {
    const { cookie } = await newUser();
    const res = await call("/ai/chat", {
      body: { page: "screener", messages: [{ role: "user", content: "How are PEAR and NVDU doing?" }] },
      cookie,
    });
    expect(res.status).toBe(200);
    expect(res.json.data.reply).toContain("**PEAR**");
    expect(res.json.data.reply).toContain("**NVDU**");
    expect(res.json.data.reply).toContain("Not investment advice.");
  });

  it("falls back to top movers and the watchlist's weakest name", async () => {
    const { cookie } = await newUser();
    await call("/market/watchlist", { body: { symbol: "MHRD" }, cookie });
    const res = await call("/ai/chat", {
      body: { page: "home", messages: [{ role: "user", content: "what's moving today?" }] },
      cookie,
    });
    expect(res.json.data.reply).toContain("**Top movers right now:**");
    expect(res.json.data.reply).toContain("Weakest on your watchlist: **MHRD**");
  });

  it("validates chat input", async () => {
    expect((await call("/ai/chat", { body: { messages: [] } })).status).toBe(400);
    expect(
      (await call("/ai/chat", { body: { messages: [{ role: "system", content: "hi" }] } })).status,
    ).toBe(400);
  });

  it("analyses known and unknown tickers", async () => {
    const known = await call("/ai/analyze/pear");
    expect(known.json.data.symbol).toBe("PEAR");
    expect(known.json.data.analysis).toMatch(/^PEAR is (up|down) /);

    const unknown = await call("/ai/analyze/ZZZZ");
    expect(unknown.json.data).toMatchObject({ signal: "Watch", analysis: "ZZZZ is not in the current universe." });

    expect((await call("/ai/analyze/$$$")).status).toBe(400);
  });
});

describe("misc routes", () => {
  it("reports health", async () => {
    expect((await call("/health")).json).toEqual({ ok: true, service: "tickerly-api" });
  });

  it("returns JSON 404s", async () => {
    const res = await call("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.json.error).toBe("Not found");
  });
});
