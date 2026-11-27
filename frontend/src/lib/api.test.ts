import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "@/lib/api";

function mockFetch(status: number, body?: unknown) {
  const fn = vi.fn(async () =>
    body === undefined
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("unwraps the data envelope", async () => {
    mockFetch(200, { data: { symbol: "PEAR" } });
    await expect(api("/market/quotes")).resolves.toEqual({ symbol: "PEAR" });
  });

  it("returns the raw payload when there is no envelope", async () => {
    mockFetch(200, { ok: true });
    await expect(api("/health")).resolves.toEqual({ ok: true });
  });

  it("returns undefined for 204 responses", async () => {
    mockFetch(204);
    await expect(api("/nothing")).resolves.toBeUndefined();
  });

  it("throws ApiError with the server message and status", async () => {
    mockFetch(403, { error: "Watchlist limit reached for your plan." });
    const error = await api("/market/watchlist").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Watchlist limit reached for your plan.", status: 403 });
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 500 })));
    await expect(api("/broken")).rejects.toMatchObject({ message: "Request failed", status: 500 });
  });

  it("sends JSON bodies with credentials and the API prefix", async () => {
    const fetchMock = mockFetch(200, { data: true });
    await api("/alerts", { method: "POST", body: JSON.stringify({ symbol: "PEAR" }) });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/alerts");
    expect(init.credentials).toBe("include");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });
});
