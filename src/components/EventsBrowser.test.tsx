import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventsBrowser } from "@/components/EventsBrowser";
import { makeEvent } from "@/test/fixtures";

const events = [
  makeEvent({
    id: "exhibition",
    title: "Coastal Light",
    startsAt: "2026-11-14",
    location: "Richmond Cultural Centre",
    summary: "Annual juried members’ exhibition.",
    details: ["The opening reception is on Saturday."],
  }),
  makeEvent({
    id: "talk",
    title: "Artist Talk",
    startsAt: "2027-02-11",
    location: "Online (Zoom)",
  }),
];

function card(title: string): HTMLElement {
  return screen.getByText(title, { selector: "h3" }).closest("button")!;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-09T12:00:00"));
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EventsBrowser", () => {
  it("lists every event with a count", () => {
    render(<EventsBrowser events={events} />);
    expect(card("Coastal Light")).toBeInTheDocument();
    expect(card("Artist Talk")).toBeInTheDocument();
    expect(screen.getByText("2 events")).toBeInTheDocument();
  });

  it("narrows the cards as the visitor searches", async () => {
    const user = userEvent.setup();
    render(<EventsBrowser events={events} />);

    await user.type(screen.getByRole("searchbox", { name: "Search events" }), "zoom");

    expect(screen.queryByText("Coastal Light", { selector: "h3" })).toBeNull();
    expect(card("Artist Talk")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 events")).toBeInTheDocument();
  });

  it("offers to clear a search that matches nothing", async () => {
    const user = userEvent.setup();
    render(<EventsBrowser events={events} />);

    await user.type(screen.getByRole("searchbox"), "sculpture");
    expect(screen.getByText("No events match that search.")).toBeInTheDocument();

    // Two clear buttons now: the ✕ in the field and the one under the message.
    await user.click(screen.getAllByRole("button", { name: "Clear search" })[1]);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByText("2 events")).toBeInTheDocument();
  });

  it("opens a card's details and returns focus to it on Escape", async () => {
    const user = userEvent.setup();
    render(<EventsBrowser events={events} />);

    await user.click(card("Coastal Light"));
    const dialog = screen.getByRole("dialog", { name: "Coastal Light" });
    expect(dialog).toHaveTextContent("The opening reception is on Saturday.");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(card("Coastal Light")).toHaveFocus();
  });

  it("opens an event from the calendar even when the search hides its card", async () => {
    const user = userEvent.setup();
    render(<EventsBrowser events={events} />);

    await user.type(screen.getByRole("searchbox"), "zoom");
    const day = screen.getByText("14", { selector: "button" });
    await user.click(day);

    expect(screen.getByRole("dialog", { name: "Coastal Light" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(day).toHaveFocus();
  });
});
