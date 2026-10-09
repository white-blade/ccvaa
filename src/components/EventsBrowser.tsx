"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ColumnControl } from "@/components/ColumnControl";
import { EventCard } from "@/components/EventCard";
import { EventDialog } from "@/components/EventDialog";
import { EventsCalendar } from "@/components/EventsCalendar";
import { searchEvents, searchIndex } from "@/lib/event-search";
import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";
import { createColumnStore } from "@/lib/use-columns";

const COLUMN_OPTIONS = [1, 2, 3, 4] as const;
type ColumnCount = (typeof COLUMN_OPTIONS)[number];

const columnStore = createColumnStore<ColumnCount>(
  "ccvaa:events-columns",
  COLUMN_OPTIONS,
  3,
);

function useColumns() {
  return useSyncExternalStore(
    columnStore.subscribe,
    columnStore.getSnapshot,
    columnStore.getServerSnapshot,
  );
}

/**
 * Written out per option because Tailwind scans source text — `grid-cols-${n}` would
 * never be generated. Cards carry a picture, a title, and a summary, so they stay one
 * across on phones however many are chosen.
 */
const GRID_CLASS: Record<ColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

type EventsBrowserProps = {
  events: CcvaaEvent[];
};

export function EventsBrowser({ events }: EventsBrowserProps) {
  const columns = useColumns();
  const [query, setQuery] = useState("");
  const [openEventId, setOpenEventId] = useState<string | null>(null);

  /** Whatever opened the dialog — a card or a calendar day — so focus returns there. */
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const index = useMemo(() => searchIndex(events), [events]);
  const { terms, matches } = searchEvents(events, index, query);

  // Looked up in every event, not just matches: the calendar ignores the search.
  const openEvent = events.find((event) => event.id === openEventId) ?? null;

  const openDialog = useCallback((eventId: string) => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenEventId(eventId);
  }, []);

  const closeDialog = useCallback(() => {
    setOpenEventId(null);
    returnFocusRef.current?.focus();
  }, []);

  const noun =
    events.length === 1 ? eventsContent.countNoun : eventsContent.countNounPlural;
  const countLabel = terms.length
    ? `${matches.length} of ${events.length} ${noun}`
    : `${events.length} ${noun}`;

  return (
    <>
      <EventsCalendar events={events} onOpen={openDialog} />

      <h2 className="mt-16 font-display text-2xl font-semibold tracking-tight text-ocean-900 sm:text-3xl">
        {eventsContent.listingsTitle}
      </h2>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="relative min-w-0 flex-1 basis-64">
          <label htmlFor="events-search" className="sr-only">
            {eventsContent.searchLabel}
          </label>
          <input
            id="events-search"
            type="search"
            value={query}
            onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            placeholder={eventsContent.searchPlaceholder}
            className="w-full rounded-full border border-ocean-200 bg-white py-2.5 pl-5 pr-11 text-sm text-ocean-900 shadow-sm transition-colors placeholder:text-ocean-400 hover:border-ocean-300 focus:border-ocean-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={eventsContent.clearSearchLabel}
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ocean-500 transition-colors hover:bg-ocean-50 hover:text-ocean-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              <span aria-hidden="true">✕</span>
            </button>
          ) : null}
        </div>

        <ColumnControl
          id="events-columns"
          label={eventsContent.perRowLabel}
          options={COLUMN_OPTIONS}
          value={columns}
          onChange={columnStore.choose}
        />
      </div>

      {/* Announced, because filtering changes the page without moving focus. */}
      <p
        aria-live="polite"
        className="mt-4 text-sm lining-nums tabular-nums text-ocean-500"
      >
        {countLabel}
      </p>

      {matches.length > 0 ? (
        <ul className={`mt-6 grid gap-6 ${GRID_CLASS[columns]}`}>
          {matches.map((event) => (
            <li key={event.id}>
              <EventCard
                event={event}
                onOpen={() => openDialog(event.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-ocean-200 bg-white/60 p-10 text-center">
          <p className="text-sm text-ocean-600">{eventsContent.noResults}</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 inline-flex items-center rounded-full border border-ocean-200 bg-white px-4 py-2 text-sm font-semibold text-ocean-800 transition-colors hover:border-ocean-400 hover:bg-ocean-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          >
            {eventsContent.clearSearchLabel}
          </button>
        </div>
      )}

      {openEvent ? (
        <EventDialog event={openEvent} onClose={closeDialog} />
      ) : null}
    </>
  );
}
