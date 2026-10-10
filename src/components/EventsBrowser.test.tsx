import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventsBrowser } from "@/components/EventsBrowser";
import { glideTo } from "@/lib/scroll-to-section";
import { expectNoAxeViolations } from "@/test/axe";
import { makeEvent } from "@/test/fixtures";

const events = [
  makeEvent({
    id: "exhibition",
    title: "Coastal Light",
    startsAt: "2026-11-14",
    endsAt: "2026-12-06",
    dateLabel: "November 14 – December 6, 2026",
    location: "Richmond Cultural Centre",
    summary: "Annual juried members’ exhibition.",
    details: [
      "The opening reception is on Saturday.",
      { pictures: [{ src: "/ccvaa/events/b.jpg", alt: "A bench" }] },
    ],
    image: { src: "/ccvaa/events/a.jpg", alt: "A dock" },
  }),
  makeEvent({
    id: "talk",
    title: "Artist Talk",
    startsAt: "2027-02-11",
    dateLabel: "February 11, 2027",
    location: "Online (Zoom)",
  }),
];

vi.mock("@/lib/scroll-to-section", () => ({ glideTo: vi.fn() }));

function renderOn(today: string) {
  // Only Date is faked, so user-event's own timers still run.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${today}T12:00:00`));
  const user = userEvent.setup();
  render(<EventsBrowser events={events} />);
  return user;
}

function card(title: string): HTMLElement {
  return screen.getByText(title, { selector: "h3" }).closest("button")!;
}

function timeline() {
  return within(screen.getByRole("navigation", { name: "Event timeline" }));
}

