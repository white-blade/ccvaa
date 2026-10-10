"use client";

import { useEffect, useRef, type Ref } from "react";

import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";
import { centreInStrip } from "@/lib/strip";

type EventsDateRailProps = {
  events: CcvaaEvent[];
  /** The event being read, or picked; its chip is marked and kept in view. */
  activeId: string | null;
  onSelect: (eventId: string) => void;
  /** The strip's own element, so the browser can measure what it covers. */
  ref?: Ref<HTMLElement>;
};

/**
 * The timeline for screens too narrow for the side one (below `lg`): a sticky,
 * swipeable strip of date chips above the listings. Each chip is the full date and
 * where the event happens — the card below carries the title, so the strip stays
 * short enough to scan. Choosing a chip glides to that event's card; as the visitor reads on, the chip for the card in view is marked
 * and scrolled into the strip's view.
 */
export function EventsDateRail({
  events,
  activeId,
  onSelect,
  ref,
}: EventsDateRailProps) {
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the active chip centred in the strip. Sets the strip's own scrollLeft
  // rather than calling scrollIntoView, which could also scroll the page.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(
      `[data-event-id="${activeId}"]`,
    );
    if (!list || !chip) return;
    centreInStrip(list, chip);
  }, [activeId]);

  return (
    <nav
      ref={ref}
      aria-label={eventsContent.dateRailLabel}
      // Pinned under the header (its measured height), full-bleed to the edges.
      className="sticky top-(--header-h) z-20 -mx-6 mb-6 border-b border-ocean-100 bg-cream/90 backdrop-blur-md lg:hidden"
    >
      <ol
        ref={listRef}
        className="flex snap-x snap-mandatory scroll-px-6 gap-2 overflow-x-auto overscroll-x-contain px-6 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {events.map((event) => {
          const active = event.id === activeId;
          return (
            <li key={event.id} className="shrink-0 snap-start">
              <button
                type="button"
                data-event-id={event.id}
                onClick={() => onSelect(event.id)}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-11 flex-col justify-center rounded-full px-4 py-1.5 text-left leading-tight ring-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral active:scale-95 ${
                  active
                    ? "bg-ocean-900 text-cream ring-ocean-900"
                    : "bg-white text-ocean-800 ring-ocean-100"
                }`}
              >
                <span
                  className={`text-[0.6875rem] font-semibold uppercase tracking-wider lining-nums ${
                    active ? "text-coral" : "text-coral-dark"
                  }`}
                >
                  {event.dateBadge.month} {event.dateBadge.day}, {event.dateBadge.year}
                </span>{" "}
                <span className="max-w-[10rem] truncate text-xs font-semibold">
                  {event.placeLabel}
                </span>
                {/* Seen: the date and place. Heard: those first, then which event. */}
                {" "}
                <span className="sr-only">— {event.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
