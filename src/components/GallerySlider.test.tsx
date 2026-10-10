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
const dots = () => within(screen.getByRole("list", { name: "Choose a work" })).getAllByRole("button");
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
    await user.click(screen.getByRole("button", { name: "Next work" }));
    expect(slide()).toHaveAccessibleName("2 / 3");
    expect(within(slide()).queryByText(/Photograph by/)).toBeNull();
    expect(slide().querySelector("time")).toBeNull();
    expect(within(slide()).getByText("Photograph number 2", { selector: "p" })).toBeInTheDocument();
  });

  it("steps with previous and next, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(screen.getByRole("button", { name: "Previous work" }));
    expect(slide()).toHaveAccessibleName("3 / 3");
    await user.click(screen.getByRole("button", { name: "Next work" }));
    expect(slide()).toHaveAccessibleName("1 / 3");
  });

  it("has a dot per photograph that jumps to it and marks the current one", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    expect(dots().map((dot) => dot.getAttribute("aria-label"))).toEqual([
      "Show work 1",
      "Show work 2",
      "Show work 3",
    ]);
    expect(dots()[0]).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "Show work 3" }));
    expect(slide()).toHaveAccessibleName("3 / 3");
    expect(dots()[2]).toHaveAttribute("aria-current", "true");
    expect(dots()[0]).not.toHaveAttribute("aria-current");
  });

  it("slides the photograph in from the side the visitor moved toward", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    const frame = () => slide().querySelector("[class*=animate-photo]");
    expect(frame()).toBeNull(); // the first is simply there
    await user.click(screen.getByRole("button", { name: "Next work" }));
    expect(frame()!.className).toContain("animate-photo-from-right");
    await user.click(screen.getByRole("button", { name: "Show work 1" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Show work 3" }));
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
    const region = screen.getByRole("region", { name: "Gallery of works" });
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
    const next = screen.getByRole("button", { name: "Next work" });
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
    expect(credit).toHaveTextContent("By Ada Fieldhouse·Made January 1, 2024");
    const caption = within(dialog).getByText("Caption one");
    expect(credit.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Shown whole, never cropped.
    expect(within(dialog).getByRole("img", { name: "Photograph number 1" })).toHaveClass("object-contain");
  });

  it("shows no credit line for a photograph without one", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={photos} />);
    await user.click(screen.getByRole("button", { name: "Show work 2" }));
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
    const expand = within(dialog).getByRole("button", { name: "Expand image" });
    expect(expand).toHaveAttribute("aria-pressed", "false");

    await user.click(expand);
    expect(dialog).toHaveAttribute("data-expanded");
    const collapse = within(dialog).getByRole("button", { name: "Exit full view" });
    expect(collapse).toHaveAttribute("aria-pressed", "true");
    // Only the photograph: caption, credits, and thumbnails step aside.
    expect(within(dialog).queryByText("Caption one")).toBeNull();
    expect(within(dialog).queryByRole("list", { name: "All works" })).toBeNull();
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
    await user.click(screen.getByRole("button", { name: "Expand image" }));

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
    const strip = within(screen.getByRole("list", { name: "All works" }));
    expect(strip.getAllByRole("button")).toHaveLength(3);
    expect(strip.getAllByRole("button")[0]).toHaveAttribute("aria-current", "true");
    await user.click(strip.getByRole("button", { name: "Show work 3" }));
    expect(screen.getByRole("dialog", { name: "Photograph number 3" })).toBeInTheDocument();
    expect(strip.getByRole("button", { name: "Show work 3" })).toHaveAttribute("aria-current", "true");
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

describe("GallerySlider: a large gallery", () => {
  const many: GalleryPhoto[] = Array.from({ length: 20 }, (_, i) => ({
    file: `w${i + 1}`,
    src: `/ccvaa/photos/w${i + 1}-lg.avif`,
    alt: `Work number ${i + 1}`,
  }));

  /** The dots a wide screen shows (jsdom applies no CSS, so read the window marks). */
  const wideDots = () => dots().filter((dot) => dot.closest("li")!.getAttribute("data-dot-scale") !== "hidden");
  const narrowDots = () => dots().filter((dot) => dot.closest("li")!.getAttribute("data-dot-narrow") !== "hidden");
  const labels = (buttons: HTMLElement[]) => buttons.map((dot) => dot.getAttribute("aria-label"));
  const currentSlot = (buttons: HTMLElement[]) => buttons.findIndex((dot) => dot.getAttribute("aria-current") === "true");

  it("moves the highlight along the dots as the visitor steps, sliding the window only near its edge", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    const next = screen.getByRole("button", { name: "Next work" });
    expect(wideDots()).toHaveLength(7);

    // Works 1 to 6: the window holds still and the highlight travels across it.
    const slots: number[] = [currentSlot(wideDots())];
    for (let i = 0; i < 5; i++) {
      await user.click(next);
      slots.push(currentSlot(wideDots()));
    }
    expect(slots).toEqual([0, 1, 2, 3, 4, 5]);
    expect(labels(wideDots())[0]).toBe("Show work 1");

    // Work 7 would reach the last dot: the window slides, one dot still ahead.
    await user.click(next);
    expect(slide()).toHaveAccessibleName("7 / 20");
    expect(labels(wideDots())).toEqual([2, 3, 4, 5, 6, 7, 8].map((n) => `Show work ${n}`));
    expect(currentSlot(wideDots())).toBe(5);

    // Stepping back moves the highlight back without sliding, until the first dot.
    await user.click(screen.getByRole("button", { name: "Previous work" }));
    expect(labels(wideDots())[0]).toBe("Show work 2");
    expect(currentSlot(wideDots())).toBe(4);
  });

  it("starts a jump's window one before the work: jump to the 11th and the dots run 10 to 16", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    await user.click(openViewer());
    await user.click(within(screen.getByRole("list", { name: "All works" })).getByRole("button", { name: "Show work 11" }));
    await user.keyboard("{Escape}");
    expect(slide()).toHaveAccessibleName("11 / 20");
    expect(labels(wideDots())).toEqual([10, 11, 12, 13, 14, 15, 16].map((n) => `Show work ${n}`));
  });

  it("keeps a narrower window of five for small screens, always holding the current work", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    const next = screen.getByRole("button", { name: "Next work" });
    for (let i = 0; i < 12; i++) {
      await user.click(next);
      expect(narrowDots()).toHaveLength(5);
      expect(wideDots()).toHaveLength(7);
      expect(currentSlot(narrowDots())).toBeGreaterThanOrEqual(0);
      // Each window is hidden only at its own breakpoint.
      for (const dot of dots()) {
        const li = dot.closest("li")!;
        expect(li.classList.contains("max-sm:hidden")).toBe(li.getAttribute("data-dot-narrow") === "hidden");
        expect(li.classList.contains("sm:hidden")).toBe(li.getAttribute("data-dot-scale") === "hidden");
      }
    }
  });

  it("draws the edge dots smaller where more works lie beyond", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    await user.click(screen.getByRole("button", { name: "Show work 4" }));
    await user.click(screen.getByRole("button", { name: "Show work 7" }));
    // A jump to the 7th: the window runs 6-12, the 6th (more behind it) small, the current full.
    const scales = wideDots().map((dot) => dot.closest("li")!.getAttribute("data-dot-scale"));
    expect(scales).toEqual(["small", "full", "full", "full", "full", "medium", "small"]);
  });


  it("wraps from the last work to the first, the window following", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    await user.click(screen.getByRole("button", { name: "Previous work" }));
    expect(slide()).toHaveAccessibleName("20 / 20");
    expect(screen.getByRole("button", { name: "Show work 20" })).toHaveAttribute("aria-current", "true");
    expect(screen.queryByRole("button", { name: "Show work 1" })).toBeNull();
  });
});

