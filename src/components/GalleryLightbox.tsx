"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { roundButtonClass } from "@/components/styles";
import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";
import { centreInStrip } from "@/lib/strip";
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
 * Full-screen viewer for the gallery grid. Escape, arrow keys, swipes (left/right to
 * step, down to close), the focus trap, the scroll lock, and returning focus to the
 * tile all come from `useDialog`. Portalled to <body> so it covers the fixed header
 * — see `Modal`.
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
  const { dialogRef, initialFocusRef } = useDialog({
    open: true,
    onClose,
    onNext,
    onPrevious,
    onSwipeDown: onClose,
  });
  const stripRef = useRef<HTMLOListElement>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const photo = photos[index];
  const position = `${index + 1} / ${photos.length}`;
  const hasMany = photos.length > 1;
  const loaded = loadedSrc === photo.src;

  // Fetch the neighbours now, so stepping either way shows a photograph at once.
  useEffect(() => {
    for (const offset of [1, -1]) {
      const neighbour = photos[(index + offset + photos.length) % photos.length];
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
      className="fixed inset-0 z-[100] flex flex-col overscroll-contain bg-ocean-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm motion-safe:animate-viewer-in sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm lining-nums tabular-nums text-ocean-200">
          {position}
          {/* Mouse and keyboard only: on touch the gestures are the way. */}
          <span aria-hidden="true" className="ml-4 hidden text-xs text-ocean-200/80 pointer-fine:inline">
            {galleryContent.keyboardHint}
          </span>
        </p>
        <button
          type="button"
          ref={initialFocusRef}
          onClick={onClose}
          aria-label={galleryContent.closeLabel}
          className={roundButtonClass}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="relative mt-3 min-h-0 flex-1" onClick={closeOnBackdrop}>
        {loaded ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[10%] rounded-3xl bg-white/5 motion-safe:animate-pulse"
          />
        )}
        {/* Keyed by photograph, so each one enters with its own slide. */}
        <div key={photo.src} className={`pointer-events-none absolute inset-0 ${ENTER_CLASS[direction]}`}>
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

      {/* The dialog's own aria-label already carries this text. */}
      <p
        aria-hidden="true"
        className="mx-auto mt-4 line-clamp-2 max-w-3xl text-center text-sm leading-relaxed text-ocean-200"
      >
        {photo.alt}
      </p>

      {hasMany && (
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
