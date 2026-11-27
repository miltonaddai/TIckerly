import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SCREEN_FILTERS, filterLabel } from "@/lib/screener";
import type { ScreenerField, ScreenerFilter } from "@/lib/types";

export type ScreenerView = "fundamentals" | "technicals";
export type ScreenerSort = { field: ScreenerField | "symbol" | "name"; dir: "asc" | "desc" };

type ScreenerState = {
  filters: ScreenerFilter[];
  view: ScreenerView;
  sort: ScreenerSort;
  setView: (view: ScreenerView) => void;
  applyFilters: (filters: ScreenerFilter[]) => void;
  toggleSort: (field: ScreenerField | "symbol" | "name") => void;
};

export const useScreenerStore = create<ScreenerState>()(
  persist(
    (set) => ({
      filters: DEFAULT_SCREEN_FILTERS,
      view: "fundamentals",
      sort: { field: "marketCap", dir: "desc" },
      setView: (view) => set({ view }),
      applyFilters: (filters) =>
        set({
          filters: filters.map((filter) => ({ ...filter, label: filterLabel(filter) })),
        }),
      toggleSort: (field) =>
        set((state) => ({
          sort:
            state.sort.field === field
              ? { field, dir: state.sort.dir === "desc" ? "asc" : "desc" }
              : { field, dir: "desc" },
        })),
    }),
    {
      name: "tickerly-screener",
      partialize: (state) => ({ filters: state.filters, view: state.view, sort: state.sort }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ScreenerState> | undefined;
        const filters =
          Array.isArray(saved?.filters) && saved.filters.length ? saved.filters : current.filters;
        return {
          ...current,
          ...saved,
          filters,
        };
      },
    },
  ),
);