describe("GallerySlider: progressive pictures and credits", () => {
  const prepared: GalleryPhoto[] = [
    {
      file: "dock",
      src: "/ccvaa/photos/dock-lg.avif",
      srcSet: "/ccvaa/photos/dock-sm.avif 640w, /ccvaa/photos/dock-md.avif 1280w, /ccvaa/photos/dock-lg.avif 1920w",
      width: 1920,
      height: 1280,
      blurDataURL: "data:image/webp;base64,AAAA",
      alt: "A dock",
      author: "Ada Fieldhouse",
      takenAt: "2024-01-01",
      medium: "Photograph",
      license: { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
      source: "https://commons.wikimedia.org/wiki/File:Dock.jpg",
    },
    { file: "bench", src: "/ccvaa/photos/bench-lg.avif", alt: "A bench" },
  ];

  it("offers every prepared size, so a phone fetches a phone-sized file", () => {
    render(<GallerySlider photos={prepared} />);
    const image = within(slide()).getByRole("img", { name: "A dock" });
    expect(image).toHaveAttribute("srcset", prepared[0].srcSet);
    expect(image).toHaveAttribute("sizes", "(min-width: 1280px) 76rem, 100vw");
    expect(image).toHaveAttribute("width", "1920");
    expect(image).toHaveAttribute("height", "1280");
    // The first slide is wanted at once; it is what the visitor sees.
    expect(image).toHaveAttribute("loading", "eager");
  });

  it("shows the blurred preview until the picture loads, then fades the picture in", () => {
    render(<GallerySlider photos={prepared} />);
    const image = within(slide()).getByRole("img", { name: "A dock" });
    const frame = image.parentElement!;
    expect(frame.style.backgroundImage).toContain("data:image/webp;base64,AAAA");
    expect(image).toHaveClass("[html.js_&]:opacity-0");

    fireEvent.load(image);
    expect(frame).toHaveAttribute("data-picture-loaded");
    expect(frame.style.backgroundImage).toBe("");
    expect(image).toHaveClass("opacity-100");
  });

  it("uncovers a picture that fails to load, so its alt text shows", () => {
    render(<GallerySlider photos={prepared} />);
    const image = within(slide()).getByRole("img", { name: "A dock" });
    fireEvent.error(image);
    expect(image).toHaveClass("opacity-100");
  });

  it("names the medium with the date, and links the licence and the source in a new tab", () => {
    render(<GallerySlider photos={prepared} />);
    expect(within(slide()).getByText("Photograph")).toBeInTheDocument();
    const licence = within(slide()).getByRole("link", { name: "CC BY-SA 4.0" });
    expect(licence).toHaveAttribute("href", "https://creativecommons.org/licenses/by-sa/4.0/");
    expect(licence).toHaveAttribute("target", "_blank");
    expect(licence.getAttribute("rel")).toContain("license");
    const source = within(slide()).getByRole("link", { name: /^Source \(opens in a new tab\)/ });
    expect(source).toHaveAttribute("href", prepared[0].source);
    expect(source.getAttribute("rel")).toContain("noopener");
  });

  it("shows no licence line for the association's own work", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={prepared} />);
    await user.click(screen.getByRole("button", { name: "Next work" }));
    expect(within(slide()).queryByRole("link")).toBeNull();
  });

  it("credits the work in the viewer too", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={prepared} />);
    await user.click(openViewer());
    const dialog = screen.getByRole("dialog", { name: "A dock" });
    expect(within(dialog).getByRole("link", { name: "CC BY-SA 4.0" })).toBeInTheDocument();
    expect(within(dialog).getByText(/Photograph/)).toBeInTheDocument();
    // The viewer shows the work whole, at the size the screen needs.
    const image = within(dialog).getByRole("img", { name: "A dock" });
    expect(image).toHaveClass("object-contain");
    expect(image).toHaveAttribute("sizes", "100vw");
  });

  it("has no detectable accessibility problems with credits and links", async () => {
    const { container } = render(<GallerySlider photos={prepared} />);
    await expectNoAxeViolations(container);
  });
});

