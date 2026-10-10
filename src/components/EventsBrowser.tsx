"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EventCard } from "@/components/EventCard";
import { EventDialog } from "@/components/EventDialog";
import { EventsTimeline } from "@/components/EventsTimeline";
import { searchEvents, searchIndex } from "@/lib/event-search";
import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";
import { timelineLayout } from "@/lib/timeline";
import { useToday } from "@/lib/use-today";

type EventsBrowserProps = {
  events: CcvaaEvent[];
};

export function EventsBrowser({ events }: EventsBrowserProps) {
  const today = useToday();
  const [query, setQuery] = useState("");
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  /** Pointed at from the timeline or the list. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /**
   * Tapped on the timeline (touch), with the card being read at the time. It lasts
   * until the reading position moves to another card or the visitor taps elsewhere
   * — not on raw scroll distance, which a tap's own drift can exceed.
   */
  const [preview, setPreview] = useState<{ id: string; inViewId: string | null } | null>(null);
  /** The card nearest the middle of the screen, so the timeline follows scrolling. */
  const [inViewId, setInViewId] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);

  const index = useMemo(() => searchIndex(events), [events]);
  const { terms, matches } = searchEvents(events, index, query);
  const matchKey = matches.map((event) => event.id).join(" ");

  const layout = useMemo(() => timelineLayout(events, today), [events, today]);
  const shownIds = new Set(matches.map((event) => event.id));
  const dimmedIds = new Set(
    events.filter((event) => !shownIds.has(event.id)).map((event) => event.id),
  );

  const isPast = (event: CcvaaEvent) =>
    today !== null && (event.endsAt ?? event.startsAt) < today;

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;

    // A thin band across the middle of the viewport: whichever card crosses it is
    // the one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInViewId((entry.target as HTMLElement).dataset.eventId ?? null);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    list.querySelectorAll("[data-event-id]").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [matchKey]);

  const previewId = preview && preview.inViewId === inViewId ? preview.id : null;

  const timelineRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!previewId) return;
    const onPointerDown = (pointer: PointerEvent) => {
      if (!timelineRef.current?.contains(pointer.target as Node)) setPreview(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [previewId]);

  const activeId = hoveredId ?? previewId ?? inViewId;

  // Looked up in every event, not just matches: a dimmed dot still opens its event.
  const openEvent = events.find((event) => event.id === openEventId) ?? null;

  const closeDialog = useCallback(() => setOpenEventId(null), []);

  const noun =
    events.length === 1 ? eventsContent.countNoun : eventsContent.countNounPlural;
  const countLabel = terms.length
    ? `${matches.length} of ${events.length} ${noun}`
    : `${events.length} ${noun}`;

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="relative min-w-0 flex-1 basis-64 lg:max-w-md">
          <label htmlFor="events-search" className="sr-only">
            {eventsContent.searchLabel}
          </label>
          <input
            id="events-search"
            type="search"
            value={query}
            onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            placeholder={eventsContent.searchPlaceholder}
            className="w-full rounded-full border border-ocean-200 bg-white py-3 pl-5 pr-12 text-base text-ocean-900 pointer-fine:text-sm shadow-sm transition-colors placeholder:text-ocean-500 hover:border-ocean-400 focus:border-ocean-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={eventsContent.clearSearchLabel}
              className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ocean-500 transition-colors hover:bg-ocean-50 hover:text-ocean-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              <span aria-hidden="true">✕</span>
            </button>
          ) : null}
        </div>

        {/* Announced, because filtering changes the page without moving focus. */}
        <p aria-live="polite" className="text-sm lining-nums tabular-nums text-ocean-500">
          {countLabel}
        </p>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        {matches.length > 0 ? (
          <ul ref={listRef} className="space-y-6">
            {matches.map((event) => (
              <li key={event.id} data-event-id={event.id}>
                <EventCard
                  event={event}
                  past={isPast(event)}
                  highlighted={hoveredId === event.id || previewId === event.id}
                  onOpen={() => setOpenEventId(event.id)}
                  onHighlight={(highlighted) => setHoveredId(highlighted ? event.id : null)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-ocean-200 bg-white/60 p-10 text-center">
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

        {/* Wide screens only: on a phone the cards' own dates carry the sequence. */}
        <aside ref={timelineRef} className="hidden lg:block">
          <div className="sticky top-28 h-[min(40rem,calc(100vh-10rem))] py-6">
            <EventsTimeline
              events={events}
              layout={layout}
              activeId={activeId}
              dimmedIds={dimmedIds}
              isPast={isPast}
              onHighlight={setHoveredId}
              onPreview={(id) => setPreview({ id, inViewId })}
              onOpen={setOpenEventId}
            />
          </div>
        </aside>
      </div>

      {openEvent ? <EventDialog event={openEvent} onClose={closeDialog} /> : null}
    </>
  );
}
