import type { CcvaaEvent } from "@/lib/events";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A listing as `getEvents()` returns it, with only what a test cares about spelled out. */
export function makeEvent(
  overrides: Partial<CcvaaEvent> & Pick<CcvaaEvent, "id" | "startsAt">,
): CcvaaEvent {
  const [, month, day] = overrides.startsAt.split("-");
  return {
    title: overrides.id,
    dateLabel: overrides.startsAt,
    location: "Richmond, BC",
    summary: "",
    details: [],
    dateBadge: { month: MONTHS[Number(month) - 1], day: String(Number(day)) },
    ...overrides,
  };
}
