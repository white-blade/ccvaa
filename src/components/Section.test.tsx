import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { navigation, sectionNumber } from "@/lib/site";
import { expectNoAxeViolations } from "@/test/axe";

describe("sectionNumber", () => {
  it("numbers sections by their place in the nav", () => {
    expect(navigation.map((item) => sectionNumber(item.id))).toEqual(["01", "02", "03", "04"]);
  });
});

describe("Section", () => {
  it("is a region named by its heading, reachable by focus, with its number", () => {
    render(
      <Section id="events" eyebrow="What’s on" title="Events" description="Things to do.">
        <p>Body</p>
      </Section>,
    );
    const region = screen.getByRole("region", { name: "Events" });
    expect(region).toHaveAttribute("id", "events");
    expect(region).toHaveAttribute("tabindex", "-1");
    expect(region).toHaveTextContent("03");
    expect(region).toHaveTextContent("Things to do.");
    expect(region).toHaveTextContent("Body");
  });

  it("has no detectable accessibility problems in any tone", async () => {
    for (const tone of ["light", "mist", "dark"] as const) {
      const { container, unmount } = render(
        <Section id="about" tone={tone} eyebrow="Who we are" title="About" glow>
          <p>Body</p>
        </Section>,
      );
      await expectNoAxeViolations(container);
      unmount();
    }
  });
});

describe("Section scroll effects", () => {
  it("adds a decorative ghost numeral behind the heading", () => {
    const { container } = render(
      <Section id="gallery" tone="dark" eyebrow="The collection" title="Gallery">
        <p>Body</p>
      </Section>,
    );
    const ghost = container.querySelector(".section-ghost")!;
    // Drawn by CSS from the attribute: no text for screen readers or contrast checks.
    expect(ghost).toHaveAttribute("data-ghost", "02");
    expect(ghost).toHaveTextContent("");
    expect(ghost).toHaveAttribute("aria-hidden", "true");
  });

  it("opens tinted sections like a window, but not light ones (no visible edge)", () => {
    const { container, rerender } = render(
      <Section id="gallery" tone="dark" eyebrow="e" title="t">
        <p />
      </Section>,
    );
    expect(container.querySelector("section")).toHaveClass("section-aperture");
    rerender(
      <Section id="about" tone="light" eyebrow="e" title="t">
        <p />
      </Section>,
    );
    expect(container.querySelector("section")).not.toHaveClass("section-aperture");
  });
});

describe("Reveal", () => {
  it("reveals at once where IntersectionObserver is unavailable", () => {
    render(<Reveal>Content</Reveal>);
    expect(screen.getByText("Content")).toHaveClass("is-revealed");
  });

  it("passes a stagger delay through as a CSS variable", () => {
    render(<Reveal delay={150}>Late</Reveal>);
    expect(screen.getByText("Late").style.getPropertyValue("--reveal-delay")).toBe("150ms");
  });
});
