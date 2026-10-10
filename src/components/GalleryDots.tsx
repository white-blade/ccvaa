"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { GalleryPicture } from "@/components/GalleryPicture";
import type { GalleryPhoto } from "@/lib/gallery";
import { dotWindow, MAX_DOTS, MAX_DOTS_NARROW, type DotScale } from "@/lib/dot-window";
import { hoverFocusHandlers } from "@/lib/hover-focus";
import { galleryContent } from "@/lib/site";

type GalleryDotsProps = {
  photos: GalleryPhoto[];
  index: number;
  /** Where the wide (from sm) and narrow (below sm) dot windows start; see `nextDotStart`. */
  wideStart: number;
  narrowStart: number;
  onSelect: (dot: number) => void;
  /** Seconds the slideshow counts down to the next work, or null while it is held or paused. */
  countdown: number | null;
};

/** Dot sizes for the wide window (from sm) and the narrow one (below sm). Literal, for Tailwind. */
const DOT_SCALE_WIDE: Record<DotScale, string> = { small: "sm:scale-50", medium: "sm:scale-75", full: "" };
const DOT_SCALE_NARROW: Record<DotScale, string> = { small: "max-sm:scale-50", medium: "max-sm:scale-75", full: "" };

/** The pill is as wide as the current dot's button, up to 24px. */
const PILL_MAX = 24;

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * The slideshow's dots, on a glass track. The current work is marked by one coral
 * pill that glides from dot to dot — its leading edge first, so it stretches toward
 * the next dot and then settles — and fills, while the slideshow runs, as it counts
 * down to the next work. A dot under the mouse or keyboard focus lifts a small
 * preview of its work above the row; touch has no hover, and a tap simply goes there.
 *
 * Until scripts measure the row the current dot draws itself, so the page reads the
 * same without them; reduced motion moves the pill without the glide.
 */
export function GalleryDots({ photos, index, wideStart, narrowStart, onSelect, countdown }: GalleryDotsProps) {
  const count = photos.length;
  const dots = dotWindow(index, count, MAX_DOTS, wideStart);
  const narrowDots = dotWindow(index, count, MAX_DOTS_NARROW, narrowStart);
  const inNarrow = (dot: number) => dot >= narrowDots.start && dot < narrowDots.end;
  const inWide = (dot: number) => dot >= dots.start && dot < dots.end;
  // The two windows move independently, so render every dot either one shows and
  // hide each, per breakpoint, outside its own window.
  const firstDot = Math.min(dots.start, narrowDots.start);
  const lastDot = Math.max(dots.end, narrowDots.end);

  const trackRef = useRef<HTMLDivElement>(null);
  /** The pill's edges, in px from the track's left and right; null until measured. */
  const [pill, setPill] = useState<{ left: number; right: number; toward: -1 | 1 } | null>(null);
  /** The dot whose preview shows, and its centre in px from the track's left. */
  const [peekDot, setPeekDot] = useState<number | null>(null);
  const [peekX, setPeekX] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const current = track.querySelector<HTMLElement>('[aria-current="true"]');
      if (!current) return;
      const box = track.getBoundingClientRect();
      const dot = current.getBoundingClientRect();
      const inset = Math.max(0, (dot.width - PILL_MAX) / 2);
      const left = dot.left - box.left + inset;
      const right = box.right - dot.right + inset;
      setPill((previous) =>
        previous?.left === left && previous.right === right
          ? previous
          : { left, right, toward: previous && left < previous.left ? -1 : 1 },
      );
    };
    measure();
    // The row changes shape across breakpoints (five dots or seven, wider buttons).
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index, wideStart, narrowStart]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const button = peekDot === null ? null : track?.querySelector(`[data-dot="${peekDot}"]`);
    if (!track || !button) return;
    const box = button.getBoundingClientRect();
    setPeekX(box.left + box.width / 2 - track.getBoundingClientRect().left);
  }, [peekDot, wideStart, narrowStart]);

  // The current work is already on the stage; its dot needs no preview.
  const peeked = peekDot !== null && peekDot !== index ? photos[peekDot] : null;

  return (
    <div
      ref={trackRef}
      className="relative rounded-full bg-white/[0.06] px-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/10 sm:px-1.5"
    >
      {pill ? (
        // Edges move separately: the leading one goes first, the trailing one
        // follows, so the pill stretches toward its new dot and then settles.
        <span
          aria-hidden="true"
          data-dot-pill
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full motion-safe:transition-[left,right] motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.65,0,0.35,1)] motion-safe:[transition-delay:var(--trail),var(--lead)]"
          style={
            {
              left: pill.left,
              right: pill.right,
              "--lead": pill.toward === 1 ? "0ms" : "110ms",
              "--trail": pill.toward === 1 ? "110ms" : "0ms",
            } as CSSProperties
          }
        >
          <span className={`absolute inset-0 rounded-full ${countdown ? "bg-coral/35" : "bg-coral"}`} />
          {/* Fills as the slideshow counts down; restarted for each work, gone on a hold. */}
          {countdown ? (
            <span
              key={index}
              data-slide-progress
              className="absolute inset-0 origin-left rounded-full bg-coral motion-safe:animate-[slide-progress_linear_both] motion-reduce:hidden"
              style={{ animationDuration: `${countdown}s` }}
            />
          ) : null}
        </span>
      ) : null}

      <ol aria-label={galleryContent.dotsLabel} className="relative flex items-center justify-center">
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
                onClick={() => onSelect(dotIndex)}
                aria-label={`${galleryContent.showPhotoLabel} ${dotIndex + 1}`}
                aria-current={current ? "true" : undefined}
                className="group flex h-10 w-5 items-center justify-center rounded-full sm:w-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral pointer-fine:h-8"
                data-dot={dotIndex}
                {...hoverFocusHandlers(
                  () => setPeekDot(dotIndex),
                  () => setPeekDot((shown) => (shown === dotIndex ? null : shown)),
                )}
              >
                <span
                  aria-hidden="true"
                  className={`block h-2 rounded-full transition-all duration-300 ${inWide(dotIndex) ? DOT_SCALE_WIDE[dots.scale(dotIndex)] : ""} ${inNarrow(dotIndex) ? DOT_SCALE_NARROW[narrowDots.scale(dotIndex)] : ""} ${
                    current
                      ? // Under the pill once it is measured; drawn in coral until then.
                        `w-5 sm:w-6 ${pill ? "bg-transparent" : "bg-coral"}`
                      : "w-2 bg-white/50 group-hover:bg-white/80 group-focus-visible:bg-white/80"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>

      {peeked ? (
        <span
          aria-hidden="true"
          data-dot-peek
          className="pointer-events-none absolute bottom-full z-20 mb-3 -translate-x-1/2"
          style={{ left: peekX }}
        >
          <span className="block overflow-hidden rounded-xl bg-ocean-900 shadow-xl shadow-black/40 ring-1 ring-white/20 motion-safe:animate-peek-in">
            <span className="relative block aspect-[4/3] w-28">
              <GalleryPicture photo={peeked} sizes="112px" fit="cover" />
            </span>
            <span className="block w-28 truncate px-2.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.2em] text-cream lining-nums tabular-nums">
              {twoDigits(peekDot! + 1)}
              {peeked.author ? <span className="ml-2 font-normal tracking-normal text-ocean-100">{peeked.author}</span> : null}
            </span>
          </span>
        </span>
      ) : null}
    </div>
  );
}
