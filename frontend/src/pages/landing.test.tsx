import { render, screen } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { ChangeText } from "@/components/market";
import { LandingPage } from "@/pages/landing";

describe("ChangeText", () => {
  it("uses gain styling for positive moves", () => {
    render(<ChangeText value={4.82} />);
    expect(screen.getByText("+4.82%")).toHaveClass("change-up");
  });

  it("uses loss styling for negative moves", () => {
    render(<ChangeText value={-1.24} />);
    expect(screen.getByText("-1.24%")).toHaveClass("change-down");
  });
});

describe("landing page", () => {
  it("renders the hero and screener preview", async () => {
    const rootRoute = createRootRoute({ component: LandingPage });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { level: 1, name: /Build a screener that tracks smart money/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("NVDU").length).toBeGreaterThan(0);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });
});
