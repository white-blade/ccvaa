import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { BoardSection } from "@/components/BoardSection";
import { expectNoAxeViolations } from "@/test/axe";

function memberCard(name: string): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(name) });
}

describe("BoardSection", () => {
  it("shows a card for each board member with their role", () => {
    render(<BoardSection />);
    expect(memberCard("Zhong Liu")).toHaveTextContent("President");
    expect(memberCard("Yaqi Jing")).toHaveTextContent("Vice President");
    expect(memberCard("Albert Zang")).toHaveTextContent("Secretary");
  });

  it("opens a profile with portrait and bio when a card is chosen", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    await user.click(memberCard("Zhong Liu"));

    const dialog = screen.getByRole("dialog", { name: "Zhong Liu" });
    expect(dialog).toHaveTextContent("President");
    expect(within(dialog).getByRole("img", { name: /Portrait of Zhong Liu/ })).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/Lorem ipsum/);
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("steps through the board with the arrow keys and buttons, wrapping around", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    await user.click(memberCard("Zhong Liu"));

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Yaqi Jing" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next board member" }));
    expect(screen.getByRole("dialog", { name: "Albert Zang" })).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Zhong Liu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous board member" }));
    expect(screen.getByRole("dialog", { name: "Albert Zang" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the card that opened it", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    const card = memberCard("Yaqi Jing");
    card.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(card).toHaveFocus();
  });

  it("closes on a backdrop click but not on a click inside", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    await user.click(memberCard("Albert Zang"));
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByText("Secretary"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(dialog.parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no detectable accessibility problems, cards or profile", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<BoardSection />);
    await expectNoAxeViolations(baseElement);
    await user.click(memberCard("Zhong Liu"));
    await expectNoAxeViolations(baseElement);
  });
});
