import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { COOKIE, decodeSession } from "../lib/session";
import { defaultSession } from "../services/auth";
import type { Session } from "../types";

export type AppEnv = {
  Variables: {
    session: Session;
  };
};

/**
 * No auth gate: a valid session cookie selects that account, and anything else
 * (no cookie, expired, tampered) falls back to the shared demo user.
 */
export async function withSession(c: Context<AppEnv>, next: Next) {
  c.set("session", decodeSession(getCookie(c, COOKIE)) ?? defaultSession());
  await next();
}
