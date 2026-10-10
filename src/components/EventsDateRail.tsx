"use client";

import { useEffect, useRef, type Ref } from "react";

import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";

type EventsDateRailProps = {
  events: CcvaaEvent[];
  /** The event being read, or picked; its chip is marked and kept in view. */
  activeId: string | null;
  /** Events the search hides; their chips dim but stay usable. */
  dimmedIds: Set<string>;
  onSelect: (eventId: string) => void;
  /** The strip's own element, so the browser can measure what it covers. */
  ref?: Ref<HTMLElement>;
};

/**
 * The timeline for screens too narrow for the side one (below `lg`): a sticky,
 * swipeable strip of date chips above the listings. Choosing a chip glides to that
 * event's card; as the visitor reads on, the chip for the card in view is marked
 * and scrolled into the strip's view.
 */
export function EventsDateRail({
  events,
  activeId,
  dimmedIds,
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
    const left = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2;
    list.scrollTo?.({ left, behavior: "smooth" });
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
                className={`flex min-h-11 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-left ring-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral active:scale-95 ${
                  active
                    ? "bg-ocean-900 text-cream ring-ocean-900"
                    : "bg-white text-ocean-800 ring-ocean-100"
                } ${dimmedIds.has(event.id) && !active ? "opacity-40" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full leading-none ${
                    active
                      ? "bg-coral text-ocean-950"
                      : "bg-cream text-ocean-900"
                  }`}
                >
                  <span className="text-[0.5625rem] font-semibold uppercase">
                    {event.dateBadge.month}
                  </span>
                  <span className="font-display text-sm font-semibold lining-nums">
                    {event.dateBadge.day}
                  </span>
                </span>
                {/* The name is the visible title, then the full date for screen
                    readers — so what is seen and what is announced agree. */}
                <span className="max-w-[9rem] truncate text-xs font-semibold">
                  {event.title}
                </span>
                <span className="sr-only">, {event.dateLabel}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
