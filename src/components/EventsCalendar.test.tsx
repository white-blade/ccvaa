import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventsCalendar } from "@/components/EventsCalendar";
import { makeEvent } from "@/test/fixtures";

const events = [
  makeEvent({
    id: "exhibition",
    title: "Coastal Light",
    startsAt: "2026-11-14",
    endsAt: "2026-12-06",
    dateLabel: "November 14 – December 6, 2026",
    image: { src: "/ccvaa/events/a.jpg", alt: "A dock" },
  }),
  makeEvent({ id: "talk", title: "Artist Talk", startsAt: "2027-02-11" }),
  makeEvent({ id: "retreat", title: "Printmaking Retreat", startsAt: "2027-06-05", endsAt: "2027-06-06" }),
];

function renderOn(today: string) {
  // Only Date is faked, so user-event's own timers still run.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${today}T12:00:00`));
  const onOpen = vi.fn();
  render(<EventsCalendar events={events} onOpen={onOpen} />);
  return { onOpen, user: userEvent.setup() };
}

function monthHeading() {
  return screen.getByRole("heading", { level: 2 });
}

/** The day-number button for `day`, or null if that day has no event. */
function dayButton(day: number) {
  return screen.queryByText(String(day), { selector: "button" });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("EventsCalendar", () => {
  it("opens on the month of the next upcoming event", () => {
    renderOn("2026-10-09");
    expect(monthHeading()).toHaveTextContent("November 2026");
  });

  it("opens on the last month once every event has passed", () => {
    renderOn("2027-08-01");
    expect(monthHeading()).toHaveTextContent("June 2027");
  });

  it("makes every day of an event clickable, opening that event", async () => {
    const { onOpen, user } = renderOn("2026-10-09");

    expect(dayButton(13)).toBeNull();
    await user.click(dayButton(14)!);
    await user.click(dayButton(20)!);

    expect(onOpen).toHaveBeenNthCalledWith(1, "exhibition");
    expect(onOpen).toHaveBeenNthCalledWith(2, "exhibition");
  });

  it("labels event days with the event and its dates", () => {
    renderOn("2026-10-09");
    expect(dayButton(14)).toHaveAccessibleName(
      "Coastal Light — November 14 – December 6, 2026",
    );
  });

  it("pages between months within the season only", async () => {
    const { user } = renderOn("2026-10-09");
    const previous = screen.getByRole("button", { name: "Previous month" });
    const next = screen.getByRole("button", { name: "Next month" });

    expect(previous).toBeDisabled();
    await user.click(next);
    expect(monthHeading()).toHaveTextContent("December 2026");
    await user.click(previous);
    expect(monthHeading()).toHaveTextContent("November 2026");
  });

  it("jumps to a month from the strip", async () => {
    const { user } = renderOn("2026-10-09");
    const strip = screen.getByRole("group", { name: "Jump to month" });

    await user.click(within(strip).getByRole("button", { name: "June 2027" }));

    expect(monthHeading()).toHaveTextContent("June 2027");
    expect(within(strip).getByRole("button", { name: "June 2027" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Printmaking Retreat")).toBeInTheDocument();
  });

  it("lists the month's events in the panel and opens them", async () => {
    const { onOpen, user } = renderOn("2026-10-09");
    await user.click(screen.getByRole("button", {
        name: "Coastal Light — November 14 – December 6, 2026 — Richmond, BC",
      }));
    expect(onOpen).toHaveBeenCalledWith("exhibition");
  });

  it("offers the next event from an empty month", async () => {
    const { user } = renderOn("2026-10-09");
    const strip = screen.getByRole("group", { name: "Jump to month" });
    await user.click(within(strip).getByRole("button", { name: "January 2027" }));

    expect(screen.getByText("Nothing scheduled this month.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next up: Artist Talk — 2027-02-11" }));
    expect(monthHeading()).toHaveTextContent("February 2027");
  });

  it("marks events that have already ended as past", async () => {
    const { user } = renderOn("2027-03-01");
    expect(screen.queryByText("Past")).toBeNull();

    const strip = screen.getByRole("group", { name: "Jump to month" });
    await user.click(within(strip).getByRole("button", { name: "November 2026" }));
    expect(screen.getByText("Past")).toBeInTheDocument();
  });
});
