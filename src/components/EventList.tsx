"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { EventDialog } from "@/components/EventDialog";
import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";

type EventListProps = {
  events: CcvaaEvent[];
};

export function EventList({ events }: EventListProps) {
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  /** Which card opened the dialog, so focus can go back to it on close. */
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const openEvent = events.find((event) => event.id === openEventId) ?? null;

  function closeDialog() {
    const previousId = openEventId;
    setOpenEventId(null);
    if (previousId) {
      triggerRefs.current.get(previousId)?.focus();
    }
  }

  return (
    <>
      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              ref={(node) => {
                triggerRefs.current.set(event.id, node);
              }}
              onClick={() => setOpenEventId(event.id)}
              aria-haspopup="dialog"
              className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ocean-100 bg-white text-left shadow-sm transition-colors hover:border-ocean-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
            >
              {event.image ? (
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-ocean-100">
                  <Image
                    src={event.image.src}
                    alt={event.image.alt}
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(min-width: 1024px) 20rem, (min-width: 768px) 45vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}

              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-ocean-500">
                  <time dateTime={event.startsAt}>{event.dateLabel}</time>
                </p>

                <h3 className="mt-2 font-display text-lg font-semibold text-ocean-900">
                  {event.title}
                </h3>

                <p className="mt-1 text-sm text-ocean-500">{event.location}</p>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-ocean-600">
                  {event.summary}
                </p>

                <span className="mt-4 text-sm font-semibold text-ocean-800 transition-colors group-hover:text-coral-dark">
                  {eventsContent.detailsLabel}
                  <span aria-hidden="true"> →</span>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {openEvent ? (
        <EventDialog event={openEvent} onClose={closeDialog} />
      ) : null}
    </>
  );
}
