"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";
import { useToday } from "@/lib/use-today";

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

/** Months are keyed as ISO year-month ("2026-11") throughout. */
type MonthKey = string;

function firstDay(event: CcvaaEvent): string {
  return event.startsAt.slice(0, 10);
}

function lastDay(event: CcvaaEvent): string {
  return (event.endsAt ?? event.startsAt).slice(0, 10);
}

function monthOf(iso: string): MonthKey {
  return iso.slice(0, 7);
}

function shiftMonth(month: MonthKey, by: number): MonthKey {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + by;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

function monthName(month: MonthKey): string {
  return MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? "";
}

/**
 * Every day from `from` to `to` inclusive. UTC arithmetic throughout, so a daylight
 * saving change can never drop or repeat a day.
 */
function daysBetween(from: string, to: string): string[] {
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
function monthCells(month: MonthKey): { iso: string; inMonth: boolean }[] {
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

type EventsCalendarProps = {
  events: CcvaaEvent[];
  onOpen: (eventId: string) => void;
};

export function EventsCalendar({ events, onOpen }: EventsCalendarProps) {
  const today = useToday();
  const [chosenMonth, setChosenMonth] = useState<MonthKey | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const eventsByDay = useMemo(() => {
    const byDay = new Map<string, CcvaaEvent[]>();
    for (const event of events) {
      for (const day of daysBetween(firstDay(event), lastDay(event))) {
        byDay.set(day, [...(byDay.get(day) ?? []), event]);
      }
    }
    return byDay;
  }, [events]);

  // The strip and the arrows cover the season's span, not an endless calendar.
  const months = useMemo(() => {
    const start = monthOf(firstDay(events[0]));
    const end = monthOf(events.map(lastDay).sort().at(-1) ?? firstDay(events[0]));
    const span: MonthKey[] = [];
    for (let month = start; month <= end; month = shiftMonth(month, 1)) {
      span.push(month);
    }
    return span;
  }, [events]);

  const nextUpcoming = today
    ? events.find((event) => lastDay(event) >= today)
    : undefined;

  // Until the visitor picks a month, open on whatever is coming up next.
  const month =
    chosenMonth ??
    (today
      ? nextUpcoming
        ? monthOf(firstDay(nextUpcoming))
        : months[months.length - 1]
      : months[0]);

  const monthIndex = months.indexOf(month);
  const monthEvents = events.filter(
    (event) => monthOf(firstDay(event)) <= month && monthOf(lastDay(event)) >= month,
  );
  const nextAfterMonth = events.find((event) => monthOf(firstDay(event)) > month);
  const cells = monthCells(month);
  const copy = eventsContent.calendar;

  return (
    <section
      aria-labelledby="events-calendar-month"
      className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ocean-950/15 ring-1 ring-ocean-100 lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
    >
      <div className="p-5 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-coral-dark">
              {copy.eyebrow}
            </p>
            <h2
              id="events-calendar-month"
              aria-live="polite"
              className="mt-1 font-display text-2xl font-semibold tracking-tight text-ocean-900 sm:text-3xl"
            >
              {monthName(month)}{" "}
              <span className="font-normal text-ocean-400 lining-nums">
                {month.slice(0, 4)}
              </span>
            </h2>
          </div>

          <div className="flex shrink-0 gap-2">
            {[
              { by: -1, label: copy.previousMonthLabel, glyph: "←" },
              { by: 1, label: copy.nextMonthLabel, glyph: "→" },
            ].map(({ by, label, glyph }) => (
              <button
                key={by}
                type="button"
                onClick={() => setChosenMonth(months[monthIndex + by])}
                disabled={!months[monthIndex + by]}
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ocean-200 text-ocean-700 transition-colors hover:border-ocean-400 hover:bg-ocean-50 hover:text-ocean-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:pointer-events-none disabled:opacity-30"
              >
                <span aria-hidden="true">{glyph}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events are sparse, so a strip of the season's months beats paging blind. */}
        <div
          role="group"
          aria-label={copy.monthsLabel}
          className="-mx-1 mt-5 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {months.map((key) => {
            const selected = key === month;
            const hasEvents = events.some(
              (event) =>
                monthOf(firstDay(event)) <= key && monthOf(lastDay(event)) >= key,
            );
            return (
              <button
                key={key}
                type="button"
                onClick={() => setChosenMonth(key)}
                aria-pressed={selected}
                aria-label={`${monthName(key)} ${key.slice(0, 4)}`}
                className={`flex min-w-[3.25rem] flex-col items-center rounded-xl px-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                  selected
                    ? "bg-ocean-900 text-white shadow-md"
                    : "text-ocean-600 hover:bg-ocean-50 hover:text-ocean-900"
                }`}
              >
                <span className="text-xs font-semibold">
                  {monthName(key).slice(0, 3)}
                </span>
                <span
                  className={`text-[0.625rem] lining-nums ${
                    selected ? "text-ocean-200" : "text-ocean-400"
                  }`}
                >
                  {key.slice(0, 4)}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-1 w-1 rounded-full ${
                    hasEvents ? "bg-coral" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className="mt-6 grid grid-cols-7 text-center text-[0.6875rem] font-semibold uppercase tracking-wider text-ocean-400"
        >
          {copy.weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div
          key={month}
          className="mt-2 grid grid-cols-7 gap-y-1 motion-safe:animate-rise-in"
        >
          {cells.map(({ iso, inMonth }, index) => {
            const dayEvents = eventsByDay.get(iso) ?? [];
            const event = dayEvents[0];
            const day = Number(iso.slice(8, 10));
            const isToday = iso === today;
            const column = index % 7;

            if (!event) {
              return (
                <div key={iso} className="flex h-11 items-center justify-center sm:h-12">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm lining-nums tabular-nums sm:h-10 sm:w-10 ${
                      inMonth ? "text-ocean-700" : "text-ocean-200"
                    } ${isToday ? "font-semibold text-ocean-900 ring-1 ring-ocean-400" : ""}`}
                  >
                    {day}
                  </span>
                </div>
              );
            }

            const isStart = iso === firstDay(event);
            const isEnd = iso === lastDay(event);
            const multiDay = firstDay(event) !== lastDay(event);
            const highlighted = dayEvents.some(({ id }) => id === highlightedId);

            // The band joins a multi-day event's days; it starts and stops at the
            // day's centre on the first and last day, and rounds off at week breaks.
            const band = multiDay ? (
              <span
                aria-hidden="true"
                className={`absolute inset-y-1.5 bg-coral/15 sm:inset-y-1 ${
                  isStart ? "left-1/2" : "left-0"
                } ${isEnd ? "right-1/2" : "right-0"} ${
                  column === 0 && !isStart ? "rounded-l-full" : ""
                } ${column === 6 && !isEnd ? "rounded-r-full" : ""}`}
              />
            ) : null;

            const endpoint = isStart || isEnd;

            return (
              <div
                key={iso}
                className={`relative flex h-11 items-center justify-center sm:h-12 ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                {band}
                <button
                  type="button"
                  onClick={() => onOpen(event.id)}
                  onMouseEnter={() => setHighlightedId(event.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                  onFocus={() => setHighlightedId(event.id)}
                  onBlur={() => setHighlightedId(null)}
                  tabIndex={inMonth ? 0 : -1}
                  aria-haspopup="dialog"
                  aria-label={`${dayEvents.map(({ title }) => title).join(", ")} — ${event.dateLabel}`}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold lining-nums tabular-nums transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-900 focus-visible:ring-offset-2 sm:h-10 sm:w-10 ${
                    endpoint
                      ? "bg-coral text-white shadow-md shadow-coral/40 hover:bg-coral-dark"
                      : "text-ocean-900 hover:bg-coral/30"
                  } ${highlighted ? "scale-110" : ""} ${
                    isToday ? "ring-2 ring-ocean-900 ring-offset-2" : ""
                  }`}
                >
                  {day}
                  {dayEvents.length > 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-ocean-900 ring-2 ring-white"
                    />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>

        <ul
          aria-hidden="true"
          className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-ocean-100 pt-4 text-xs text-ocean-500"
        >
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-coral" />
            {copy.legendEvent}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-6 rounded-full bg-coral/20" />
            {copy.legendRange}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full ring-1 ring-ocean-400" />
            {copy.legendToday}
          </li>
        </ul>
      </div>

      <div className="relative isolate overflow-hidden bg-ocean-950 p-5 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-coral/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 -z-10 h-72 w-72 rounded-full bg-ocean-600/40 blur-3xl"
        />

        <p className="text-xs font-semibold uppercase tracking-widest text-coral">
          {copy.panelPrefix} {monthName(month)}
        </p>

        {monthEvents.length > 0 ? (
          <ul key={month} className="mt-5 space-y-3 motion-safe:animate-rise-in">
            {monthEvents.map((event) => {
              const past = today !== null && lastDay(event) < today;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(event.id)}
                    onMouseEnter={() => setHighlightedId(event.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                    onFocus={() => setHighlightedId(event.id)}
                    onBlur={() => setHighlightedId(null)}
                    aria-haspopup="dialog"
                    className={`group flex w-full items-center gap-4 rounded-2xl p-3 text-left ring-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                      highlightedId === event.id
                        ? "bg-white/10 ring-coral/60"
                        : "bg-white/5 ring-white/10"
                    } ${past ? "opacity-60" : ""}`}
                  >
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-ocean-700 to-ocean-900">
                      {event.image ? (
                        <Image
                          src={event.image.src}
                          alt=""
                          fill
                          unoptimized
                          loading="lazy"
                          sizes="4rem"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 bg-ocean-950/70 py-0.5 text-center text-[0.625rem] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                        {event.dateBadge.month} {event.dateBadge.day}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-semibold leading-snug text-white">
                        {event.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-ocean-200">
                        {event.location}
                      </span>
                      {past ? (
                        <span className="mt-1.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-ocean-100">
                          {copy.pastLabel}
                        </span>
                      ) : null}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-ocean-200 transition-transform group-hover:translate-x-0.5 group-hover:text-coral"
                    >
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div key={month} className="mt-5 motion-safe:animate-rise-in">
            <p className="font-display text-xl text-ocean-100">{copy.emptyMonth}</p>
            {nextAfterMonth ? (
              <button
                type="button"
                onClick={() => setChosenMonth(monthOf(firstDay(nextAfterMonth)))}
                className="group mt-6 flex w-full items-center justify-between gap-4 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:ring-coral/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
              >
                <span>
                  <span className="block text-[0.625rem] font-semibold uppercase tracking-widest text-coral">
                    {copy.nextUpLabel}
                  </span>
                  <span className="mt-1 block font-display text-base font-semibold text-white">
                    {nextAfterMonth.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ocean-200">
                    {nextAfterMonth.dateLabel}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-ocean-200 transition-transform group-hover:translate-x-0.5 group-hover:text-coral"
                >
                  →
                </span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
