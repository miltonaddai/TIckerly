import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { withSession, type AppEnv } from "./middleware/auth";
import { clearSessionCookie, writeSessionCookie } from "./lib/cookies";
import {
  AuthError,
  getNotifications,
  getProfile,
  loginUser,
  registerUser,
  updateNotifications,
  updatePassword,
  updateProfile,
} from "./services/auth";
import { analyzeTicker, chatWithMarket } from "./services/ai";
import { createRule, listAlerts } from "./services/alerts";
import { getMovers, getMarketSnapshot } from "./services/market";
import { addWatchlistSymbol, getWatchlist, removeWatchlistSymbol } from "./services/watchlist";
import { applyScreen, scoreMatch } from "./services/screener";
import { consumeRateLimit } from "./lib/rate-limit";
import type { AlertType, Profile } from "./types";

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const profilePatch = z
  .object({
    firstName: z.string().min(1).max(40).optional(),
    avatarUrl: z
      .union([
        z.null(),
        z.string().url().max(500),
        z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i).max(400_000),
      ])
      .optional(),
    assetClass: z.array(z.enum(["stocks", "crypto", "futures", "options"])).min(1).max(4).optional(),
    experience: z.enum(["just_starting", "1_3_years", "3_7_years", "7_plus"]).optional(),
    currency: z.string().max(20).optional(),
    timezone: z.string().max(60).optional(),
    twoFactorEnabled: z.boolean().optional(),
    onboardingComplete: z.boolean().optional(),
  })
  .strict();

const notificationSchema = z.object({
  priceTargets: z.boolean(),
  volumeSpikes: z.boolean(),
  earnings: z.boolean(),
  weeklyDigest: z.boolean(),
});

const filterSchema = z.object({
  id: z.string(),
  field: z.enum([
    "marketCap",
    "pe",
    "eps",
    "volume",
    "avgVolume",
    "volRatio",
    "changePct",
    "price",
    "vsSma50",
    "vsSma200",
  ]),
  op: z.enum(["gt", "lt", "gte", "lte"]),
  value: z.number(),
  label: z.string().max(80),
});

/** Per-user limits for watchlist symbols and alert rules. */
export const WATCHLIST_LIMIT = 50;
export const ALERT_LIMIT = 50;

function authError(error: unknown, fallback: string, status: 400 | 401 = 400) {
  if (error instanceof AuthError) {
    return { message: error.message, status: error.status as 400 | 401 | 403 | 503 };
  }
  return { message: error instanceof Error ? error.message : fallback, status };
}

