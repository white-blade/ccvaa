import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GallerySlider } from "@/components/GallerySlider";
import type { GalleryPhoto } from "@/lib/gallery";
import { expectNoAxeViolations } from "@/test/axe";

/** Credits on the first, nothing but alt text on the second, a caption only on the third. */
const photos: GalleryPhoto[] = [
  {
    file: "1.jpg",
    src: "/ccvaa/photos/1.jpg",
    alt: "Photograph number 1",
    description: "Caption one",
    author: "Ada Fieldhouse",
    takenAt: "2024-01-01",
  },
  { file: "2.jpg", src: "/ccvaa/photos/2.jpg", alt: "Photograph number 2" },
  { file: "3.jpg", src: "/ccvaa/photos/3.jpg", alt: "Photograph number 3", description: "Caption three" },
];

const INTERVAL = 6000;

const slide = () => screen.getByRole("group", { name: /^\d+ \/ \d+$/ });
const dots = () => within(screen.getByRole("list", { name: "Choose a photograph" })).getAllByRole("button");
const openViewer = () => screen.getByRole("button", { name: /View full size/ });

/** Points `matchMedia` at a reduced-motion preference, or none. */
function preferReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("GallerySlider: one photograph at a time", () => {
  it("shows only the current photograph, with its credits", () => {
    render(<GallerySlider photos={photos} />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(slide()).toHaveAccessibleName("1 / 3");
    expect(within(slide()).getByRole("img", { name: "Photograph number 1" })).toBeInTheDocument();
    expect(within(slide()).getByText("Ada Fieldhouse")).toBeInTheDocument();
    const time = within(slide()).getByText("January 1, 2024");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2024-01-01");
    expect(within(slide()).getByText("Caption one")).toBeInTheDocument();
  });

  it("looks right without credits: no empty author or date, the alt text as caption", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(screen.getByRole("button", { name: "Next photograph" }));
    expect(slide()).toHaveAccessibleName("2 / 3");
    expect(within(slide()).queryByText(/Photograph by/)).toBeNull();
    expect(slide().querySelector("time")).toBeNull();
    expect(within(slide()).getByText("Photograph number 2", { selector: "p" })).toBeInTheDocument();
  });

  it("steps with previous and next, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(screen.getByRole("button", { name: "Previous photograph" }));
    expect(slide()).toHaveAccessibleName("3 / 3");
    await user.click(screen.getByRole("button", { name: "Next photograph" }));
    expect(slide()).toHaveAccessibleName("1 / 3");
  });

  it("has a dot per photograph that jumps to it and marks the current one", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    expect(dots().map((dot) => dot.getAttribute("aria-label"))).toEqual([
      "Show photograph 1",
      "Show photograph 2",
      "Show photograph 3",
    ]);
    expect(dots()[0]).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "Show photograph 3" }));
    expect(slide()).toHaveAccessibleName("3 / 3");
    expect(dots()[2]).toHaveAttribute("aria-current", "true");
    expect(dots()[0]).not.toHaveAttribute("aria-current");
  });

  it("slides the photograph in from the side the visitor moved toward", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    const frame = () => slide().querySelector("[class*=animate-photo]");
    expect(frame()).toBeNull(); // the first is simply there
    await user.click(screen.getByRole("button", { name: "Next photograph" }));
    expect(frame()!.className).toContain("animate-photo-from-right");
    await user.click(screen.getByRole("button", { name: "Show photograph 1" }));
    expect(frame()!.className).toContain("animate-photo-from-left");
    // The credits move in by transform alone (caption-in), so their text never fades.
    expect(slide().querySelector("[data-credits]")).toHaveClass("motion-safe:animate-caption-in");
  });

  it("swipes left and right, and leaves vertical drags alone", () => {
    render(<GallerySlider photos={photos} />);
    const stage = slide().closest(".fx-tile")!;
    const drag = (dx: number, dy: number) => {
      fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 200 }] });
      fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] });
    };
    drag(-150, 5);
    expect(slide()).toHaveAccessibleName("2 / 3");
    drag(150, 5);
    expect(slide()).toHaveAccessibleName("1 / 3");
    drag(10, 200); // a scroll
    expect(slide()).toHaveAccessibleName("1 / 3");
  });

  it("fetches the next photograph ahead of time", () => {
    const setSrc = vi.spyOn(HTMLImageElement.prototype, "src", "set");
    render(<GallerySlider photos={photos} />);
    const requested = setSrc.mock.calls.map(([value]) => value);
    setSrc.mockRestore();
    expect(requested).toContain("/ccvaa/photos/2.jpg");
  });

  it("has no controls for a single photograph", () => {
    render(<GallerySlider photos={photos.slice(0, 1)} />);
    expect(screen.queryByRole("button", { name: /Next|Previous|slideshow/ })).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("has no detectable accessibility problems, slideshow or viewer", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<GallerySlider photos={photos} />);
    await expectNoAxeViolations(baseElement);
    await user.click(openViewer());
    await expectNoAxeViolations(baseElement);
  });
});

