import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";
import { expectNoAxeViolations } from "@/test/axe";

function desktopNav() {
  // Only the desktop nav is in the document until the phone menu opens.
  return within(screen.getByRole("navigation", { name: "Main navigation" }));
}

describe("Header", () => {
  it("has no phone menu: on phones the tab bar carries the links", () => {
    render(<Header />);
    expect(screen.queryByRole("button", { name: /menu/i })).toBeNull();
  });

  it("links every section, Contact included, by anchor", () => {
    render(<Header />);
    const links = desktopNav().getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["About", "#about"],
      ["Gallery", "#gallery"],
      ["Events", "#events"],
      ["Contact", "#contact"],
    ]);
  });

  it("names the brand link for screen readers", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /Coast to Coast Visual Arts Association — back to top/ }),
    ).toHaveAttribute("href", "#top");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<Header />);
    await expectNoAxeViolations(container);
  });
  it("fills the reading-progress line as the page scrolls", () => {
    let frame: FrameRequestCallback | null = null;
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 3000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    const { container } = render(<Header />);
    const bar = container.querySelector<HTMLElement>("header > [aria-hidden=true].origin-left")!;
    expect(bar.style.transform).toBe("scaleX(0)");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1000 });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      frame?.(0);
    });
    expect(bar.style.transform).toBe("scaleX(0.5)");
    raf.mockRestore();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });
});
