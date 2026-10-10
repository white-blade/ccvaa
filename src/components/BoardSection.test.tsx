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
    expect(within(dialog).getByRole("img", { name: /^Zhong Liu, President/ })).toHaveAttribute(
      "src",
      "/ccvaa/board/zhong-liu.jpg",
    );
    expect(dialog).toHaveTextContent(/Richmond-based photographic artist/);
    expect(dialog).not.toHaveTextContent(/Lorem ipsum/);
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("links a member's website, opening safely in a new tab", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    await user.click(memberCard("Zhong Liu"));
    const link = within(screen.getByRole("dialog")).getByRole("link", { name: /liuzhongphoto\.com/ });
    expect(link).toHaveAttribute("href", "https://www.liuzhongphoto.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it("shows no website line for members without one", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    await user.click(memberCard("Yaqi Jing"));
    expect(within(screen.getByRole("dialog")).queryByRole("link")).toBeNull();
  });

  it("says a bio is coming rather than showing filler when there is none yet", async () => {
    const user = userEvent.setup();
    render(<BoardSection />);
    await user.click(memberCard("Albert Zang"));
    const dialog = screen.getByRole("dialog", { name: "Albert Zang" });
    expect(dialog).toHaveTextContent("Bio coming soon.");
    expect(within(dialog).getByRole("img", { name: /^Albert Zang, Secretary/ })).toBeInTheDocument();
  });

  it("shows the board's group photograph, described left to right", () => {
    render(<BoardSection />);
    expect(screen.getByRole("img", { name: /from left: Yaqi Jing, Zhong Liu, and Albert Zang/ })).toHaveAttribute(
      "src",
      "/ccvaa/board/board.jpg",
    );
  });

  it("puts each member's photo on their card, decorative beside their name", () => {
    render(<BoardSection />);
    const avatar = memberCard("Yaqi Jing").querySelector("img")!;
    expect(avatar).toHaveAttribute("src", "/ccvaa/board/yaqi-jing.jpg");
    expect(avatar).toHaveAttribute("alt", "");
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
