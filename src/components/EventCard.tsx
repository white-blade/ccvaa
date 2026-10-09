"use client";

import Image from "next/image";
import type { Ref } from "react";

import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";

type EventCardProps = {
  event: CcvaaEvent;
  onOpen: () => void;
  /** Set by the browser so focus can return here when the dialog closes. */
  triggerRef: Ref<HTMLButtonElement>;
};

export function EventCard({ event, onOpen, triggerRef }: EventCardProps) {
  return (
    <button
      type="button"
      ref={triggerRef}
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ocean-100 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ocean-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-ocean-900">
        {event.image ? (
          <>
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              unoptimized
              loading="lazy"
              sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ocean-950/55 via-transparent to-ocean-950/10"
            />
          </>
        ) : (
          // Events with no venue to photograph — an online talk — still need a
          // frame, or the grid falls out of alignment wherever one appears.
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-ocean-800 via-ocean-900 to-ocean-950"
          />
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

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ocean-800 transition-colors group-hover:text-coral-dark">
          {eventsContent.detailsLabel}
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </div>
    </button>
  );
}
