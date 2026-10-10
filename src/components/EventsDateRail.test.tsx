import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventsDateRail } from "@/components/EventsDateRail";
import { expectNoAxeViolations } from "@/test/axe";
import { makeEvent } from "@/test/fixtures";

const events = [
  makeEvent({ id: "exhibition", title: "Coastal Light", startsAt: "2026-11-14", dateLabel: "November 14, 2026" }),
  makeEvent({ id: "talk", title: "Artist Talk", startsAt: "2027-02-11", dateLabel: "February 11, 2027" }),
];

function renderRail(props: Partial<Parameters<typeof EventsDateRail>[0]> = {}) {
  const onSelect = vi.fn();
  render(
    <EventsDateRail events={events} activeId={null} dimmedIds={new Set()} onSelect={onSelect} {...props} />,
  );
  return { onSelect, rail: within(screen.getByRole("navigation", { name: "Event dates" })) };
}

describe("EventsDateRail", () => {
  it("has a chip per event, in order, named by title and date", () => {
    const { rail } = renderRail();
    const [first, second] = rail.getAllByRole("button");
    expect(first).toHaveAccessibleName("Coastal Light, November 14, 2026");
    expect(second).toHaveAccessibleName("Artist Talk, February 11, 2027");
    expect(rail.getAllByRole("button")[0]).toHaveTextContent(/Nov\s*14/);
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

  it("dims, but keeps, chips for events the search hides", () => {
    const { rail } = renderRail({ dimmedIds: new Set(["exhibition"]) });
    expect(rail.getByRole("button", { name: /Coastal Light/ })).toHaveClass("opacity-40");
    expect(rail.getByRole("button", { name: /Artist Talk/ })).not.toHaveClass("opacity-40");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(
      <EventsDateRail events={events} activeId="talk" dimmedIds={new Set()} onSelect={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });
});
