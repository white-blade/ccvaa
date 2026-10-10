import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SectionLinks } from "@/components/SectionLinks";
import { scrollToSection } from "@/lib/scroll-to-section";

vi.mock("@/lib/scroll-to-section", () => ({
  scrollToSection: vi.fn(),
  SECTION_GLIDE_EVENT: "ccvaa:section-glide",
}));

beforeEach(() => {
  vi.mocked(scrollToSection).mockReset().mockReturnValue(true);
  window.history.replaceState(null, "", "/");
  render(
    <>
      <SectionLinks />
      <a href="#events">
        <span>Events</span>
      </a>
      <a href="https://example.com/">Elsewhere</a>
    </>,
  );
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("SectionLinks", () => {
  it("routes in-page links through the glide and stops the browser's jump", () => {
    const click = fireEvent.click(screen.getByText("Events"));
    expect(scrollToSection).toHaveBeenCalledWith("#events");
    expect(click).toBe(false); // default prevented
  });

  it("leaves other links alone", () => {
    fireEvent.click(screen.getByText("Elsewhere"));
    expect(scrollToSection).not.toHaveBeenCalled();
  });

  it("leaves modified clicks to the browser (new tab, new window)", () => {
    fireEvent.click(screen.getByText("Events"), { metaKey: true });
    fireEvent.click(screen.getByText("Events"), { ctrlKey: true });
    expect(scrollToSection).not.toHaveBeenCalled();
  });

  it("lets the browser follow the link when there is no such section", () => {
    vi.mocked(scrollToSection).mockReturnValue(false);
    expect(fireEvent.click(screen.getByText("Events"))).toBe(true);
  });

  it("glides on Back and Forward without adding history", () => {
    window.history.replaceState(null, "", "/#gallery");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(scrollToSection).toHaveBeenCalledWith("#gallery", { history: "none" });
  });

  it("takes over scroll restoration, so the browser does not snap first", () => {
    expect(window.history.scrollRestoration).toBe("manual");
  });
});
