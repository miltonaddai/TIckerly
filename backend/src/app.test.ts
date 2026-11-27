import { describe, expect, it } from "vitest";
import { decodeSession, encodeSession, newSession } from "./lib/session";
import { createApp } from "./app";

describe("session signing", () => {
  it("round-trips a valid session", () => {
    const session = newSession("user-1", "user@example.com");
    const decoded = decodeSession(encodeSession(session));
    expect(decoded?.sub).toBe("user-1");
    expect(decoded?.email).toBe("user@example.com");
  });

  it("rejects a tampered cookie", () => {
    const encoded = encodeSession(newSession("user-1", "user@example.com"));
    expect(decodeSession(`${encoded}evil`)).toBeNull();
    expect(decodeSession("not-a-session")).toBeNull();
  });
});

describe("api auth", () => {
  const app = createApp();

  it("serves app routes without a session as the demo user", async () => {
    const alerts = await app.request("/api/alerts");
    expect(alerts.status).toBe(200);
    const me = await app.request("/api/auth/me");
    const meJson = (await me.json()) as { data: { email: string } };
    expect(meJson.data.email).toBe("demo@tickerly.app");
    const movers = await app.request("/api/market/movers");
    const moversJson = (await movers.json()) as { data: unknown[] };
    expect(moversJson.data.length).toBeGreaterThan(0);
  });

  it("rejects short passwords", async () => {
    const response = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad@x.com", password: "123" }),
    });
    expect(response.status).toBe(400);
  });

  it("registers and reads the current user", async () => {
    const register = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "correct-horse" }),
    });
    expect(register.status).toBe(201);
    const cookie = register.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    const body = (await register.json()) as { data: { profile: { email: string }; needsConfirmation: boolean } };
    expect(body.data.needsConfirmation).toBe(false);
    expect(body.data.profile.email).toBe("user@example.com");

    const me = await app.request("/api/auth/me", { headers: { Cookie: cookie.split(";")[0] } });
    const meJson = (await me.json()) as { data: { email: string } };
    expect(meJson.data.email).toBe("user@example.com");

    const alerts = await app.request("/api/alerts", { headers: { Cookie: cookie.split(";")[0] } });
    expect(alerts.status).toBe(200);

    const anonymous = await app.request("/api/auth/me");
    const anonymousJson = (await anonymous.json()) as { data: { email: string } };
    expect(anonymousJson.data.email).toBe("demo@tickerly.app");
  });
});