describe("GallerySlider: the slideshow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    preferReducedMotion(false);
  });

  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it("advances on its own and announces nothing while it does", () => {
    render(<GallerySlider photos={photos} />);
    expect(slide().parentElement).toHaveAttribute("aria-live", "off");
    advance(INTERVAL - 1);
    expect(slide()).toHaveAccessibleName("1 / 3");
    advance(1);
    expect(slide()).toHaveAccessibleName("2 / 3");
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("3 / 3");
  });

  it("gives a photograph chosen by hand its full time", () => {
    render(<GallerySlider photos={photos} />);
    advance(INTERVAL - 1000);
    fireEvent.click(screen.getByRole("button", { name: "Show photograph 3" }));
    advance(INTERVAL - 1);
    expect(slide()).toHaveAccessibleName("3 / 3");
    advance(1);
    expect(slide()).toHaveAccessibleName("1 / 3");
  });

  it("pauses and plays from its button, and announces changes while paused", () => {
    render(<GallerySlider photos={photos} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    expect(slide().parentElement).toHaveAttribute("aria-live", "polite");
    advance(INTERVAL * 3);
    expect(slide()).toHaveAccessibleName("1 / 3");

    fireEvent.click(screen.getByRole("button", { name: "Play slideshow" }));
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("2 / 3");
  });

  it("holds while a mouse rests on it, but not for a touch", () => {
    render(<GallerySlider photos={photos} />);
    const region = screen.getByRole("region", { name: "Gallery photographs" });
    fireEvent.pointerEnter(region, { pointerType: "mouse" });
    advance(INTERVAL * 2);
    expect(slide()).toHaveAccessibleName("1 / 3");
    fireEvent.pointerLeave(region, { pointerType: "mouse" });
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("2 / 3");

    fireEvent.pointerEnter(region, { pointerType: "touch" });
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("3 / 3");
  });

  it("holds while keyboard focus is inside it", () => {
    render(<GallerySlider photos={photos} />);
    const next = screen.getByRole("button", { name: "Next photograph" });
    vi.spyOn(next, "matches").mockReturnValue(true); // :focus-visible
    act(() => next.focus());
    advance(INTERVAL * 2);
    expect(slide()).toHaveAccessibleName("1 / 3");
    act(() => next.blur());
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("2 / 3");
  });

  it("holds while the viewer is open", () => {
    render(<GallerySlider photos={photos} />);
    fireEvent.click(openViewer());
    advance(INTERVAL * 2);
    expect(screen.getByRole("dialog", { name: "Photograph number 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("2 / 3");
  });

  it("holds while the tab is hidden", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    render(<GallerySlider photos={photos} />);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    advance(INTERVAL * 2);
    expect(slide()).toHaveAccessibleName("1 / 3");

    visibility.mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("2 / 3");
    visibility.mockRestore();
  });

  it("never starts on its own under reduced motion, but plays if asked", () => {
    preferReducedMotion(true);
    render(<GallerySlider photos={photos} />);
    advance(INTERVAL * 3);
    expect(slide()).toHaveAccessibleName("1 / 3");

    fireEvent.click(screen.getByRole("button", { name: "Play slideshow" }));
    advance(INTERVAL);
    expect(slide()).toHaveAccessibleName("2 / 3");
  });
});

describe("GallerySlider: the viewer", () => {
  it("opens on the current photograph and shows its author and date above the caption", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const dialog = screen.getByRole("dialog", { name: "Photograph number 1" });
    const credit = within(dialog).getByText("Ada Fieldhouse").closest("p")!;
    expect(credit).toHaveTextContent("Photograph by Ada Fieldhouse·Taken January 1, 2024");
    const caption = within(dialog).getByText("Caption one");
    expect(credit.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Shown whole, never cropped.
    expect(within(dialog).getByRole("img", { name: "Photograph number 1" })).toHaveClass("object-contain");
  });

  it("shows no credit line for a photograph without one", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(screen.getByRole("button", { name: "Show photograph 2" }));
    await user.click(openViewer());
    const dialog = screen.getByRole("dialog", { name: "Photograph number 2" });
    expect(within(dialog).queryByText(/Photograph by|Taken/)).toBeNull();
  });

  it("is fully usable from the keyboard: open, step through, close, focus back", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    const opener = openViewer();
    opener.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Photograph number 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Photograph number 2" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "Photograph number 3" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    // The slideshow followed along, and focus is back on the photograph.
    expect(slide()).toHaveAccessibleName("3 / 3");
    expect(openViewer()).toHaveFocus();
  });

  it("expands the photograph to the whole screen and back, from its button or the photograph", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const dialog = screen.getByRole("dialog", { name: "Photograph number 1" });
    const expand = within(dialog).getByRole("button", { name: "Expand photograph" });
    expect(expand).toHaveAttribute("aria-pressed", "false");

    await user.click(expand);
    expect(dialog).toHaveAttribute("data-expanded");
    const collapse = within(dialog).getByRole("button", { name: "Exit full view" });
    expect(collapse).toHaveAttribute("aria-pressed", "true");
    // Only the photograph: caption, credits, and thumbnails step aside.
    expect(within(dialog).queryByText("Caption one")).toBeNull();
    expect(within(dialog).queryByRole("list", { name: "All photographs" })).toBeNull();
    expect(within(dialog).getByRole("img", { name: "Photograph number 1" })).toHaveClass("object-contain");

    await user.click(collapse);
    expect(dialog).not.toHaveAttribute("data-expanded");
    expect(within(dialog).getByText("Caption one")).toBeVisible();

    // A click on the photograph itself toggles it too.
    await user.click(within(dialog).getByRole("img", { name: "Photograph number 1" }));
    expect(dialog).toHaveAttribute("data-expanded");
  });

  it("steps through photographs in full view, and Escape leaves full view before closing", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    await user.click(screen.getByRole("button", { name: "Expand photograph" }));

    await user.keyboard("{ArrowRight}");
    const dialog = screen.getByRole("dialog", { name: "Photograph number 2" });
    expect(dialog).toHaveAttribute("data-expanded");

    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    expect(dialog).not.toHaveAttribute("data-expanded");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps Tab inside the open viewer", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("shows every photograph as a thumbnail, marks the current one, and jumps to any", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const strip = within(screen.getByRole("list", { name: "All photographs" }));
    expect(strip.getAllByRole("button")).toHaveLength(3);
    expect(strip.getAllByRole("button")[0]).toHaveAttribute("aria-current", "true");
    await user.click(strip.getByRole("button", { name: "Show photograph 3" }));
    expect(screen.getByRole("dialog", { name: "Photograph number 3" })).toBeInTheDocument();
    expect(strip.getByRole("button", { name: "Show photograph 3" })).toHaveAttribute("aria-current", "true");
  });

  it("fetches the neighbouring photographs ahead of a step", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    const setSrc = vi.spyOn(HTMLImageElement.prototype, "src", "set");
    await user.click(openViewer());
    const requested = setSrc.mock.calls.map(([value]) => value);
    setSrc.mockRestore();
    expect(requested).toEqual(expect.arrayContaining(["/ccvaa/photos/2.jpg", "/ccvaa/photos/3.jpg"]));
  });

  it("slides the photograph in from the side the visitor moved toward", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const frame = () => screen.getByRole("dialog").querySelector("[class*=animate-photo]")!;
    expect(frame().className).toContain("animate-photo-in");
    await user.keyboard("{ArrowRight}");
    expect(frame().className).toContain("animate-photo-from-right");
    await user.keyboard("{ArrowLeft}");
    expect(frame().className).toContain("animate-photo-from-left");
  });

  it("closes on a swipe down", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const dialog = screen.getByRole("dialog");
    fireEvent.touchStart(dialog, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 205, clientY: 400 }] });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows keyboard hints to mouse users only", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(openViewer());
    const hint = screen.getByText(/to browse/);
    expect(hint).toHaveClass("hidden", "pointer-fine:inline");
    expect(hint).toHaveAttribute("aria-hidden", "true");
  });
});
