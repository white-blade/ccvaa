"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { roundButtonClass } from "@/components/styles";
import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";
import { centreInStrip } from "@/lib/strip";
import { formatIsoDate } from "@/lib/text";
import { useDialog } from "@/lib/use-dialog";

type GalleryLightboxProps = {
  photos: GalleryPhoto[];
  /** Index into `photos` of the photograph on screen. */
  index: number;
  /** Which way the visitor last moved: 1 forward, -1 back, 0 for the first view. */
  direction: -1 | 0 | 1;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  /** A thumbnail was chosen. */
  onSelect: (index: number) => void;
};

const ENTER_CLASS = {
  [-1]: "motion-safe:animate-photo-from-left",
  0: "motion-safe:animate-photo-in",
  1: "motion-safe:animate-photo-from-right",
} as const;

/**
 * Full-screen viewer for the gallery slideshow and for event pictures. The photograph
 * is always contained, never cropped: this is where it is seen whole. Escape, arrow
 * keys, swipes (left/right to step, down to close), the focus trap, the scroll lock,
 * and returning focus to the opener all come from `useDialog`. Portalled to <body> so it covers the fixed header
 * — see `Modal`.
 *
 * Expanding (the button beside close, or a click on the photograph) gives the
 * photograph the whole screen: caption, counter, and thumbnails step aside, and a
 * portrait or a detailed picture is seen as large as the screen allows. Arrows and
 * swipes still step; Escape leaves full view first, then closes.
 *
 * Browsing is meant to feel continuous: the photograph slides in from the side the
 * visitor moved toward, its neighbours are fetched ahead so a step never waits, a
 * soft shimmer holds the space while a photograph loads, and a strip of thumbnails
 * shows the whole set and jumps anywhere in it.
 */
export function GalleryLightbox({
  photos,
  index,
  direction,
  onClose,
  onNext,
  onPrevious,
  onSelect,
}: GalleryLightboxProps) {
  const [expanded, setExpanded] = useState(false);
  const collapse = useCallback(() => setExpanded(false), []);
  // In full view, Escape and a downward swipe step back to the framed view first.
  const dismiss = expanded ? collapse : onClose;
  const { dialogRef, initialFocusRef } = useDialog({
    open: true,
    onClose: dismiss,
    onNext,
    onPrevious,
    onSwipeDown: dismiss,
  });
  const stripRef = useRef<HTMLOListElement>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const photo = photos[index];
  const position = `${index + 1} / ${photos.length}`;
  const hasMany = photos.length > 1;
  const loaded = loadedSrc === photo.src;
  const takenOn = photo.takenAt ? formatIsoDate(photo.takenAt) : null;

  // Fetch the neighbours now, so stepping either way shows a photograph at once.
  useEffect(() => {
    for (const offset of [1, -1]) {
      const neighbour =
        photos[(index + offset + photos.length) % photos.length];
      if (neighbour) new window.Image().src = neighbour.src;
    }
  }, [index, photos]);

  // Keep the current thumbnail centred in the strip.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!strip || !thumb) return;
    centreInStrip(strip, thumb);
  }, [index]);

  /** Only a click on the dark surround closes — never one on the image itself. */
  function closeOnBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      onClick={closeOnBackdrop}
      data-expanded={expanded ? "" : undefined}
      className={`fixed inset-0 z-[100] flex flex-col overscroll-contain backdrop-blur-sm motion-safe:animate-viewer-in ${
        expanded
          ? "bg-ocean-950"
          : "bg-ocean-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-4 ${
          expanded
            ? "absolute inset-x-0 top-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6"
            : ""
        }`}
      >
        <p
          className={`text-sm lining-nums tabular-nums text-ocean-200 ${expanded ? "invisible" : ""}`}
        >
          {position}
          {/* Mouse and keyboard only: on touch the gestures are the way. */}
          <span
            aria-hidden="true"
            className="ml-4 hidden text-xs text-ocean-200/80 pointer-fine:inline"
          >
            {galleryContent.keyboardHint}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={
              expanded
                ? galleryContent.collapseLabel
                : galleryContent.expandLabel
            }
            aria-pressed={expanded}
            className={`${roundButtonClass} ${expanded ? "bg-ocean-950/50" : ""}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {expanded ? (
                <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" />
              ) : (
                <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
              )}
            </svg>
          </button>
          <button
            type="button"
            ref={initialFocusRef}
            onClick={onClose}
            aria-label={galleryContent.closeLabel}
            className={`${roundButtonClass} ${expanded ? "bg-ocean-950/50" : ""}`}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      {/* A click on the photograph (or the space around it) toggles full view. */}
      <div
        data-photo-stage=""
        className={`relative min-h-0 flex-1 ${expanded ? "cursor-zoom-out" : "mt-3 cursor-zoom-in"}`}
        onClick={() => setExpanded((current) => !current)}
      >
        {loaded ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[10%] rounded-3xl bg-white/5 motion-safe:animate-pulse"
          />
        )}
        {/* Keyed by photograph, so each one enters with its own slide. */}
        <div
          key={photo.src}
          className={`pointer-events-none absolute inset-0 ${ENTER_CLASS[direction]}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            unoptimized
            onLoad={() => setLoadedSrc(photo.src)}
            className={`object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            sizes="100vw"
          />
        </div>
      </div>

      {expanded ? null : (
        <div className="mx-auto mt-4 max-w-3xl text-center">
          {photo.author || takenOn ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">
              {photo.author ? (
                <>
                  <span className="sr-only">
                    {galleryContent.authorPrefix}{" "}
                  </span>
                  {photo.author}
                </>
              ) : null}
              {photo.author && takenOn ? (
                <span aria-hidden="true" className="mx-2 text-ocean-200">
                  ·
                </span>
              ) : null}
              {takenOn ? (
                <>
                  <span className="sr-only">{galleryContent.takenPrefix} </span>
                  <time dateTime={photo.takenAt}>{takenOn}</time>
                </>
              ) : null}
            </p>
          ) : null}
          {/* Without a caption of its own the alt text stands in, and the dialog's
          aria-label already carries that. */}
          <p
            aria-hidden={photo.description ? undefined : "true"}
            className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ocean-200"
          >
            {photo.description ?? photo.alt}
          </p>
        </div>
      )}

      {hasMany && !expanded && (
        <div className="mx-auto mt-4 flex w-full max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={onPrevious}
            aria-label={galleryContent.previousLabel}
            className={roundButtonClass}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <ol
            ref={stripRef}
            aria-label={galleryContent.thumbnailsLabel}
            className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto overscroll-x-contain px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((thumb, thumbIndex) => {
              const current = thumbIndex === index;
              return (
                <li key={thumb.file} className="shrink-0 snap-center">
                  <button
                    type="button"
                    data-index={thumbIndex}
                    onClick={() => onSelect(thumbIndex)}
                    aria-label={`${galleryContent.showPhotoLabel} ${thumbIndex + 1}`}
                    aria-current={current ? "true" : undefined}
                    className={`relative block h-12 w-12 overflow-hidden rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:h-14 sm:w-14 ${
                      current
                        ? "opacity-100 ring-2 ring-coral ring-offset-2 ring-offset-ocean-950"
                        : "opacity-50 hover:opacity-90"
                    }`}
                  >
                    <Image
                      src={thumb.src}
                      alt=""
                      fill
                      unoptimized
                      loading="lazy"
                      sizes="3.5rem"
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            onClick={onNext}
            aria-label={galleryContent.nextLabel}
            className={roundButtonClass}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
