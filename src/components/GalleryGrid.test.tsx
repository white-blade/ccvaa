import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GalleryGrid } from "@/components/GalleryGrid";
import { expectNoAxeViolations } from "@/test/axe";

const photos = [1, 2, 3].map((n) => ({
  file: `${n}.jpg`,
  src: `/ccvaa/photos/${n}.jpg`,
  alt: `Photograph number ${n}`,
}));

beforeEach(() => {
  window.localStorage.clear();
});

describe("GalleryGrid", () => {
  it("is fully usable from the keyboard: open, step through, close", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);

    const [first] = screen.getAllByRole("button", { name: /View this photograph larger/ });
    first.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Photograph number 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Photograph number 2" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "Photograph number 3" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(first).toHaveFocus();
  });

  it("keeps Tab inside the open viewer", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);

    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("changes the photos per row and says which is chosen", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    const four = screen.getByRole("button", { name: "4" });
    await user.click(four);
    expect(four).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute("aria-pressed", "false");
  });

  it("has no detectable accessibility problems, grid or viewer", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<GalleryGrid photos={photos} />);
    await expectNoAxeViolations(baseElement);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);
    await expectNoAxeViolations(baseElement);
  });

  it("shows every photograph as a thumbnail, marks the current one, and jumps to any", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);

    const strip = within(screen.getByRole("list", { name: "All photographs" }));
    const thumbs = strip.getAllByRole("button");
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");

    await user.click(strip.getByRole("button", { name: "Show photograph 3" }));
    expect(screen.getByRole("dialog", { name: "Photograph number 3" })).toBeInTheDocument();
    expect(strip.getByRole("button", { name: "Show photograph 3" })).toHaveAttribute("aria-current", "true");
  });

  it("slides the photograph in from the side the visitor moved toward", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);
    const frame = () => screen.getByRole("dialog").querySelector("[class*=animate-photo]")!;

    expect(frame().className).toContain("animate-photo-in");
    await user.keyboard("{ArrowRight}");
    expect(frame().className).toContain("animate-photo-from-right");
    await user.keyboard("{ArrowLeft}");
    expect(frame().className).toContain("animate-photo-from-left");
  });

  it("fetches the neighbouring photographs ahead of a step", async () => {
    const setSrc = vi.spyOn(HTMLImageElement.prototype, "src", "set");
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);
    const requested = setSrc.mock.calls.map(([value]) => value);
    setSrc.mockRestore();
    // Opening the first: the next (2) and, wrapping, the previous (3).
    expect(requested).toEqual(expect.arrayContaining(["/ccvaa/photos/2.jpg", "/ccvaa/photos/3.jpg"]));
  });

  it("closes on a swipe down", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.touchStart(dialog, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 205, clientY: 400 }] });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows keyboard hints to mouse users only", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={photos} />);
    await user.click(screen.getAllByRole("button", { name: /View this photograph larger/ })[0]);
    const hint = screen.getByText(/to browse/);
    expect(hint).toHaveClass("hidden", "pointer-fine:inline");
    expect(hint).toHaveAttribute("aria-hidden", "true");
  });
});
