import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/Hero";
import { heroContent } from "@/lib/site";
import { expectNoAxeViolations } from "@/test/axe";

describe("Hero", () => {
  it("keeps the headline whole for assistive technology, despite the word-by-word entrance", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heroContent.headline);
  });

  it("animates the entrance only when motion is allowed", () => {
    const { container } = render(<Hero />);
    const animated = container.querySelectorAll("[class*=animate-intro]");
    expect(animated.length).toBeGreaterThan(5);
    for (const element of animated) {
      expect(element.className).toMatch(/motion-safe:animate-intro/);
    }
  });

  it("rests transparent, so with no animation the dark veil never hides the photograph", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector("[class*=animate-intro-unveil]")).toHaveClass("opacity-0");
  });

  it("links its calls to action to the gallery and events", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /Explore the gallery/ })).toHaveAttribute("href", "#gallery");
    expect(screen.getByRole("link", { name: /See what’s on/ })).toHaveAttribute("href", "#events");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<Hero />);
    await expectNoAxeViolations(container);
  });
});
