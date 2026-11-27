import { decryptJson, encryptJson, fromB64, safeEqual, sign } from "./crypto";
import { isProd } from "../env";
import type { Session } from "../types";

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function encodeSession(session: Session) {
  const payload = encryptJson(session);
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(cookieValue: string | undefined): Session | null {
  if (!cookieValue) return null;
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const session = decryptJson<Session>(payload) ?? (JSON.parse(fromB64(payload)) as Session);
    if (!session.sub || !session.email || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function newSession(sub: string, email: string): Session {
  return { sub, email, exp: Date.now() + MAX_AGE_SEC * 1000 };
}

export const COOKIE = "tickerly_session";
export const COOKIE_MAX_AGE = MAX_AGE_SEC;

export function cookieOptions(maxAge = COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax" as const,
    secure: isProd,
    maxAge,
  };
}
