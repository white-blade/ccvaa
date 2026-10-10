"use client";

import Image from "next/image";

import type { CcvaaEvent } from "@/lib/events";
import { hoverFocusHandlers } from "@/lib/hover-focus";
import { eventsContent } from "@/lib/site";

type EventCardProps = {
  event: CcvaaEvent;
  onOpen: () => void;
  /** Hovering or focusing the card lights up its dot on the timeline. */
  onHighlight: (highlighted: boolean) => void;
  /** Set while this event's dot or card is hovered. */
  highlighted: boolean;
  past: boolean;
};

export function EventCard({
  event,
  onOpen,
  onHighlight,
  highlighted,
  past,
}: EventCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      {...hoverFocusHandlers(
        () => onHighlight(true),
        () => onHighlight(false),
      )}
      aria-haspopup="dialog"
      className={`group relative flex w-full flex-col overflow-hidden rounded-3xl bg-white text-left transition-all duration-300 pointer-coarse:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 sm:flex-row ${
        highlighted
          ? "-translate-y-0.5 shadow-2xl shadow-coral/20 ring-2 ring-coral"
          : "shadow-sm ring-1 ring-ocean-100"
      }`}
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-ocean-900 sm:aspect-auto sm:min-h-[14rem] sm:w-2/5">
        {event.image ? (
          <>
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              unoptimized
              loading="lazy"
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 40vw, 90vw"
              className={`object-cover transition-transform duration-700 ease-out ${
                highlighted ? "scale-[1.06]" : ""
              } ${past ? "grayscale-[60%]" : ""}`}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ocean-950/50 via-transparent to-ocean-950/10"
            />
          </>
        ) : (
          // Events with no venue to photograph — an online talk — still need a
          // frame, or the list falls out of rhythm wherever one appears.
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-ocean-700 via-ocean-900 to-ocean-950"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-coral/30 blur-2xl" />
          </div>
        )}

        {/* Calendar chip: the date is what visitors scan a listing for. */}
        <p
          aria-hidden="true"
          className="absolute left-4 top-4 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-cream/95 shadow-sm"
        >
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-coral-dark">
            {event.dateBadge.month}
          </span>
          <span className="font-display text-xl font-semibold leading-none text-ocean-900 lining-nums tabular-nums">
            {event.dateBadge.day}
          </span>
        </p>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coral-dark">
          <time dateTime={event.startsAt}>{event.dateLabel}</time>
          {past ? (
            <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-[0.625rem] text-ocean-600">
              {eventsContent.pastLabel}
            </span>
          ) : null}
        </p>

        <h3 className="mt-2 font-display text-xl font-semibold text-ocean-900 sm:text-2xl">
          {event.title}
        </h3>

        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ocean-500">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0 text-ocean-400"
          >
            <path
              fillRule="evenodd"
              d="M10 18s6-5.33 6-10A6 6 0 0 0 4 8c0 4.67 6 10 6 10Zm0-7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
              clipRule="evenodd"
            />
          </svg>
          {event.location}
        </p>

        {/* Three lines on phones, so a card fits a screen; the dialog has it all. */}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ocean-600 max-sm:line-clamp-3">
          {event.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {event.admission ? (
            <span className="rounded-full bg-ocean-50 px-3 py-1 text-xs font-medium text-ocean-700">
              {event.admission}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-800 transition-colors group-hover:text-coral-dark">
            {eventsContent.detailsLabel}
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
