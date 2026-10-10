"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

import { GalleryCredit } from "@/components/GalleryCredit";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { GalleryPicture } from "@/components/GalleryPicture";
import { StepIcon } from "@/components/StepIcon";
import { roundButtonClass, roundGlassButtonClass } from "@/components/styles";
import type { GalleryPhoto } from "@/lib/gallery";
import { dotWindow, MAX_DOTS, MAX_DOTS_NARROW, nextDotStart, type DotScale } from "@/lib/dot-window";
import { galleryContent } from "@/lib/site";
import { singleTouch, swipeBetween, touchEnd, type Point } from "@/lib/swipe";
import { formatIsoDate } from "@/lib/text";
import { useAutoplay } from "@/lib/use-autoplay";

type GallerySliderProps = {
  photos: GalleryPhoto[];
};

/** The photograph slides in from the side the visitor moved toward; the first is simply there. */
const ENTER_CLASS = {
  [-1]: "motion-safe:animate-photo-from-left",
  0: "",
  1: "motion-safe:animate-photo-from-right",
} as const;

const twoDigits = (n: number) => String(n).padStart(2, "0");

/** Dot sizes for the wide window (from sm) and the narrow one (below sm). Literal, for Tailwind. */
const DOT_SCALE_WIDE: Record<DotScale, string> = { small: "sm:scale-50", medium: "sm:scale-75", full: "" };
const DOT_SCALE_NARROW: Record<DotScale, string> = { small: "max-sm:scale-50", medium: "max-sm:scale-75", full: "" };

/**
 * The gallery as a slideshow: one photograph at a time, stepped by the arrows, the
 * dots, a swipe, or the slideshow itself. Tapping the photograph opens the
 * full-size viewer.
 *
 * One markup, two layouts, told apart by width alone. From `md` the photograph fills
 * the stage and its credits sit at the top right, over a veil that is clear on the
 * left and deepens to frosted dark on the right. Below `md` it is a card: the
 * photograph, then the credits beneath it, with no veil.
 */
/** How wide a slide is drawn: the section's full width, capped at its container. */
const SLIDE_SIZES = "(min-width: 1280px) 76rem, 100vw";

