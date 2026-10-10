import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { glideTo, scrollToSection, SECTION_GLIDE_EVENT } from "@/lib/scroll-to-section";

/** jsdom has no layout: place the section by stubbing its box and the window. */
function addSection(id: string, top: number) {
  const section = document.createElement("section");
  section.id = id;
  section.tabIndex = -1;
  section.getBoundingClientRect = () => ({ top: top - window.scrollY }) as DOMRect;
  document.body.append(section);
  return section;
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as never;
}

let scrollY = 0;
let frames: FrameRequestCallback[] = [];
let now = 0;

/** Runs animation frames, advancing the clock, until the glide stops asking. */
function flushFrames(stepMs = 16, limit = 500) {
  for (let i = 0; i < limit && frames.length; i++) {
    now += stepMs;
    const queued = frames;
    frames = [];
    queued.forEach((frame) => frame(now));
  }
}

beforeEach(() => {
  scrollY = 0;
  frames = [];
  now = 0;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  window.scrollTo = vi.fn((options: ScrollToOptions) => {
    scrollY = options.top ?? scrollY;
  }) as never;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((frame) => {
    frames.push(frame);
    return frames.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    frames = [];
  });
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.useFakeTimers({ toFake: ["setTimeout"] });
});

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("scrollToSection", () => {
  it("leaves unknown anchors to the browser", () => {
    setReducedMotion(false);
    expect(scrollToSection("#nowhere")).toBe(false);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("still glides when the first frame comes late, instead of jumping to the end", () => {
    setReducedMotion(false);
    addSection("events", 2000);
    scrollToSection("#events");
    // A busy device paints its first frame long after the glide was asked for.
    now += 5000;
    flushFrames(200);

    const tops = vi.mocked(window.scrollTo).mock.calls.map(([options]) => (options as ScrollToOptions).top!);
    expect(tops[0]).toBe(0);
    expect(tops.some((top) => top > 200 && top < 1800)).toBe(true);
    expect(tops.at(-1)).toBe(2000);
  });

  it("lands on the section even when the page above it grows during the glide", () => {
    setReducedMotion(false);
    let top = 2000;
    const section = addSection("gallery", 0);
    section.getBoundingClientRect = () => ({ top: top - window.scrollY }) as DOMRect;
    scrollToSection("#gallery");
    flushFrames(16, 10);
    top = 2600; // a picture above finished loading
    flushFrames();

    const tops = vi.mocked(window.scrollTo).mock.calls.map(([options]) => (options as ScrollToOptions).top!);
    expect(tops.at(-1)).toBe(2600);
  });

  it("glides with easing and lands exactly on the section", () => {
    setReducedMotion(false);
    addSection("events", 2000);

    expect(scrollToSection("#events")).toBe(true);
    flushFrames();

    const tops = vi.mocked(window.scrollTo).mock.calls.map(([options]) => (options as ScrollToOptions).top!);
    expect(tops.length).toBeGreaterThan(10);
    expect(tops.at(-1)).toBe(2000);
    // Eased: the first and last steps are much smaller than the middle ones.
    const steps = tops.map((top, i) => top - (tops[i - 1] ?? 0)).slice(1);
    const middle = steps[Math.floor(steps.length / 2)];
    expect(steps[0]).toBeLessThan(middle / 4);
    expect(steps.at(-1)!).toBeLessThan(middle / 4);
  });

  it("stops under the fixed header, honouring scroll-margin-top", () => {
    setReducedMotion(true);
    const section = addSection("gallery", 1500);
    section.style.scrollMarginTop = "80px";
    scrollToSection("#gallery");
    expect(scrollY).toBe(1420);
  });

  it("jumps instantly when the visitor prefers reduced motion", () => {
    setReducedMotion(true);
    addSection("contact", 3000);
    scrollToSection("#contact");
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollY).toBe(3000);
  });

  it("moves focus to the section and marks its arrival briefly", () => {
    setReducedMotion(true);
    const section = addSection("about", 900);
    scrollToSection("#about");

    expect(section).toHaveFocus();
    expect(section).toHaveAttribute("data-arrived");
    vi.advanceTimersByTime(1500);
    expect(section).not.toHaveAttribute("data-arrived");
  });

  it("records the section in the address bar for back and share", () => {
    setReducedMotion(true);
    addSection("events", 100);
    scrollToSection("#events");
    expect(window.location.hash).toBe("#events");
  });

  it("goes to the very top for #top, leaving a bare URL rather than #top", () => {
    setReducedMotion(true);
    window.history.replaceState(null, "", "/#events");
    scrollY = 1234;
    expect(scrollToSection("#top")).toBe(true);
    expect(scrollY).toBe(0);
    expect(window.location.hash).toBe("");
  });

  it("announces the destination when a glide starts and when it settles", () => {
    setReducedMotion(false);
    addSection("events", 2000);
    const seen: unknown[] = [];
    const listen = (event: Event) => seen.push((event as CustomEvent).detail);
    window.addEventListener(SECTION_GLIDE_EVENT, listen);

    scrollToSection("#events");
    expect(seen).toEqual([{ target: "events", gliding: true }]);
    flushFrames();
    // Landed, but holding the section in place for a moment before settling.
    expect(seen).toEqual([{ target: "events", gliding: true }]);
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([
      { target: "events", gliding: true },
      { target: "events", gliding: false, arrived: true },
    ]);
    window.removeEventListener(SECTION_GLIDE_EVENT, listen);
  });

  it("still arrives when the browser stops giving it frames", () => {
    setReducedMotion(false);
    const section = addSection("events", 2000);
    scrollToSection("#events");
    // No frame ever runs.
    vi.advanceTimersByTime(1100 + 400);
    expect(scrollY).toBe(2000);
    expect(document.activeElement).toBe(section);
    expect(section).toHaveAttribute("data-arrived");
  });

  describe("after landing", () => {
    let resized: (() => void) | null = null;
    beforeEach(() => {
      resized = null;
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect() {
          resized = null;
        }
      };
    });
    afterEach(() => {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    });

    function landOn(id: string, top: () => number) {
      setReducedMotion(false);
      const section = addSection(id, 0);
      section.getBoundingClientRect = () => ({ top: top() - window.scrollY }) as DOMRect;
      scrollToSection(`#${id}`);
      flushFrames();
    }

    it("holds the section in place when the page above it shifts", () => {
      let top = 2000;
      landOn("gallery", () => top);
      expect(scrollY).toBe(2000);
      top = 2240; // a picture above finished loading
      resized?.();
      expect(scrollY).toBe(2240);
    });

    it("lets go after a moment, or at once when the visitor scrolls", () => {
      let top = 2000;
      landOn("gallery", () => top);
      window.dispatchEvent(new Event("wheel"));
      top = 2240;
      resized?.();
      expect(scrollY).toBe(2000);
    });

    it("stops holding once the page has settled", () => {
      landOn("gallery", () => 2000);
      vi.advanceTimersByTime(1000);
      expect(resized).toBeNull();
    });
  });

  it("announces the end of a glide the visitor cancels, too", () => {
    setReducedMotion(false);
    addSection("events", 4000);
    const seen: unknown[] = [];
    const listen = (event: Event) => seen.push((event as CustomEvent).detail);
    window.addEventListener(SECTION_GLIDE_EVENT, listen);
    scrollToSection("#events");
    flushFrames(16, 3);
    window.dispatchEvent(new Event("wheel"));
    expect(seen.at(-1)).toEqual({ target: "events", gliding: false, arrived: false });
    window.removeEventListener(SECTION_GLIDE_EVENT, listen);
  });

  it("adds no history entry for Back/Forward glides", () => {
    setReducedMotion(true);
    addSection("gallery", 500);
    const before = window.history.length;
    scrollToSection("#gallery", { history: "none" });
    expect(window.history.length).toBe(before);
  });

  it("gives way the moment the visitor scrolls themselves", () => {
    setReducedMotion(false);
    const section = addSection("events", 4000);
    scrollToSection("#events");
    flushFrames(16, 5);
    const reached = scrollY;

    window.dispatchEvent(new Event("wheel"));
    flushFrames();
    expect(scrollY).toBe(reached);
    expect(section).not.toHaveAttribute("data-arrived");
  });

  it("replaces a glide in progress with a new one", () => {
    setReducedMotion(false);
    addSection("gallery", 1000);
    addSection("contact", 5000);
    scrollToSection("#gallery");
    flushFrames(16, 3);
    scrollToSection("#contact");
    flushFrames();
    expect(scrollY).toBe(5000);
  });
});

describe("glideTo", () => {
  it("brings an element to the given offset below the top, then focuses it", () => {
    setReducedMotion(false);
    const card = addSection("card", 2400);
    glideTo(card, 150);
    flushFrames();
    expect(scrollY).toBe(2250);
    expect(card).toHaveFocus();
  });

  it("never asks for a negative scroll position", () => {
    setReducedMotion(true);
    const card = addSection("near-top", 40);
    glideTo(card, 150);
    expect(scrollY).toBe(0);
  });

  it("shares the glide: a section link takes over from a card glide", () => {
    setReducedMotion(false);
    const card = addSection("card", 3000);
    addSection("contact", 6000);
    glideTo(card, 100);
    flushFrames(16, 3);
    scrollToSection("#contact");
    flushFrames();
    expect(scrollY).toBe(6000);
    expect(card).not.toHaveFocus();
  });
});
