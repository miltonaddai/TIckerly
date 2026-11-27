import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SCREEN_FILTERS } from "@/lib/screener";
import { hasActiveSubscription } from "@/lib/subscription";
import type { Profile } from "@/lib/types";
import { useChatStore } from "@/stores/chat";
import { useScreenerStore } from "@/stores/screener";

describe("chat store", () => {
  beforeEach(() => {
    useChatStore.setState({ open: false, pending: false, error: null, messages: [] });
  });

  it("toggles open and clears errors", () => {
    useChatStore.getState().setError("boom");
    useChatStore.getState().toggle();
    expect(useChatStore.getState()).toMatchObject({ open: true, error: null });
    useChatStore.getState().close();
    expect(useChatStore.getState().open).toBe(false);
  });

  it("appends messages and clears them", () => {
    useChatStore.getState().addMessage({ role: "user", content: "How is PEAR?" });
    useChatStore.getState().addMessage({ role: "assistant", content: "Up 1%." });
    expect(useChatStore.getState().messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    useChatStore.getState().clear();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("stops pending when an error is set", () => {
    useChatStore.getState().setPending(true);
    useChatStore.getState().setError("Assistant is unavailable right now.");
    expect(useChatStore.getState()).toMatchObject({ pending: false, error: "Assistant is unavailable right now." });
  });
});

describe("screener store", () => {
  beforeEach(() => {
    useScreenerStore.setState({
      filters: DEFAULT_SCREEN_FILTERS,
      view: "fundamentals",
      sort: { field: "marketCap", dir: "desc" },
    });
  });

  it("relabels applied filters", () => {
    useScreenerStore.getState().applyFilters([{ id: "x", field: "pe", op: "lt", value: 20, label: "stale" }]);
    expect(useScreenerStore.getState().filters[0].label).toBe("P/E < 20");
  });

  it("flips sort direction on the same field and resets on a new one", () => {
    const { toggleSort } = useScreenerStore.getState();
    toggleSort("marketCap");
    expect(useScreenerStore.getState().sort).toEqual({ field: "marketCap", dir: "asc" });
    toggleSort("marketCap");
    expect(useScreenerStore.getState().sort.dir).toBe("desc");
    toggleSort("symbol");
    expect(useScreenerStore.getState().sort).toEqual({ field: "symbol", dir: "desc" });
  });

  it("switches view", () => {
    useScreenerStore.getState().setView("technicals");
    expect(useScreenerStore.getState().view).toBe("technicals");
  });
});

describe("hasActiveSubscription", () => {
  it("accepts active and trialing only", () => {
    const status = (subscriptionStatus: Profile["subscriptionStatus"]) => ({ subscriptionStatus }) as Profile;
    expect(hasActiveSubscription(status("active"))).toBe(true);
    expect(hasActiveSubscription(status("trialing"))).toBe(true);
    expect(hasActiveSubscription(status("canceled"))).toBe(false);
    expect(hasActiveSubscription(null)).toBe(false);
  });
});
