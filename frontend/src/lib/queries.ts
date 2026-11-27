import { api } from "@/lib/api";
import type {
  LiveAlert,
  NotificationPrefs,
  Profile,
  Quote,
  ScreenerFilter,
} from "@/lib/types";

export type RegisterResult = {
  profile: Profile | null;
  needsConfirmation: boolean;
};

export const authApi = {
  me: () => api<Profile | null>("/auth/me"),
  login: (email: string, password: string) =>
    api<Profile>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    api<RegisterResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  updatePassword: (password: string) =>
    api<boolean>("/auth/password", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};

export const profileApi = {
  update: (patch: Partial<Profile>) =>
    api<Profile>("/profile", { method: "PATCH", body: JSON.stringify(patch) }),
  notifications: () => api<NotificationPrefs>("/profile/notifications"),
  updateNotifications: (prefs: NotificationPrefs) =>
    api<NotificationPrefs>("/profile/notifications", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),
};

export const marketApi = {
  movers: () => api<Quote[]>("/market/movers"),
  quotes: () => api<{ quotes: Quote[]; fetchedAt: number }>("/market/quotes"),
  watchlist: () => api<Quote[]>("/market/watchlist"),
  addWatchlist: (symbol: string) =>
    api<Quote[]>("/market/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol }),
    }),
  removeWatchlist: (symbol: string) => api<Quote[]>(`/market/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" }),
  screener: (filters: ScreenerFilter[], view: "fundamentals" | "technicals") =>
    api<{ matches: Quote[]; universe: number; fetchedAt?: number }>("/market/screener", {
      method: "POST",
      body: JSON.stringify({ filters, view }),
    }),
};

export const alertsApi = {
  list: () => api<LiveAlert[]>("/alerts"),
  create: (payload: { symbol: string; type: string; target?: number }) =>
    api<LiveAlert>("/alerts", { method: "POST", body: JSON.stringify(payload) }),
};

export const aiApi = {
  analyze: (symbol: string) =>
    api<{ symbol: string; analysis: string; signal: string }>(`/ai/analyze/${symbol}`),
  chat: (payload: {
    page: "home" | "screener" | "alerts" | "profile" | "other";
    symbols?: string[];
    messages: { role: "user" | "assistant"; content: string }[];
  }) => api<{ reply: string }>("/ai/chat", { method: "POST", body: JSON.stringify(payload) }),
};
