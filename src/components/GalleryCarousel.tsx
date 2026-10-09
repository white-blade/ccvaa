"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { GalleryLightbox } from "@/components/GalleryLightbox";
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

  const closeZoom = useCallback(() => {
    setZoomed(false);
    returnFocusRef.current?.focus();
  }, []);

  const goNext = useCallback(() => step(1), [step]);
  const goPrevious = useCallback(() => step(-1), [step]);

  const active = photos[index];
  const position = `${index + 1} / ${photos.length}`;

  const controlClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 transition-colors hover:border-ocean-400 hover:bg-ocean-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2";

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
        className="relative h-[24rem] overflow-hidden rounded-3xl border border-ocean-100 bg-ocean-900 shadow-sm sm:h-[32rem]"
      >
        {photos.map((photo, photoIndex) => (
          <div
            key={photo.file}
            className={`absolute inset-0 transition-opacity duration-700 ${
              photoIndex === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={photoIndex !== index}
          >
            {/* The same file, blurred and cropped to fill: the photographs mix
                portrait with landscape, and this mats the empty sides instead of
                leaving flat bars. No extra request — the browser already has it. */}
            <Image
              src={photo.src}
              alt=""
              aria-hidden="true"
              fill
              unoptimized
              className="scale-110 object-cover opacity-40 blur-2xl"
              sizes="(min-width: 1024px) 64rem, 100vw"
              loading="lazy"
            />
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

        <p className="pointer-events-none absolute right-4 top-4 rounded-full bg-ocean-950/60 px-3 py-1 text-xs font-medium lining-nums tabular-nums text-cream">
          {position}
        </p>

        {/* Overlaid rather than set below the stage, so the caption changing
            length as photos advance cannot shift the page. The image's own alt
            carries this text for assistive tech. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/85 via-ocean-950/45 to-transparent px-5 pb-5 pt-12 sm:px-7 sm:pb-7">
          <p
            aria-hidden="true"
            className="line-clamp-3 text-sm leading-relaxed text-cream/90"
          >
            {active.alt}
          </p>
        </div>

        <button
          type="button"
          ref={returnFocusRef}
          onClick={() => setZoomed(true)}
          className="absolute inset-0 h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral"
        >
          <span className="sr-only">{galleryContent.zoomLabel}</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevious}
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
            onClick={goNext}
            aria-label={galleryContent.nextLabel}
            className={controlClass}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        {/* Thumbnails instead of dots: they say which photograph you are picking.
            Same URLs as the slides, so they add no bytes to the page. */}
        <ul className="-mx-1 flex max-w-full items-center gap-2 overflow-x-auto px-1 py-1">
          {photos.map((photo, photoIndex) => (
            <li key={photo.file} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(photoIndex)}
                aria-label={`${galleryContent.goToLabel} ${photoIndex + 1}`}
                aria-current={photoIndex === index}
                className={`relative block h-12 w-12 overflow-hidden rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 ${
                  photoIndex === index
                    ? "border-coral-dark ring-2 ring-coral-dark/40"
                    : "border-ocean-200 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="48px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-800 transition-colors hover:text-coral-dark"
        >
          {galleryContent.viewAllLabel}
          <span aria-hidden="true">→</span>
        </Link>
      </p>

      {zoomed && (
        <GalleryLightbox
          photos={photos}
          index={index}
          onClose={closeZoom}
          onNext={goNext}
          onPrevious={goPrevious}
        />
      )}
    </div>
  );
}