export function GallerySlider({ photos }: GallerySliderProps) {
  /** The current work, and where each dot window (wide, narrow) starts: they move together. */
  const [nav, setNav] = useState({ index: 0, wide: 0, narrow: 0 });
  const index = nav.index;
  /** Which way the visitor last moved, so the next photograph slides in from there. */
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const touchStart = useRef<Point | null>(null);

  const count = photos.length;
  const hasMany = count > 1;
  const photo = photos[index];

  const moveTo = useCallback(
    (target: (current: number) => number) =>
      setNav((previous) => {
        const next = target(previous.index);
        return {
          index: next,
          wide: nextDotStart({ index: previous.index, start: previous.wide }, next, count, MAX_DOTS),
          narrow: nextDotStart({ index: previous.index, start: previous.narrow }, next, count, MAX_DOTS_NARROW),
        };
      }),
    [count],
  );
  const step = useCallback(
    (delta: -1 | 1) => {
      setDirection(delta);
      moveTo((current) => (current + delta + count) % count);
    },
    [count, moveTo],
  );
  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);
  const select = (target: number) => {
    setDirection(target === index ? 0 : target > index ? 1 : -1);
    moveTo(() => target);
  };
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const autoplay = useAutoplay({
    interval: galleryContent.autoplaySeconds * 1000,
    onAdvance: next,
    held: !hasMany || hovered || focused || viewerOpen,
    restartKey: index,
  });

  // Fetch the next work now, at the size this screen will use, so the slideshow
  // never waits on the network.
  useEffect(() => {
    if (!hasMany) return;
    const upcoming = photos[(index + 1) % count];
    const prefetch = new window.Image();
    if (upcoming.srcSet) {
      prefetch.sizes = SLIDE_SIZES;
      prefetch.srcset = upcoming.srcSet;
    }
    prefetch.src = upcoming.src;
  }, [count, hasMany, index, photos]);

  // A mouse resting on the slideshow holds it; touch has no hover, so a tap does not.
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") setHovered(true);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "touch") setHovered(false);
  };
  // Keyboard focus anywhere inside holds it until focus leaves the slideshow.
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(":focus-visible")) setFocused(true);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  // Left and right swipes step; vertical scrolls, diagonals, and pinches are left alone.
  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = singleTouch(event);
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart.current || !hasMany) return;
    const swipe = swipeBetween(touchStart.current, touchEnd(event));
    touchStart.current = null;
    if (swipe === "left") next();
    else if (swipe === "right") previous();
  };

  const takenOn = photo.takenAt ? formatIsoDate(photo.takenAt) : null;
  const dots = dotWindow(index, count, MAX_DOTS, nav.wide);
  const narrowDots = dotWindow(index, count, MAX_DOTS_NARROW, nav.narrow);
  const inNarrow = (dot: number) => dot >= narrowDots.start && dot < narrowDots.end;
  const inWide = (dot: number) => dot >= dots.start && dot < dots.end;
  // The two windows move independently, so render every dot either one shows and
  // hide each, per breakpoint, outside its own window.
  const firstDot = Math.min(dots.start, narrowDots.start);
  const lastDot = Math.max(dots.end, narrowDots.end);

  return (
    <>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={galleryContent.sliderLabel}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="fx-tile relative overflow-clip rounded-3xl bg-ocean-900 shadow-2xl shadow-black/30 ring-1 ring-white/10"
        >
          {/* Announced when the visitor changes the slide, not every few seconds. */}
          <div aria-live={autoplay.running ? "off" : "polite"}>
            {/* Not keyed by photograph: the button stays, so focus can come back to
              it from the viewer. Only the picture and the credits re-enter. */}
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${count}`}
              className="flex flex-col md:relative md:block md:h-[clamp(26rem,68svh,44rem)]"
            >
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                aria-haspopup="dialog"
                className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral md:absolute md:inset-0 md:aspect-auto"
              >
                <span className="fx-tile-image absolute inset-0 block">
                  <span key={photo.file} className={`absolute inset-0 block ${ENTER_CLASS[direction]}`}>
                    {/* A slow drift closer while the work is shown (motion-safe). */}
                    <span data-slow-zoom className="absolute inset-0 block motion-safe:animate-slow-zoom">
                      <GalleryPicture
                        photo={photo}
                        sizes={SLIDE_SIZES}
                        fit="cover"
                        priority={index === 0}
                        className="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                      />
                    </span>
                  </span>
                </span>

                {/* The veil: clear on the left, deepening to a frosted dark on the right
                  where the credits sit. Wide screens only — a phone's card has its
                  credits below the photograph. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden backdrop-blur-xl [mask-image:linear-gradient(to_right,transparent_42%,black_78%)] md:block"
                />
                <span
                  aria-hidden="true"
                  data-veil
                  className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,transparent_22%,rgb(20_28_24/0.5)_52%,rgb(20_28_24/0.88)_76%,rgb(20_28_24/0.94))] md:block"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(160deg,rgb(255_255_255/0.12),transparent_38%)] [mask-image:linear-gradient(to_right,transparent_45%,black_80%)] md:block"
                />

                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ocean-950/70 px-3.5 py-1.5 text-xs font-semibold text-cream shadow-sm ring-1 ring-white/15 backdrop-blur-sm transition-colors group-hover:bg-ocean-950/85 group-focus-visible:bg-ocean-950/85 md:bottom-6 md:left-6">
                  <span aria-hidden="true" className="text-coral">
                    ⤢
                  </span>
                  {galleryContent.zoomLabel}
                </span>
              </button>

              <div
                key={photo.file}
                data-credits
                className="min-h-52 p-5 motion-safe:animate-caption-in sm:min-h-44 sm:p-6 md:pointer-events-none md:absolute md:right-0 md:top-0 md:min-h-0 md:w-[min(26rem,42%)] md:p-10 lg:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-coral lining-nums tabular-nums">
                  {twoDigits(index + 1)}
                  <span aria-hidden="true" className="mx-2 text-ocean-200">
                    /
                  </span>
                  <span className="sr-only">of</span>
                  {twoDigits(count)}
                </p>
                {photo.author ? (
                  <p className="mt-3 font-display text-2xl font-semibold leading-tight text-white md:mt-5 lg:text-3xl">
                    <span className="sr-only">{galleryContent.authorPrefix} </span>
                    {photo.author}
                  </p>
                ) : null}
                {takenOn || photo.medium ? (
                  <p className="mt-1 text-sm text-ocean-100 md:mt-2">
                    {photo.medium}
                    {photo.medium && takenOn ? (
                      <span aria-hidden="true" className="mx-2 text-coral/70">
                        ·
                      </span>
                    ) : null}
                    {takenOn ? (
                      <>
                        <span className="sr-only">{photo.medium ? ", " : ""}{galleryContent.takenPrefix} </span>
                        <time dateTime={photo.takenAt}>{takenOn}</time>
                      </>
                    ) : null}
                  </p>
                ) : null}
                <span aria-hidden="true" className="mt-4 block h-px w-12 bg-coral/70 md:mt-6" />
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ocean-100 md:mt-6 md:line-clamp-6 lg:text-base">
                  {photo.description ?? photo.alt}
                </p>
                {/* Links, so they take pointer events back from the veil's credits block. */}
                <GalleryCredit photo={photo} className="pointer-events-auto mt-4 md:mt-6" />
              </div>
            </div>
          </div>

          {/* Fills as the slideshow counts down to the next work. Only while it runs:
            a hold restarts the count, so the line starts again with it. */}
          {autoplay.running ? (
            <span
              key={index}
              aria-hidden="true"
              data-slide-progress
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5 origin-left bg-coral/80 motion-safe:animate-[slide-progress_linear_both] motion-reduce:hidden"
              style={{ animationDuration: `${galleryContent.autoplaySeconds}s` }}
            />
          ) : null}

          {hasMany ? (
            <button
              type="button"
              onClick={autoplay.toggle}
              aria-label={autoplay.playing ? galleryContent.pauseLabel : galleryContent.playLabel}
              className={`absolute left-3 top-3 md:left-6 md:top-6 ${roundGlassButtonClass}`}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                {autoplay.playing ? (
                  <path d="M4 2.5h2.5v11H4zM9.5 2.5H12v11H9.5z" />
                ) : (
                  <path d="M4.5 2.2v11.6L13.5 8z" />
                )}
              </svg>
            </button>
          ) : null}
        </div>

        {hasMany ? (
          // One row on every screen: first, previous, dots, next, last. Below sm, to
          // fit 320px, the buttons are 40px (the tap-target floor), the dots' hit
          // areas narrower, and only the narrow window of five dots shows.
          <div className="mt-5 flex items-center justify-center gap-x-0.5 min-[360px]:gap-x-2 sm:mt-6 sm:gap-x-3">
            <button
              type="button"
              onClick={() => index !== 0 && select(0)}
              aria-label={galleryContent.firstLabel}
              aria-disabled={index === 0}
              className={`${roundButtonClass} max-sm:h-10 max-sm:w-10 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:border-white/25 aria-disabled:hover:bg-transparent aria-disabled:hover:text-cream`}
            >
              <StepIcon to="first" />
            </button>
            <button
              type="button"
              onClick={previous}
              aria-label={galleryContent.previousLabel}
              className={`${roundButtonClass} max-sm:h-10 max-sm:w-10`}
            >
              <StepIcon to="previous" />
            </button>

            <ol
              aria-label={galleryContent.dotsLabel}
              className="flex items-center justify-center"
            >
              {photos.slice(firstDot, lastDot).map((each, offset) => {
                const dotIndex = firstDot + offset;
                const current = dotIndex === index;
                return (
                  <li
                    key={each.file}
                    data-dot-scale={inWide(dotIndex) ? dots.scale(dotIndex) : "hidden"}
                    data-dot-narrow={inNarrow(dotIndex) ? narrowDots.scale(dotIndex) : "hidden"}
                    className={`${inWide(dotIndex) ? "" : "sm:hidden"} ${inNarrow(dotIndex) ? "" : "max-sm:hidden"}`}
                  >
                    <button
                      type="button"
                      onClick={() => select(dotIndex)}
                      aria-label={`${galleryContent.showPhotoLabel} ${dotIndex + 1}`}
                      aria-current={current ? "true" : undefined}
                      className="group flex h-10 w-5 items-center justify-center rounded-full sm:w-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral pointer-fine:h-8"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-2 rounded-full transition-all duration-300 ${inWide(dotIndex) ? DOT_SCALE_WIDE[dots.scale(dotIndex)] : ""} ${inNarrow(dotIndex) ? DOT_SCALE_NARROW[narrowDots.scale(dotIndex)] : ""} ${
                          current
                            ? "w-5 bg-coral"
                            : "w-2 bg-white/50 group-hover:bg-white/80 group-focus-visible:bg-white/80"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              onClick={next}
              aria-label={galleryContent.nextLabel}
              className={`${roundButtonClass} max-sm:h-10 max-sm:w-10`}
            >
              <StepIcon to="next" />
            </button>
            <button
              type="button"
              onClick={() => index !== count - 1 && select(count - 1)}
              aria-label={galleryContent.lastLabel}
              aria-disabled={index === count - 1}
              className={`${roundButtonClass} max-sm:h-10 max-sm:w-10 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:border-white/25 aria-disabled:hover:bg-transparent aria-disabled:hover:text-cream`}
            >
              <StepIcon to="last" />
            </button>
          </div>
        ) : null}
      </div>

      {viewerOpen ? (
        <GalleryLightbox
          photos={photos}
          index={index}
          direction={direction}
          onClose={closeViewer}
          onNext={next}
          onPrevious={previous}
          onSelect={select}
        />
      ) : null}
    </>
  );
}