export function createApp() {
  const app = new Hono<AppEnv>().basePath("/api");

  app.use("*", withSession);

  app.get("/health", (c) => c.json({ ok: true, service: "tickerly-api" }));

  app.post("/auth/register", zValidator("json", credentials), async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const { session, profile, needsConfirmation } = await registerUser(email.toLowerCase(), password);
      if (session) writeSessionCookie(c, session);
      return c.json({ data: { profile, needsConfirmation } }, 201);
    } catch (error) {
      const { message, status } = authError(error, "Register failed");
      return c.json({ error: message }, status);
    }
  });

  app.post("/auth/login", zValidator("json", credentials), async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const { session, profile } = await loginUser(email.toLowerCase(), password);
      writeSessionCookie(c, session);
      return c.json({ data: profile });
    } catch (error) {
      const { message, status } = authError(error, "Invalid email or password", 401);
      return c.json({ error: message }, status);
    }
  });

  app.post("/auth/logout", async (c) => {
    clearSessionCookie(c);
    return c.json({ data: true });
  });

  app.get("/auth/me", async (c) => {
    return c.json({ data: await getProfile(c.get("session")) });
  });

  app.post(
    "/auth/password",
    zValidator("json", z.object({ password: z.string().min(8).max(72) })),
    async (c) => {
      try {
        await updatePassword(c.get("session"), c.req.valid("json").password);
        return c.json({ data: true });
      } catch (error) {
        const { message, status } = authError(error, "Unable to update password");
        return c.json({ error: message }, status);
      }
    },
  );

  app.patch("/profile", zValidator("json", profilePatch), async (c) => {
    const patch = { ...c.req.valid("json") } as Partial<Profile>;
    const profile = await updateProfile(c.get("session"), patch);
    return c.json({ data: profile });
  });

  app.get("/profile/notifications", async (c) => {
    return c.json({ data: await getNotifications(c.get("session")) });
  });

  app.put("/profile/notifications", zValidator("json", notificationSchema), async (c) => {
    return c.json({ data: await updateNotifications(c.get("session"), c.req.valid("json")) });
  });

  app.get("/market/movers", async (c) => c.json({ data: await getMovers() }));
  app.get("/market/quotes", async (c) => {
    return c.json({ data: await getMarketSnapshot() });
  });
  app.get("/market/watchlist", async (c) => {
    try {
      return c.json({ data: await getWatchlist(c.get("session")) });
    } catch (error) {
      const { message, status } = authError(error, "Unable to load watchlist");
      return c.json({ error: message }, status);
    }
  });
  app.post(
    "/market/watchlist",
    zValidator("json", z.object({ symbol: z.string().min(1).max(12) })),
    async (c) => {
      try {
        const session = c.get("session");
        return c.json({ data: await addWatchlistSymbol(session, c.req.valid("json").symbol, WATCHLIST_LIMIT) });
      } catch (error) {
        const { message, status } = authError(error, "Unable to save watchlist");
        return c.json({ error: message }, status);
      }
    },
  );
  app.delete("/market/watchlist/:symbol", async (c) => {
    try {
      return c.json({ data: await removeWatchlistSymbol(c.get("session"), c.req.param("symbol") ?? "") });
    } catch (error) {
      const { message, status } = authError(error, "Unable to update watchlist");
      return c.json({ error: message }, status);
    }
  });

  app.post(
    "/market/screener",
    zValidator(
      "json",
      z.object({
        filters: z.array(filterSchema).max(12),
        view: z.enum(["fundamentals", "technicals"]).default("fundamentals"),
      }),
    ),
    async (c) => {
      const { filters } = c.req.valid("json");
      const { quotes, fetchedAt } = await getMarketSnapshot();
      const matches = applyScreen(quotes, filters)
        .map((quote) => ({ ...quote, score: scoreMatch(quote, filters) }))
        .sort((a, b) => b.score - a.score);
      return c.json({ data: { matches, universe: quotes.length, fetchedAt } });
    },
  );

  app.get("/alerts", (c) => c.json({ data: listAlerts(c.get("session").sub) }));

  app.post(
    "/alerts",
    zValidator(
      "json",
      z.object({
        symbol: z.string().min(1).max(12),
        type: z.enum([
          "PRICE_TARGET",
          "VOLATILITY",
          "VOLUME_SURGE",
          "RSI_OVERBOUGHT",
          "RSI_OVERSOLD",
          "EARNINGS",
        ]),
        target: z.number().positive().optional(),
      }),
    ),
    async (c) => {
      const session = c.get("session");
      if (listAlerts(session.sub).length >= ALERT_LIMIT) {
        return c.json({ error: `Alert limit reached (${ALERT_LIMIT}).` }, 403);
      }
      const body = c.req.valid("json");
      return c.json({ data: await createRule(session, { ...body, type: body.type as AlertType }) }, 201);
    },
  );

  app.get("/ai/analyze/:symbol", async (c) => {
    const symbol = (c.req.param("symbol") ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!symbol) return c.json({ error: "Invalid symbol" }, 400);
    return c.json({ data: await analyzeTicker(symbol) });
  });

  app.post(
    "/ai/chat",
    zValidator(
      "json",
      z.object({
        page: z.enum(["home", "screener", "alerts", "profile", "other"]).default("other"),
        symbols: z.array(z.string().max(12)).max(40).optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(2000),
            }),
          )
          .min(1)
          .max(16),
      }),
    ),
    async (c) => {
      const limited = await consumeRateLimit(`ai:${c.get("session").sub}`, 20);
      if (!limited.ok) return c.json({ error: "Too many assistant requests. Try again in a minute." }, 429);
      try {
        const body = c.req.valid("json");
        const reply = await chatWithMarket(c.get("session"), {
          page: body.page,
          symbols: body.symbols ?? [],
          messages: body.messages,
        });
        return c.json({ data: { reply } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Assistant unavailable";
        return c.json({ error: message.slice(0, 180) }, 500);
      }
    },
  );

  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((err, c) => {
    if ("getResponse" in err && typeof err.getResponse === "function") {
      return err.getResponse();
    }
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
