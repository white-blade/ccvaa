import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

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
});