describe("GallerySlider: first and last", () => {
  const many: GalleryPhoto[] = Array.from({ length: 12 }, (_, i) => ({
    file: `w${i + 1}`,
    src: `/ccvaa/photos/w${i + 1}-lg.avif`,
    alt: `Work number ${i + 1}`,
  }));

  it("jumps to the last work and back to the first", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    await user.click(screen.getByRole("button", { name: "Last work" }));
    expect(slide()).toHaveAccessibleName("12 / 12");
    expect(screen.getByRole("button", { name: "Show work 12" })).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "First work" }));
    expect(slide()).toHaveAccessibleName("1 / 12");
    expect(screen.getByRole("button", { name: "Show work 1" })).toHaveAttribute("aria-current", "true");
  });

  it("marks the button for the end already reached as unavailable, and does nothing on it", async () => {
    const user = userEvent.setup();
    render(<GallerySlider photos={many} />);
    const first = screen.getByRole("button", { name: "First work" });
    const last = screen.getByRole("button", { name: "Last work" });
    expect(first).toHaveAttribute("aria-disabled", "true");
    expect(last).toHaveAttribute("aria-disabled", "false");

    await user.click(first);
    expect(slide()).toHaveAccessibleName("1 / 12");
    // Still focusable, so focus is not lost when an end is reached.
    expect(first).not.toBeDisabled();

    await user.click(last);
    expect(last).toHaveAttribute("aria-disabled", "true");
    expect(first).toHaveAttribute("aria-disabled", "false");
  });

  it("orders the controls first, previous, dots, next, last", () => {
    render(<GallerySlider photos={many} />);
    // The list sits on its track, a direct child of the row.
    const row = screen.getByRole("list", { name: "Choose a work" }).parentElement!.parentElement!;
    const names = [...row.querySelectorAll(":scope > button, :scope > * > ol")].map(
      (el) => el.getAttribute("aria-label"),
    );
    expect(names).toEqual(["First work", "Previous work", "Choose a work", "Next work", "Last work"]);
  });

  it("has no buttons to step with for a single work", () => {
    render(<GallerySlider photos={many.slice(0, 1)} />);
    expect(screen.queryByRole("button", { name: "First work" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Last work" })).toBeNull();
  });
});

describe("GallerySlider: dot previews", () => {
  const peek = () => document.querySelector("[data-dot-peek]");

  it("lifts a preview of the work above a dot under the mouse, and drops it on leaving", () => {
    render(<GallerySlider photos={photos} />);
    const third = screen.getByRole("button", { name: "Show work 3" });
    fireEvent.pointerEnter(third, { pointerType: "mouse" });
    expect(peek()).toHaveAttribute("aria-hidden", "true");
    expect(peek()).toHaveTextContent(/^03/);
    expect(peek()!.querySelector("img")).toHaveAttribute("src", photos[2].src);

    fireEvent.pointerLeave(third, { pointerType: "mouse" });
    expect(peek()).toBeNull();
  });

  it("shows none for a touch, or for the work already on the stage", () => {
    render(<GallerySlider photos={photos} />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Show work 2" }), { pointerType: "touch" });
    expect(peek()).toBeNull();
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Show work 1" }), { pointerType: "mouse" });
    expect(peek()).toBeNull();
  });
});

describe("GallerySlider: the slideshow's countdown and drift", () => {
  it("shows a progress line, restarted for each work, only while the slideshow runs", () => {
    vi.useFakeTimers();
    preferReducedMotion(false);
    render(<GallerySlider photos={photos} />);
    const line = () => document.querySelector("[data-slide-progress]");
    expect(line()).toHaveStyle({ animationDuration: "6s" });
    const first = line();

    act(() => {
      vi.advanceTimersByTime(INTERVAL);
    });
    expect(slide()).toHaveAccessibleName("2 / 3");
    // A new line for the new work: the count starts again from empty.
    expect(line()).not.toBe(first);

    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    expect(line()).toBeNull();
  });

  it("counts down inside the pill that marks the current dot, and the pill turns solid on pause", () => {
    vi.useFakeTimers();
    preferReducedMotion(false);
    render(<GallerySlider photos={photos} />);
    const pill = () => document.querySelector("[data-dot-pill]")!;
    expect(pill()).toHaveAttribute("aria-hidden", "true");
    expect(pill().querySelector("[data-slide-progress]")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    expect(pill().querySelector("[data-slide-progress]")).toBeNull();
    expect(pill().querySelector(".bg-coral")).not.toBeNull();
  });

  it("drifts the current work slowly closer, only where motion is welcome", () => {
    render(<GallerySlider photos={photos} />);
    const drift = within(slide()).getByRole("img").closest("[data-slow-zoom]")!;
    expect(drift).toHaveClass("motion-safe:animate-slow-zoom");
  });
});
