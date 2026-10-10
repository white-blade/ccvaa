"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EventCard } from "@/components/EventCard";
import { EventDialog } from "@/components/EventDialog";
import { EventsDateRail } from "@/components/EventsDateRail";
import { EventsTimeline } from "@/components/EventsTimeline";
import { glideTo } from "@/lib/scroll-to-section";
import type { CcvaaEvent } from "@/lib/events";
import { timelineLayout } from "@/lib/timeline";
import { useToday } from "@/lib/use-today";

type EventsBrowserProps = {
  events: CcvaaEvent[];
};

export function EventsBrowser({ events }: EventsBrowserProps) {
  const today = useToday();
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  /** Pointed at from the timeline or the list. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /**
   * Tapped on the timeline (touch), with the card being read at the time. It lasts
   * until the reading position moves to another card or the visitor taps elsewhere
   * — not on raw scroll distance, which a tap's own drift can exceed.
   */
  const [preview, setPreview] = useState<{
    id: string;
    inViewId: string | null;
  } | null>(null);
  /** The card nearest the middle of the screen, so the timeline follows scrolling. */
  const [inViewId, setInViewId] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const railRef = useRef<HTMLElement>(null);

  /** A date chip: glide the card to just below the header and the rail. */
  const showCard = (eventId: string) => {
    const card = listRef.current?.querySelector<HTMLElement>(
      `[data-event-id="${eventId}"] button`,
    );
    if (!card) return;
    const header = document.querySelector("header")?.offsetHeight ?? 0;
    const rail = railRef.current?.offsetHeight ?? 0;
    // Mark the chosen event on arrival rather than waiting for its card to cross
    // the middle of the screen: on a slow device a glide can step right past it,
    // and on a tall one the last card never reaches it.
    glideTo(card, header + rail + 12, () => setInViewId(eventId));
  };

  const layout = useMemo(() => timelineLayout(events, today), [events, today]);
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
          const id = (entry.target as HTMLElement).dataset.eventId ?? null;
          if (entry.isIntersecting) {
            setInViewId(id);
          } else if (entry.boundingClientRect.top > window.innerHeight / 2) {
            // The card being read left the band downward — the visitor went back
            // up above it (or jumped away up the page) and no card took its place:
            // mark nothing rather than a stale card. Leaving upward means it was
            // read past, so it stays marked (as when a chip glides the last card
            // to the top of a tall screen).
            setInViewId((current) => (current === id ? null : current));
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    list
      .querySelectorAll("[data-event-id]")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [events]);

  const previewId =
    preview && preview.inViewId === inViewId ? preview.id : null;

  const timelineRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!previewId) return;
    const onPointerDown = (pointer: PointerEvent) => {
      if (!timelineRef.current?.contains(pointer.target as Node))
        setPreview(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [previewId]);

  const activeId = hoveredId ?? previewId ?? inViewId;

  const openEvent = events.find((event) => event.id === openEventId) ?? null;

  const closeDialog = useCallback(() => setOpenEventId(null), []);

  return (
    <>
      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        {/* The rail is sticky within this column, so it rides along with the list. */}
        <div>
          {/* Below lg only: the side timeline has no room, so the dates ride above. */}
          <EventsDateRail
            ref={railRef}
            events={events}
            activeId={activeId}
            onSelect={showCard}
          />
          <ul ref={listRef} className="fx-cards space-y-6">
            {events.map((event) => (
              <li key={event.id} data-event-id={event.id}>
                <EventCard
                  event={event}
                  past={isPast(event)}
                  highlighted={
                    hoveredId === event.id || previewId === event.id
                  }
                  onOpen={() => setOpenEventId(event.id)}
                  onHighlight={(highlighted) =>
                    setHoveredId(highlighted ? event.id : null)
                  }
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Wide screens only: on a phone the cards' own dates carry the sequence. */}
        <aside ref={timelineRef} className="hidden lg:block">
          <div className="sticky top-28 h-[min(40rem,calc(100vh-10rem))] py-6">
            <EventsTimeline
              events={events}
              layout={layout}
              activeId={activeId}
              isPast={isPast}
              onHighlight={setHoveredId}
              onPreview={(id) => setPreview({ id, inViewId })}
              onOpen={setOpenEventId}
            />
          </div>
        </aside>
      </div>

      {openEvent ? (
        <EventDialog event={openEvent} onClose={closeDialog} />
      ) : null}
    </>
  );
}
