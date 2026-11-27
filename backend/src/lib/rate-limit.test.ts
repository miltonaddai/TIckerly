import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeRateLimit } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("consumeRateLimit", () => {
  it("allows requests up to the limit and then blocks", async () => {
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await consumeRateLimit("limit-basic", 3));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
  });

  it("tracks keys independently", async () => {
    await consumeRateLimit("limit-a", 1);
    expect((await consumeRateLimit("limit-a", 1)).ok).toBe(false);
    expect((await consumeRateLimit("limit-b", 1)).ok).toBe(true);
  });

  it("resets after the window passes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await consumeRateLimit("limit-window", 1, 1_000);
    expect((await consumeRateLimit("limit-window", 1, 1_000)).ok).toBe(false);
    vi.setSystemTime(new Date("2026-01-01T00:00:01.001Z"));
    expect((await consumeRateLimit("limit-window", 1, 1_000)).ok).toBe(true);
  });
});
