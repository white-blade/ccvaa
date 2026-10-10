import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PurposesSection } from "@/components/PurposesSection";
import { aboutContent } from "@/lib/site";
import { expectNoAxeViolations } from "@/test/axe";

const first = aboutContent.purposes[0];
const last = aboutContent.purposes[9];

function purpose(title: string) {
  return screen.getByRole("button", { name: title });
}

/** A description is shown when its panel is not inert (closed panels are). */
function panelOf(title: string) {
  return document.getElementById(purpose(title).getAttribute("aria-controls")!)!;
}

describe("PurposesSection", () => {
  it("lists all ten purposes, in order, every one closed at first", () => {
    render(<PurposesSection />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent(first.title);
    for (const { title } of aboutContent.purposes) {
      expect(purpose(title)).toHaveAttribute("aria-expanded", "false");
      expect(panelOf(title)).toHaveAttribute("inert");
    }
  });

  it("opens one purpose on its own, leaving the rest closed", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    await user.click(purpose(last.title));

    expect(purpose(last.title)).toHaveAttribute("aria-expanded", "true");
    expect(panelOf(last.title)).not.toHaveAttribute("inert");
    expect(screen.getByRole("region", { name: last.title })).toHaveTextContent(last.description);
    expect(purpose(first.title)).toHaveAttribute("aria-expanded", "false");
  });

  it("closes a purpose when it is chosen again", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    await user.click(purpose(first.title));
    await user.click(purpose(first.title));
    expect(purpose(first.title)).toHaveAttribute("aria-expanded", "false");
    expect(panelOf(first.title)).toHaveAttribute("inert");
  });

  it("keeps several open at once", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    await user.click(purpose(first.title));
    await user.click(purpose(last.title));
    expect(purpose(first.title)).toHaveAttribute("aria-expanded", "true");
    expect(purpose(last.title)).toHaveAttribute("aria-expanded", "true");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    purpose(first.title).focus();
    await user.keyboard("{Enter}");
    expect(purpose(first.title)).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(purpose(first.title)).toHaveAttribute("aria-expanded", "false");
  });

  it("expands all, then offers to collapse all", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    await user.click(screen.getByRole("button", { name: /Expand all/ }));
    for (const { title } of aboutContent.purposes) {
      expect(purpose(title)).toHaveAttribute("aria-expanded", "true");
    }
    await user.click(screen.getByRole("button", { name: /Collapse all/ }));
    for (const { title } of aboutContent.purposes) {
      expect(purpose(title)).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("offers to expand all until every purpose is open", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    for (const { title } of aboutContent.purposes.slice(0, 9)) {
      await user.click(purpose(title));
    }
    expect(screen.getByRole("button", { name: /Expand all/ })).toBeInTheDocument();
    await user.click(purpose(last.title));
    expect(screen.getByRole("button", { name: /Collapse all/ })).toBeInTheDocument();
  });

  describe("card alignment", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** jsdom lays nothing out: give headings and descriptions a height from their text. */
    function measureByText() {
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
        if (this.hasAttribute("data-purpose-head")) return 50 + this.textContent!.length;
        if (this.hasAttribute("data-purpose-body")) return this.textContent!.length;
        return 0;
      });
    }

    it("sizes every heading to the tallest and every description to the longest", () => {
      measureByText();
      render(<PurposesSection />);
      const list = screen.getByRole("list");
      const longestTitle = Math.max(...aboutContent.purposes.map(({ title }) => `0${title}`.length + 1));
      const longestDescription = Math.max(...aboutContent.purposes.map(({ description }) => description.length));

      expect(list.style.getPropertyValue("--purpose-head-h")).toBe(`${50 + longestTitle}px`);
      expect(list.style.getPropertyValue("--purpose-body-h")).toBe(`${longestDescription}px`);
      for (const { title, description } of aboutContent.purposes) {
        expect(purpose(title).style.minHeight).toBe("var(--purpose-head-h)");
        expect(screen.getByText(description).style.minHeight).toBe("var(--purpose-body-h)");
      }
    });

    it("keeps the sizes as purposes open and close, each on its own", async () => {
      measureByText();
      const user = userEvent.setup();
      render(<PurposesSection />);
      const list = screen.getByRole("list");
      const before = list.getAttribute("style");

      await user.click(purpose(first.title));
      await user.click(purpose(last.title));
      await user.click(purpose(first.title));
      expect(list.getAttribute("style")).toBe(before);
      expect(purpose(first.title)).toHaveAttribute("aria-expanded", "false");
      expect(purpose(last.title)).toHaveAttribute("aria-expanded", "true");
    });

    it("sets no minimum before anything has been laid out", () => {
      render(<PurposesSection />);
      const list = screen.getByRole("list");
      expect(list.style.getPropertyValue("--purpose-head-h")).toBe("");
      expect(list.style.getPropertyValue("--purpose-body-h")).toBe("");
    });
  });

  it("has no detectable accessibility problems, closed or open", async () => {
    const user = userEvent.setup();
    const { container } = render(<PurposesSection />);
    await expectNoAxeViolations(container);
    await user.click(screen.getByRole("button", { name: /Expand all/ }));
    await expectNoAxeViolations(container);
  });
});
