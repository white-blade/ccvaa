"use client";

import Image from "next/image";

import { Modal } from "@/components/Modal";
import { roundGlassButtonClass } from "@/components/styles";
import { isPictureBlock, type CcvaaEvent, type EventPictureBlock } from "@/lib/events";
import { eventsContent } from "@/lib/site";

type EventDialogProps = {
  event: CcvaaEvent;
  onClose: () => void;
};

/** Pictures set among the description paragraphs: one full width, several in pairs. */
function PictureBlock({ block }: { block: EventPictureBlock }) {
  const single = block.pictures.length === 1;

  return (
    <figure>
      <div className={single ? "" : "grid grid-cols-2 gap-3"}>
        {block.pictures.map((picture) => (
          <div
            key={picture.src}
            className={`relative overflow-hidden rounded-2xl bg-ocean-100 ${
              single ? "aspect-[3/2]" : "aspect-square"
            }`}
          >
            <Image
              src={picture.src}
              alt={picture.alt}
              fill
              unoptimized
              loading="lazy"
              sizes={single ? "(min-width: 768px) 40rem, 100vw" : "20rem"}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {block.caption ? (
        <figcaption className="mt-2 text-xs text-ocean-500">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function EventDialog({ event, onClose }: EventDialogProps) {
  const titleId = `event-${event.id}-title`;

  return (
    <Modal labelledBy={titleId} onClose={onClose}>
      {(initialFocusRef) => (
        <>
          <div className="relative shrink-0">
            {event.image ? (
              <div className="relative aspect-[16/9] w-full bg-ocean-900 sm:aspect-[21/9]">
                <Image
                  src={event.image.src}
                  alt={event.image.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 48rem, 100vw"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/30 to-ocean-950/10"
                />
              </div>
            ) : (
              <div
                aria-hidden="true"
                className="h-28 w-full bg-gradient-to-br from-ocean-800 via-ocean-900 to-ocean-950 sm:h-32"
              />
            )}

            {/* Title over the picture rather than below it — the image becomes the
                header instead of a banner the text has to repeat. */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wider text-cream/80">
                <time dateTime={event.startsAt}>{event.dateLabel}</time>
              </p>
              <h3
                id={titleId}
                className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl"
              >
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-cream/80">{event.location}</p>
            </div>

            <button
              type="button"
              ref={initialFocusRef}
              onClick={onClose}
              aria-label={eventsContent.closeLabel}
              className={`absolute right-4 top-4 ${roundGlassButtonClass}`}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="space-y-5 text-sm leading-relaxed text-ocean-700">
              {event.details.map((detail, index) =>
                isPictureBlock(detail) ? (
                  <PictureBlock key={`pictures-${index}`} block={detail} />
                ) : (
                  <p key={detail}>{detail}</p>
                ),
              )}
            </div>

            {event.admission ? (
              <p className="mt-6 inline-flex rounded-full bg-ocean-50 px-4 py-2 text-sm font-medium text-ocean-800">
                {event.admission}
              </p>
            ) : null}
          </div>
        </>
      )}
    </Modal>
  );
}
