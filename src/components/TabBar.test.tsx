import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabBar } from "@/components/TabBar";
import { expectNoAxeViolations } from "@/test/axe";

describe("TabBar", () => {
  it("is its own named landmark with a tab per section, in nav order", () => {
    render(<TabBar />);
    const bar = within(screen.getByRole("navigation", { name: "Sections" }));
    expect(bar.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["About", "#about"],
      ["Gallery", "#gallery"],
      ["Events", "#events"],
      ["Contact", "#contact"],
    ]);
  });

  it("keeps its icons out of the accessible names", () => {
    render(<TabBar />);
    expect(screen.getByRole("link", { name: "Gallery" })).toBeInTheDocument();
    for (const icon of document.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("clears the home indicator and hides from md up", () => {
    render(<TabBar />);
    const bar = screen.getByRole("navigation", { name: "Sections" });
    expect(bar.className).toContain("pb-[env(safe-area-inset-bottom)]");
    expect(bar.className).toContain("md:hidden");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<TabBar />);
    await expectNoAxeViolations(container);
  });
});
