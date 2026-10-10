import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BackToTop } from "@/components/BackToTop";

function scrollTo(y: number) {
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("BackToTop", () => {
  it("shows only from xl, where the side margin can hold it without covering content", () => {
    scrollTo(1200);
    render(<BackToTop />);
    const link = screen.getByRole("link", { hidden: true });
    expect(link).toHaveClass("hidden", "xl:flex");
  });

  it("stays hidden near the top — invisible, so out of the tab order too", () => {
    scrollTo(0);
    render(<BackToTop />);
    expect(screen.getByRole("link", { hidden: true })).toHaveClass("invisible");
  });

  it("appears once the hero is a screen behind, linking to the top", () => {
    scrollTo(0);
    render(<BackToTop />);
    scrollTo(1200);
    const link = screen.getByRole("link", { name: "Back to top" });
    expect(link).toHaveAttribute("href", "#top");
    expect(link).toHaveClass("visible");
    scrollTo(100);
    expect(link).toHaveClass("invisible");
  });
});
