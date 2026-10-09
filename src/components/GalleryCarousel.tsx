"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";

const ADVANCE_MS = 5000;

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Prerender as if motion is reduced, so the static HTML never ships a
 * "playing" carousel. React swaps in the real value right after hydration.
 */
function readReducedMotionOnServer() {
  return true;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  );
}

type GalleryCarouselProps = {
  photos: GalleryPhoto[];
};

export function GalleryCarousel({ photos }: GalleryCarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [index, setIndex] = useState(0);
  /** null = follow the motion preference; true/false = the visitor decided. */
  const [playOverride, setPlayOverride] = useState<boolean | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement>(null);

  const wantsPlay = playOverride ?? !prefersReducedMotion;
  const isPlaying = wantsPlay && !interacting && !zoomed && photos.length > 1;

  const step = useCallback(
    (delta: number) =>
      setIndex((current) => (current + delta + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => step(1), ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPlaying, step]);

  // Lightbox: Escape to close, arrows to move, Tab kept inside, scroll locked.
  useEffect(() => {
    if (!zoomed) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setZoomed(false);
        return;
      }
      if (event.key === "ArrowRight") {
        step(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        step(-1);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed, step]);

  function closeZoom() {
    setZoomed(false);
    returnFocusRef.current?.focus();
  }

  const active = photos[index];
  const position = `${index + 1} / ${photos.length}`;

  const controlClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 transition-colors hover:border-ocean-400 hover:bg-ocean-50";

  return (
    <div
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={galleryContent.title}
        className="relative h-[22rem] overflow-hidden rounded-3xl border border-ocean-100 bg-ocean-100 sm:h-[30rem]"
      >
        {photos.map((photo, photoIndex) => (
          <div
            key={photo.file}
            className={`absolute inset-0 transition-opacity duration-700 ${
              photoIndex === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={photoIndex !== index}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              unoptimized
              // `contain`, not `cover`: these are artworks and the set mixes
              // portrait with landscape — cropping them would be wrong.
              className="object-contain"
              sizes="(min-width: 1024px) 64rem, 100vw"
              priority={photoIndex === 0}
              loading={photoIndex === 0 ? undefined : "lazy"}
            />
          </div>
        ))}

        <button
          type="button"
          ref={returnFocusRef}
          onClick={() => setZoomed(true)}
          className="absolute inset-0 h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
        >
          <span className="sr-only">{galleryContent.zoomLabel}</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={galleryContent.previousLabel}
            className={controlClass}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <button
            type="button"
            onClick={() => setPlayOverride(!wantsPlay)}
            aria-label={
              wantsPlay ? galleryContent.pauseLabel : galleryContent.playLabel
            }
            className={controlClass}
          >
            <span aria-hidden="true">{wantsPlay ? "❚❚" : "▶"}</span>
          </button>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label={galleryContent.nextLabel}
            className={controlClass}
          >
            <span aria-hidden="true">›</span>
          </button>

          <p className="ml-2 text-sm lining-nums tabular-nums text-ocean-500">
            {position}
          </p>
        </div>

        <ul className="flex items-center gap-2">
          {photos.map((photo, photoIndex) => (
            <li key={photo.file}>
              <button
                type="button"
                onClick={() => setIndex(photoIndex)}
                aria-label={`${galleryContent.goToLabel} ${photoIndex + 1}`}
                aria-current={photoIndex === index}
                className={`block h-2.5 w-2.5 rounded-full transition-colors ${
                  photoIndex === index
                    ? "bg-coral-dark"
                    : "bg-ocean-200 hover:bg-ocean-400"
                }`}
              />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ocean-600">
        {active.alt}
      </p>

      {zoomed && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-[100] flex flex-col bg-ocean-950/95 p-4 backdrop-blur-sm sm:p-8"
        >
          <div className="flex items-center justify-between gap-4 text-cream">
            <p className="text-sm lining-nums tabular-nums">{position}</p>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={closeZoom}
              aria-label={galleryContent.closeLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-cream transition-colors hover:bg-white/10"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Image
              src={active.src}
              alt={active.alt}
              fill
              unoptimized
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={galleryContent.previousLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-cream transition-colors hover:bg-white/10"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={galleryContent.nextLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-cream transition-colors hover:bg-white/10"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
