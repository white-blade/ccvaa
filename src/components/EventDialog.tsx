"use client";

import Image from "next/image";

import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";
import { useDialog } from "@/lib/use-dialog";

type EventDialogProps = {
  event: CcvaaEvent;
  onClose: () => void;
};

export function EventDialog({ event, onClose }: EventDialogProps) {
  const { dialogRef, initialFocusRef } = useDialog({ open: true, onClose });
  const titleId = `event-${event.id}-title`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ocean-950/70 p-4 backdrop-blur-sm sm:p-8"
      // Backdrop click closes; the panel stops propagation so inner clicks do not.
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-ocean-100 bg-white shadow-xl"
      >
        {event.image ? (
          <div className="relative aspect-[3/2] w-full bg-ocean-100">
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              unoptimized
              sizes="(min-width: 768px) 42rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ocean-500">
                <time dateTime={event.startsAt}>{event.dateLabel}</time>
              </p>
              <h3
                id={titleId}
                className="mt-2 font-display text-2xl font-semibold text-ocean-900"
              >
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-ocean-500">{event.location}</p>
            </div>

            <button
              type="button"
              ref={initialFocusRef}
              onClick={onClose}
              aria-label={eventsContent.closeLabel}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ocean-200 text-ocean-700 transition-colors hover:border-ocean-400 hover:bg-ocean-50"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-ocean-700">
            {event.details.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {event.admission ? (
            <p className="mt-6 border-t border-ocean-100 pt-4 text-sm font-medium text-ocean-800">
              {event.admission}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
