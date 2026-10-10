import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PurposesSection } from "@/components/PurposesSection";
import { expectNoAxeViolations } from "@/test/axe";

describe("Purposes disclosure", () => {
  it("keeps the heading as the toggle's name and reports its state", async () => {
    const user = userEvent.setup();
    render(<PurposesSection />);
    const toggle = screen.getByRole("button", { name: "Our Purposes" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/operate exclusively on a non-profit basis/)).toBeNull();

    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/operate exclusively on a non-profit basis/)).toBeInTheDocument();
  });

  it("lists all ten purposes in order", () => {
    render(<PurposesSection />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent("Advancement of Visual Arts");
  });

  it("has no detectable accessibility problems, collapsed or expanded", async () => {
    const user = userEvent.setup();
    const { container } = render(<PurposesSection />);
    await expectNoAxeViolations(container);
    for (const toggle of screen.getAllByRole("button")) {
      await user.click(toggle);
    }
    await expectNoAxeViolations(container);
  });
});
