import { createHash, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { newSession } from "../lib/session";
import { env } from "../env";
import type { AssetClass, NotificationPrefs, Profile, Session } from "../types";

/**
 * In-memory accounts. There is no external auth provider: data lives for the
 * lifetime of the API process. Requests without a session act as the demo user.
 */

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type LocalUser = {
  id: string;
  email: string;
  passwordHash: string;
  profile: Profile;
  notifications: NotificationPrefs;
};

const users = new Map<string, LocalUser>();

const defaultPrefs = (): NotificationPrefs => ({
  priceTargets: true,
  volumeSpikes: true,
  earnings: true,
  weeklyDigest: false,
});

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 32).toString("hex");
}

function makeHash(password: string) {
  const salt = createHash("sha256").update(env.sessionSecret).digest("hex").slice(0, 16);
  return `${salt}:${hashPassword(password, salt)}`;
}

function verifyHash(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const next = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(next, "hex"));
}

const ASSET_ORDER: AssetClass[] = ["stocks", "crypto", "futures", "options"];

export function normalizeAssetClasses(value: unknown): AssetClass[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const selected = ASSET_ORDER.filter((id) => list.includes(id));
  return selected.length ? selected : ["stocks"];
}

function blankProfile(id: string, email: string): Profile {
  return {
    id,
    email,
    firstName: "",
    avatarUrl: null,
    assetClass: ["stocks"],
    experience: "just_starting",
    currency: "USD ($)",
    timezone: "Eastern Time (UTC-5)",
    twoFactorEnabled: false,
    linkedBrokers: 0,
    onboardingComplete: false,
  };
}

export const DEMO_EMAIL = "demo@tickerly.app";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

users.set(DEMO_EMAIL, {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  passwordHash: makeHash("tickerly123"),
  profile: {
    ...blankProfile(DEMO_USER_ID, DEMO_EMAIL),
    firstName: "Demo",
    onboardingComplete: true,
    twoFactorEnabled: true,
    linkedBrokers: 2,
  },
  notifications: defaultPrefs(),
});

/** Session used for requests that carry no session cookie. */
export function defaultSession(): Session {
  return newSession(DEMO_USER_ID, DEMO_EMAIL);
}

function findById(id: string) {
  return [...users.values()].find((item) => item.id === id);
}

function ensureUser(session: Session) {
  const existing = findById(session.sub);
  if (existing) return existing;
  const created: LocalUser = {
    id: session.sub,
    email: session.email,
    passwordHash: makeHash(randomUUID()),
    profile: blankProfile(session.sub, session.email),
    notifications: defaultPrefs(),
  };
  users.set(session.email.toLowerCase(), created);
  return created;
}

export async function registerUser(email: string, password: string) {
  if (users.has(email.toLowerCase())) throw new AuthError("Email already registered");
  const id = randomUUID();
  const profile = blankProfile(id, email);
  users.set(email.toLowerCase(), {
    id,
    email,
    passwordHash: makeHash(password),
    profile,
    notifications: defaultPrefs(),
  });
  return { session: newSession(id, email), profile, needsConfirmation: false };
}

export async function loginUser(email: string, password: string) {
  const existing = users.get(email.toLowerCase());
  if (!existing || !verifyHash(password, existing.passwordHash)) {
    throw new AuthError("Invalid email or password", 401);
  }
  return { session: newSession(existing.id, existing.email), profile: existing.profile };
}

export async function updatePassword(session: Session, password: string) {
  ensureUser(session).passwordHash = makeHash(password);
}

export async function getProfile(session: Session): Promise<Profile> {
  return findById(session.sub)?.profile ?? blankProfile(session.sub, session.email);
}

export async function updateProfile(session: Session, patch: Partial<Profile>) {
  const user = ensureUser(session);
  user.profile = {
    ...user.profile,
    ...patch,
    ...(patch.assetClass ? { assetClass: normalizeAssetClasses(patch.assetClass) } : {}),
  };
  return user.profile;
}

export async function getNotifications(session: Session) {
  return findById(session.sub)?.notifications ?? defaultPrefs();
}

export async function updateNotifications(session: Session, prefs: NotificationPrefs) {
  ensureUser(session).notifications = prefs;
  return prefs;
}
