import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";
import { expectNoAxeViolations } from "@/test/axe";

function desktopNav() {
  // Only the desktop nav is in the document until the phone menu opens.
  return within(screen.getByRole("navigation", { name: "Main navigation" }));
}

describe("Header", () => {
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

  it("opens and closes the phone menu from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Close menu");
    const menu = document.getElementById("mobile-menu")!;
    expect(within(menu).getByRole("link", { name: /Contact/ })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(document.getElementById("mobile-menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  it("closes the phone menu once a link is chosen", async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(within(document.getElementById("mobile-menu")!).getByRole("link", { name: /Events/ }));
    expect(document.getElementById("mobile-menu")).toBeNull();
  });

  it("names the brand link for screen readers", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /Coast to Coast Visual Arts Association — back to top/ }),
    ).toHaveAttribute("href", "#top");
  });

  it("has no detectable accessibility problems, menu closed or open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Header />);
    await expectNoAxeViolations(container);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await expectNoAxeViolations(container);
  });

  it("closes the phone menu on a tap outside the header, not inside it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Header />
        <p>Page content</p>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.pointerDown(document.getElementById("mobile-menu")!);
    expect(document.getElementById("mobile-menu")).not.toBeNull();

    fireEvent.pointerDown(screen.getByText("Page content"));
    expect(document.getElementById("mobile-menu")).toBeNull();
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
