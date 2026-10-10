import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SectionLinks } from "@/components/SectionLinks";
import { scrollToSection } from "@/lib/scroll-to-section";

vi.mock("@/lib/scroll-to-section", () => ({ scrollToSection: vi.fn() }));

beforeEach(() => {
  vi.mocked(scrollToSection).mockReset().mockReturnValue(true);
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
});
