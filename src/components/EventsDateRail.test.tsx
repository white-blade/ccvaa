import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventsDateRail } from "@/components/EventsDateRail";
import { expectNoAxeViolations } from "@/test/axe";
import { makeEvent } from "@/test/fixtures";

const events = [
  makeEvent({ id: "exhibition", title: "Coastal Light", startsAt: "2026-11-14", placeLabel: "Richmond, Canada" }),
  makeEvent({ id: "talk", title: "Artist Talk", startsAt: "2027-02-11", placeLabel: "Online" }),
];

function renderRail(props: Partial<Parameters<typeof EventsDateRail>[0]> = {}) {
  const onSelect = vi.fn();
  render(
    <EventsDateRail events={events} activeId={null} onSelect={onSelect} {...props} />,
  );
  return { onSelect, rail: within(screen.getByRole("navigation", { name: "Event dates" })) };
}

describe("EventsDateRail", () => {
  it("shows each chip's full date, year included, and its city and country", () => {
    const { rail } = renderRail();
    const [first, second] = rail.getAllByRole("button");
    expect(first).toHaveTextContent(/^Nov 14, 2026 Richmond, Canada/);
    expect(second).toHaveTextContent(/^Feb 11, 2027 Online/);
  });

  it("leaves the title off the chip, but names it for screen readers after what is seen", () => {
    const { rail } = renderRail();
    const [first, second] = rail.getAllByRole("button");
    expect(first).toHaveAccessibleName("Nov 14, 2026 Richmond, Canada — Coastal Light");
    expect(second).toHaveAccessibleName("Feb 11, 2027 Online — Artist Talk");
    expect(rail.getByText("Coastal Light", { exact: false })).toHaveClass("sr-only");
  });

  it("marks the chip for the event being read", () => {
    const { rail } = renderRail({ activeId: "talk" });
    expect(rail.getByRole("button", { name: /Artist Talk/ })).toHaveAttribute("aria-current", "true");
    expect(rail.getByRole("button", { name: /Coastal Light/ })).not.toHaveAttribute("aria-current");
  });

  it("keeps the active chip in view by scrolling the strip itself, never the page", () => {
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    const pageScroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderRail({ activeId: "talk" });
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
    expect(pageScroll).not.toHaveBeenCalled();
    pageScroll.mockRestore();
  });

  it("selects an event when its chip is chosen", async () => {
    const { rail, onSelect } = renderRail();
    await userEvent.setup().click(rail.getByRole("button", { name: /Artist Talk/ }));
    expect(onSelect).toHaveBeenCalledWith("talk");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(
      <EventsDateRail events={events} activeId="talk" onSelect={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });
});
