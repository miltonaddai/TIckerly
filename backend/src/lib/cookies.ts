import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { COOKIE, cookieOptions, encodeSession } from "./session";
import type { Session } from "../types";

export function writeSessionCookie(c: Context, session: Session) {
  setCookie(c, COOKIE, encodeSession(session), cookieOptions());
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE, cookieOptions(0));
}
