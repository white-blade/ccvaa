import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SECTION_GLIDE_EVENT } from "@/lib/scroll-to-section";
import { useActiveSection } from "@/lib/use-active-section";

const IDS = ["about", "gallery", "events", "contact"];

/** jsdom has no IntersectionObserver; this one lets a test say what is in view. */
let observerCallback: IntersectionObserverCallback = () => {};
class FakeObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
}

function crossMiddle(id: string) {
  act(() => {
    observerCallback(
      [{ isIntersecting: true, target: document.getElementById(id)! } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

function scrollPage(y: number, { pageHeight = 5000, viewport = 900 } = {}) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: viewport });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: pageHeight });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

function glide(target: string | null, gliding: boolean) {
  act(() => {
    window.dispatchEvent(new CustomEvent(SECTION_GLIDE_EVENT, { detail: { target, gliding } }));
  });
}

function Probe() {
  return <output>{useActiveSection(IDS) ?? "hero"}</output>;
}

beforeEach(() => {
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeObserver;
  for (const id of IDS) {
    const section = document.createElement("section");
    section.id = id;
    section.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    document.body.append(section);
  }
  scrollPage(0);
  render(<Probe />);
});

afterEach(() => {
  delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  document.querySelectorAll("section").forEach((section) => section.remove());
});

describe("useActiveSection", () => {
  it("marks nothing before the visitor scrolls, even if a section is mid-screen", () => {
    crossMiddle("about");
    expect(screen.getByRole("status")).toHaveTextContent("hero");
  });

  it("reports the section crossing the middle of the screen", () => {
    scrollPage(1200);
    crossMiddle("gallery");
    expect(screen.getByRole("status")).toHaveTextContent("gallery");
  });

  it("marks the last section at the end of the page, even if it never reaches the middle", () => {
    scrollPage(3000);
    crossMiddle("events");
    scrollPage(4100); // 4100 + 900 = the 5000px page's end
    expect(screen.getByRole("status")).toHaveTextContent("contact");
    crossMiddle("events"); // a late observer report cannot undo it
    expect(screen.getByRole("status")).toHaveTextContent("contact");
  });

  it("holds the destination for a whole glide, then follows the page again", () => {
    scrollPage(1200);
    crossMiddle("about");
    glide("contact", true);
    crossMiddle("gallery"); // passed on the way
    crossMiddle("events");
    expect(screen.getByRole("status")).toHaveTextContent("contact");
    glide("contact", false);
    expect(screen.getByRole("status")).toHaveTextContent("events");
  });

  it("shows the hero for a glide to the top", () => {
    scrollPage(1200);
    crossMiddle("events");
    glide(null, true);
    expect(screen.getByRole("status")).toHaveTextContent("hero");
  });

  it("ignores glides to things that are not sections (the skip link's #main)", () => {
    scrollPage(1200);
    crossMiddle("gallery");
    glide("main", true);
    expect(screen.getByRole("status")).toHaveTextContent("gallery");
  });
});
