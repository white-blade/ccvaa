"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { GalleryLightbox } from "@/components/GalleryLightbox";
import { Modal } from "@/components/Modal";
import { roundGlassButtonClass } from "@/components/styles";
import {
  isPictureBlock,
  type CcvaaEvent,
  type EventPicture,
  type EventPictureBlock,
} from "@/lib/events";
import { eventsContent } from "@/lib/site";

type EventDialogProps = {
  event: CcvaaEvent;
  onClose: () => void;
};

/** Every picture in an event, cover first, in the order the dialog shows them. */
function picturesOf(event: CcvaaEvent): EventPicture[] {
  return [
    ...(event.image ? [event.image] : []),
    ...event.details.filter(isPictureBlock).flatMap((block) => block.pictures),
  ];
}

/** The corner mark that says a picture opens larger. */
function ExpandMark({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full bg-ocean-950/50 text-sm text-cream backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110 ${className}`}
    >
      ⤢
    </span>
  );
}

/** Pictures set among the description paragraphs: one full width, several in pairs. */
function PictureBlock({
  block,
  onView,
}: {
  block: EventPictureBlock;
  onView: (picture: EventPicture) => void;
}) {
  const single = block.pictures.length === 1;

  return (
    <figure>
      <div className={single ? "" : "grid grid-cols-2 gap-3"}>
        {block.pictures.map((picture) => (
          <button
            type="button"
            key={picture.src}
            onClick={() => onView(picture)}
            aria-label={`${eventsContent.viewPictureLabel}: ${picture.alt}`}
            className={`group relative block w-full overflow-hidden rounded-2xl bg-ocean-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 ${
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
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <ExpandMark className="bottom-2 right-2" />
          </button>
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

/**
 * Pictures are cropped to fit the dialog, so each one opens the photo viewer to be
 * seen whole — a certificate or a poster as much as a landscape.
 */
export function EventDialog({ event, onClose }: EventDialogProps) {
  const titleId = `event-${event.id}-title`;
  const pictures = picturesOf(event);
  const photos = pictures.map((picture) => ({ ...picture, file: picture.src }));
  const [viewing, setViewing] = useState<{
    index: number;
    direction: -1 | 0 | 1;
  } | null>(null);

  const view = (picture: EventPicture) =>
    setViewing({
      index: pictures.findIndex((each) => each.src === picture.src),
      direction: 0,
    });
  const step = useCallback(
    (direction: -1 | 1) =>
      setViewing((current) =>
        current
          ? {
              index:
                (current.index + direction + photos.length) % photos.length,
              direction,
            }
          : current,
      ),
    [photos.length],
  );
  const closeViewer = useCallback(() => setViewing(null), []);
  const showNext = useCallback(() => step(1), [step]);
  const showPrevious = useCallback(() => step(-1), [step]);

  return (
    <>
      <Modal labelledBy={titleId} onClose={onClose}>
        {(initialFocusRef) => (
          <>
            <div className="relative shrink-0">
              {event.image ? (
                <button
                  type="button"
                  onClick={() => view(event.image!)}
                  aria-label={`${eventsContent.viewPictureLabel}: ${event.image.alt}`}
                  className="group relative block aspect-[16/9] w-full overflow-hidden bg-ocean-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral sm:aspect-[21/9]"
                >
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
                  <ExpandMark className="left-4 top-4" />
                </button>
              ) : (
                <div
                  aria-hidden="true"
                  className="h-28 w-full bg-gradient-to-br from-ocean-800 via-ocean-900 to-ocean-950 sm:h-32"
                />
              )}

              {/* Title over the picture rather than below it — the image becomes the
                header instead of a banner the text has to repeat. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
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
                    <PictureBlock
                      key={`pictures-${index}`}
                      block={detail}
                      onView={view}
                    />
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

      {viewing ? (
        <GalleryLightbox
          photos={photos}
          index={viewing.index}
          direction={viewing.direction}
          onClose={closeViewer}
          onNext={showNext}
          onPrevious={showPrevious}
          onSelect={(index) => setViewing({ index, direction: 0 })}
        />
      ) : null}
    </>
  );
}
