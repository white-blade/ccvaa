import type { CcvaaEvent } from "@/lib/events";

/**
 * Layout for the events timeline: where each event's start date falls on a line
 * running from the first event's month to the end of the last one's, as a fraction
 * from 0 (top) to 1 (bottom). Dates stay ISO strings and are counted in UTC days,
 * so no local-time `Date` can shift them.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type TimelineTick = {
  /** First of the month, ISO. */
  iso: string;
  position: number;
  label: string;
  /** Set on the first tick and on every January, so the year is never ambiguous. */
  year?: string;
};

export type TimelineLayout = {
  /** Event id → position, in event order. */
  positions: Map<string, number>;
  ticks: TimelineTick[];
  /** Where today falls, or null when today is outside the timeline or unknown. */
  today: number | null;
};

function dayNumber(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function monthStart(iso: string, offset = 0): string {
  const [year, month] = iso.split("-").map(Number);
  const index = year * 12 + (month - 1) + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-01`;
}

/**
 * Pushes positions apart so no two dots sit closer than `minGap`, keeping order.
 * Dots that would run off the bottom are packed back up from the end.
 */
export function spreadPositions(positions: number[], minGap: number): number[] {
  const spread = [...positions];
  for (let i = 1; i < spread.length; i++) {
    spread[i] = Math.max(spread[i], spread[i - 1] + minGap);
  }
  for (let i = spread.length - 1; i >= 0; i--) {
    const ceiling = i === spread.length - 1 ? 1 : spread[i + 1] - minGap;
    spread[i] = Math.min(spread[i], ceiling);
  }
  return spread;
}

/** `events` must be in start order, as `getEvents()` returns them. */
export function timelineLayout(
  events: CcvaaEvent[],
  today: string | null,
  minGap = 0.06,
): TimelineLayout {
  if (events.length === 0) {
    return { positions: new Map(), ticks: [], today: null };
  }

  const first = monthStart(events[0].startsAt);
  const end = monthStart(events[events.length - 1].startsAt, 1);
  const start = dayNumber(first);
  const span = dayNumber(end) - start;
  const at = (iso: string) => (dayNumber(iso) - start) / span;

  const spread = spreadPositions(
    events.map((event) => at(event.startsAt)),
    minGap,
  );

  const ticks: TimelineTick[] = [];
  for (let iso = first; iso < end; iso = monthStart(iso, 1)) {
    const month = Number(iso.slice(5, 7));
    ticks.push({
      iso,
      position: at(iso),
      label: MONTHS[month - 1],
      year: iso === first || month === 1 ? iso.slice(0, 4) : undefined,
    });
  }

  const todayPosition = today ? at(today) : null;

  return {
    positions: new Map(events.map((event, index) => [event.id, spread[index]])),
    ticks,
    today:
      todayPosition !== null && todayPosition >= 0 && todayPosition <= 1
        ? todayPosition
        : null,
  };
}
