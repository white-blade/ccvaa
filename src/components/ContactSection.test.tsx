import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "@/components/ContactSection";
import { expectNoAxeViolations } from "@/test/axe";

describe("ContactSection", () => {
  it("is the fourth numbered section, labelled by its heading", () => {
    render(<ContactSection />);
    const section = screen.getByRole("region", { name: "Contact" });
    expect(section).toHaveAttribute("id", "contact");
    expect(section).toHaveTextContent("04");
  });

  it("links the email address for writing", () => {
    render(<ContactSection />);
    expect(screen.getByRole("link", { name: "info@ccvaa.ca" })).toHaveAttribute(
      "href",
      "mailto:info@ccvaa.ca",
    );
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<ContactSection />);
    await expectNoAxeViolations(container);
  });
});