/** A timeline dot, by the start of its name: "title — dates", then the place. */
function dot(name: string): HTMLElement {
  return timeline().getByRole("button", {
    name: (accessibleName) => accessibleName.startsWith(name),
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EventsBrowser list", () => {
  it("lists every event, with no search or filter to narrow them", () => {
    renderOn("2026-10-09");
    expect(card("Coastal Light")).toBeInTheDocument();
    expect(card("Artist Talk")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("opens a card's details and returns focus to it on Escape", async () => {
    const user = renderOn("2026-10-09");
    await user.click(card("Coastal Light"));

    const dialog = screen.getByRole("dialog", { name: "Coastal Light" });
    expect(dialog).toHaveTextContent("The opening reception is on Saturday.");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(card("Coastal Light")).toHaveFocus();
  });

  it("opens an event's picture whole, and Escape closes only the picture", async () => {
    const user = renderOn("2026-10-09");
    await user.click(card("Coastal Light"));
    const event = screen.getByRole("dialog", { name: "Coastal Light" });
    const cover = within(event).getByRole("button", { name: "View the full picture: A dock" });

    await user.click(cover);
    expect(screen.getByRole("dialog", { name: "A dock" })).toBeInTheDocument();
    // Every picture in the event is a step away, cover first.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "A bench" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "A bench" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "Coastal Light" })).toBeInTheDocument();
    expect(cover).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a picture from among the details, too", async () => {
    const user = renderOn("2026-10-09");
    await user.click(card("Coastal Light"));
    await user.click(screen.getByRole("button", { name: "View the full picture: A bench" }));
    expect(screen.getByRole("dialog", { name: "A bench" })).toBeInTheDocument();
  });

  it("gives an event without a picture its place, set large, in the picture's frame", () => {
    renderOn("2026-10-09");
    const talk = card("Artist Talk");
    const frame = talk.querySelector("[data-no-image]")!;
    expect(frame).toHaveTextContent("Richmond, Canada");
    expect(frame).toHaveAttribute("aria-hidden", "true");
    expect(card("Coastal Light").querySelector("[data-no-image]")).toBeNull();
  });

  it("puts View details last in every card, after any admission note", () => {
    renderOn("2026-10-09");
    for (const title of ["Coastal Light", "Artist Talk"]) {
      const link = card(title).querySelector("[data-details-link]")!;
      expect(link).toHaveTextContent("View details");
      expect(link).toHaveClass("self-end");
      expect(link.nextElementSibling).toBeNull();
    }
  });

  it("marks events that have ended as past", () => {
    renderOn("2027-01-01");
    expect(card("Coastal Light")).toHaveTextContent("Past");
    expect(card("Artist Talk")).not.toHaveTextContent("Past");
  });
});

describe("EventsBrowser timeline", () => {
  it("puts a dot on the timeline for every event, named with its dates and place", () => {
    renderOn("2026-10-09");
    expect(dot("Coastal Light")).toHaveAccessibleName(
      "Coastal Light — November 14 – December 6, 2026 — Richmond Cultural Centre",
    );
    expect(dot("Artist Talk — February 11, 2027")).toBeInTheDocument();
  });

  it("zooms in on a dot and highlights its card on hover", async () => {
    const user = renderOn("2026-10-09");
    const talkDot = dot("Artist Talk — February 11, 2027");

    expect(talkDot).not.toHaveAttribute("aria-current");
    expect(card("Artist Talk")).not.toHaveClass("ring-coral");

    await user.hover(talkDot);
    expect(talkDot).toHaveAttribute("aria-current", "true");
    expect(card("Artist Talk")).toHaveClass("ring-coral");
    expect(card("Coastal Light")).not.toHaveClass("ring-coral");

    await user.unhover(talkDot);
    expect(talkDot).not.toHaveAttribute("aria-current");
    expect(card("Artist Talk")).not.toHaveClass("ring-coral");
  });

  it("zooms in on the matching dot when a card is hovered", async () => {
    const user = renderOn("2026-10-09");
    await user.hover(card("Coastal Light"));
    expect(dot("Coastal Light — November 14 – December 6, 2026")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("opens an event from its dot and returns focus there", async () => {
    const user = renderOn("2026-10-09");
    const exhibitionDot = dot("Coastal Light — November 14 – December 6, 2026");

    await user.click(exhibitionDot);
    expect(screen.getByRole("dialog", { name: "Coastal Light" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(exhibitionDot).toHaveFocus();
  });

  it("sets month and year labels in their own fixed-width monospace columns", () => {
    renderOn("2026-10-09");
    const nav = screen.getByRole("navigation", { name: "Event timeline" });
    const months = [...nav.querySelectorAll("[data-tick-month]")];
    const years = [...nav.querySelectorAll("[data-tick-year]")];
    // Nov 2026 → Feb 2027: one month cell and one year cell (empty or not) per tick.
    expect(months.map((month) => month.textContent)).toEqual(["Nov", "Dec", "Jan", "Feb"]);
    expect(years.map((year) => year.textContent)).toEqual(["2026", "", "2027", ""]);
    for (const month of months) {
      expect(month).toHaveClass("w-[3ch]", "uppercase", "text-ocean-500");
      expect(month.closest("li")).toHaveClass("font-mono");
    }
    for (const year of years) {
      expect(year).toHaveClass("w-[4ch]", "font-bold", "text-coral-dark");
      expect(year).not.toHaveClass("text-ocean-500");
    }
  });

  it("marks today on the timeline only while the season is running", () => {
    renderOn("2027-01-01");
    expect(timeline().getByText("Today")).toBeInTheDocument();
  });

  it("leaves today off before the season starts", () => {
    renderOn("2026-10-09");
    expect(timeline().queryByText("Today")).toBeNull();
  });

  it("steps between dots with the arrow keys", async () => {
    const user = renderOn("2026-10-09");
    const exhibitionDot = dot("Coastal Light — November 14 – December 6, 2026");
    const talkDot = dot("Artist Talk — February 11, 2027");

    exhibitionDot.focus();
    await user.keyboard("{ArrowDown}");
    expect(talkDot).toHaveFocus();
    expect(talkDot).toHaveAttribute("aria-current", "true");
    await user.keyboard("{ArrowDown}");
    expect(talkDot).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(exhibitionDot).toHaveFocus();
  });
});

describe("EventsBrowser date rail (below lg)", () => {
  function rail() {
    return within(screen.getByRole("navigation", { name: "Event dates" }));
  }

  it("glides a chosen chip's card into view below the header and the rail", async () => {
    const user = renderOn("2026-10-09");
    vi.mocked(glideTo).mockClear();
    await user.click(rail().getByRole("button", { name: /Artist Talk$/ }));
    expect(glideTo).toHaveBeenCalledTimes(1);
    const [target, offset] = vi.mocked(glideTo).mock.calls[0];
    expect(target).toBe(card("Artist Talk"));
    expect(offset).toBeGreaterThanOrEqual(12);
  });

  it("marks the chip of the event highlighted on the timeline", async () => {
    const user = renderOn("2026-10-09");
    await user.hover(dot("Artist Talk — February 11, 2027"));
    expect(rail().getByRole("button", { name: /Artist Talk$/ })).toHaveAttribute("aria-current", "true");
  });

});

describe("EventsBrowser on touch screens", () => {
  /** A finger tap: pointerdown reports touch, then the click follows. */
  function tap(element: HTMLElement) {
    fireEvent.pointerDown(element, { pointerType: "touch" });
    fireEvent.click(element);
  }

  it("previews on the first tap and opens on the second", () => {
    renderOn("2026-10-09");
    const talkDot = dot("Artist Talk — February 11, 2027");

    tap(talkDot);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(talkDot).toHaveAttribute("aria-current", "true");
    expect(card("Artist Talk")).toHaveClass("ring-coral");

    tap(talkDot);
    expect(screen.getByRole("dialog", { name: "Artist Talk" })).toBeInTheDocument();
  });

  it("moves the preview when another dot is tapped", () => {
    renderOn("2026-10-09");
    tap(dot("Artist Talk — February 11, 2027"));
    tap(dot("Coastal Light — November 14 – December 6, 2026"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(dot("Coastal Light — November 14 – December 6, 2026")).toHaveAttribute("aria-current", "true");
    expect(dot("Artist Talk — February 11, 2027")).not.toHaveAttribute("aria-current");
  });

  it("lets the preview go on a tap anywhere else", () => {
    renderOn("2026-10-09");
    const talkDot = dot("Artist Talk — February 11, 2027");
    tap(talkDot);
    expect(talkDot).toHaveAttribute("aria-current", "true");

    fireEvent.pointerDown(talkDot, { pointerType: "touch" });
    expect(talkDot).toHaveAttribute("aria-current", "true");
    fireEvent.pointerDown(card("Coastal Light"), { pointerType: "touch" });
    expect(talkDot).not.toHaveAttribute("aria-current");
  });

  it("never strands a highlight from emulated touch hover", () => {
    renderOn("2026-10-09");
    fireEvent.pointerEnter(card("Coastal Light"), { pointerType: "touch" });
    expect(card("Coastal Light")).not.toHaveClass("ring-coral");
  });

  it("still opens on the first click with a mouse", () => {
    renderOn("2026-10-09");
    const talkDot = dot("Artist Talk — February 11, 2027");
    fireEvent.pointerDown(talkDot, { pointerType: "mouse" });
    fireEvent.click(talkDot);
    expect(screen.getByRole("dialog", { name: "Artist Talk" })).toBeInTheDocument();
  });
});

describe("EventsBrowser accessibility", () => {
  it("has no detectable problems, list or dialog", async () => {
    const user = renderOn("2027-01-01");
    await expectNoAxeViolations(document.body);
    await user.click(card("Coastal Light"));
    await expectNoAxeViolations(document.body);
  });
});
