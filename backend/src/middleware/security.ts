import type { Context, Next } from "hono";
import { env, isProd } from "../env";
import { consumeRateLimit } from "../lib/rate-limit";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  if (origin === env.appOrigin) return true;
  if (!isProd && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
}

export async function csrfOrigin(c: Context, next: Next) {
  if (!MUTATING.has(c.req.method)) return next();
  const origin = c.req.header("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return c.json({ error: "Invalid origin" }, 403);
  }
  return next();
}

export async function rateLimit(c: Context, next: Next) {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = await consumeRateLimit(`${c.req.path}:${ip}`);
  if (!result.ok) {
    return c.json({ error: "Too many requests" }, 429);
  }
  return next();
}
