"use client";

import Image from "next/image";
import type { MouseEvent } from "react";

import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";
import { useDialog } from "@/lib/use-dialog";

type GalleryLightboxProps = {
  photos: GalleryPhoto[];
  /** Index into `photos` of the photograph on screen. */
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

const controlClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-cream transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";

/**
 * Full-screen viewer shared by the home-page carousel and the gallery grid.
 * Escape, arrow keys, the focus trap, and the scroll lock come from `useDialog`;
 * restoring focus to whatever opened it stays with the caller.
 */
export function GalleryLightbox({
  photos,
  index,
  onClose,
  onNext,
  onPrevious,
}: GalleryLightboxProps) {
  const { dialogRef, initialFocusRef } = useDialog({
    open: true,
    onClose,
    onNext,
    onPrevious,
  });

  const photo = photos[index];
  const position = `${index + 1} / ${photos.length}`;
  const hasMany = photos.length > 1;

  /** Only a click on the dark surround closes — never one on the image itself. */
  function closeOnBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      onClick={closeOnBackdrop}
      className="fixed inset-0 z-[100] flex flex-col bg-ocean-950/95 p-4 backdrop-blur-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm lining-nums tabular-nums text-ocean-200">
          {position}
        </p>
        <button
          type="button"
          ref={initialFocusRef}
          onClick={onClose}
          aria-label={galleryContent.closeLabel}
          className={controlClass}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={closeOnBackdrop}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          unoptimized
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {/* The dialog's own aria-label already carries this text. */}
      <p
        aria-hidden="true"
        className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-ocean-200"
      >
        {photo.alt}
      </p>

      {hasMany && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPrevious}
            aria-label={galleryContent.previousLabel}
            className={controlClass}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={galleryContent.nextLabel}
            className={controlClass}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  );
}
