import type { CcvaaEvent } from "@/lib/events";

/**
 * Date arithmetic for the events calendar. Dates stay ISO strings ("2026-11-14")
 * and months ISO year-months ("2026-11") throughout: they compare correctly as
 * strings, and never pass through a local-time `Date` that could shift them a day.
 */
export type MonthKey = string;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function firstDay(event: CcvaaEvent): string {
  return event.startsAt.slice(0, 10);
}

export function lastDay(event: CcvaaEvent): string {
  return (event.endsAt ?? event.startsAt).slice(0, 10);
}

export function monthOf(iso: string): MonthKey {
  return iso.slice(0, 7);
}

export function shiftMonth(month: MonthKey, by: number): MonthKey {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + by;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function monthName(month: MonthKey): string {
  return MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? "";
}

/**
 * Every day from `from` to `to` inclusive. UTC arithmetic throughout, so a daylight
 * saving change can never drop or repeat a day.
 */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Six full weeks, Sunday first, so the grid holds its height from month to month. */
export function monthCells(month: MonthKey): { iso: string; inMonth: boolean }[] {
  const first = new Date(`${month}-01T00:00:00Z`);
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const iso = day.toISOString().slice(0, 10);
    return { iso, inMonth: iso.startsWith(month) };
  });
}

/** Each day that has something on, with every event covering it. */
export function groupEventsByDay(events: CcvaaEvent[]): Map<string, CcvaaEvent[]> {
  const byDay = new Map<string, CcvaaEvent[]>();
  for (const event of events) {
    for (const day of daysBetween(firstDay(event), lastDay(event))) {
      byDay.set(day, [...(byDay.get(day) ?? []), event]);
    }
  }
  return byDay;
}

/** Every month from the first event's start to the last event's end. */
export function seasonMonths(events: CcvaaEvent[]): MonthKey[] {
  if (events.length === 0) return [];
  const start = events.map(firstDay).sort()[0];
  const end = events.map(lastDay).sort().at(-1) ?? start;
  const months: MonthKey[] = [];
  for (let month = monthOf(start); month <= monthOf(end); month = shiftMonth(month, 1)) {
    months.push(month);
  }
  return months;
}

/** Events running at any point in `month`, including ones that start or end outside it. */
export function eventsInMonth(events: CcvaaEvent[], month: MonthKey): CcvaaEvent[] {
  return events.filter(
    (event) => monthOf(firstDay(event)) <= month && monthOf(lastDay(event)) >= month,
  );
}

/**
 * The month to open on: the next event still to come — today's month if it is
 * already running — or the season's last month once everything has passed. Before
 * `today` is known (prerender) it is the first.
 */
export function defaultMonth(
  events: CcvaaEvent[],
  months: MonthKey[],
  today: string | null,
): MonthKey {
  if (!today) return months[0];
  const upcoming = events.find((event) => lastDay(event) >= today);
  if (!upcoming) return months[months.length - 1];
  const start = firstDay(upcoming);
  return monthOf(start < today ? today : start);
}
