"use client";

import Image from "next/image";
import { useRef, type KeyboardEvent } from "react";

import type { CcvaaEvent } from "@/lib/events";
import { eventsContent } from "@/lib/site";
import type { TimelineLayout } from "@/lib/timeline";

type EventsTimelineProps = {
  events: CcvaaEvent[];
  layout: TimelineLayout;
  /** The event shown zoomed in: the hovered one, else the one scrolled to. */
  activeId: string | null;
  isPast: (event: CcvaaEvent) => boolean;
  onHighlight: (eventId: string | null) => void;
  /** A first tap on touch: zoom in on the dot without opening it. */
  onPreview: (eventId: string) => void;
  onOpen: (eventId: string) => void;
};

/**
 * Up and down arrows step between dots, matching the line's direction. Arrow keys
 * are always keyboard, so the dot reached is highlighted here directly rather than
 * through `:focus-visible`, which browsers do not all apply to scripted focus.
 */
function stepFocus(
  event: KeyboardEvent<HTMLOListElement>,
  onHighlight: (eventId: string | null) => void,
) {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  const dots = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-event-id]")];
  const current = dots.indexOf(document.activeElement as HTMLButtonElement);
  if (current === -1) return;
  event.preventDefault();
  const next = dots[Math.min(Math.max(current + step, 0), dots.length - 1)];
  next.focus();
  onHighlight(next.dataset.eventId ?? null);
}

function percent(position: number): string {
  return `${(position * 100).toFixed(3)}%`;
}

/**
 * A vertical line through the season with a dot on each event's start date,
 * spaced by date. The active dot zooms in and opens a preview card beside it.
 */
export function EventsTimeline({
  events,
  layout,
  activeId,
  isPast,
  onHighlight,
  onPreview,
  onOpen,
}: EventsTimelineProps) {
  /**
   * Touch has no hover, so the zoomed preview would never be seen. On touch the
   * first tap on a dot previews it and a second tap (or a tap on the preview) opens
   * it; mouse, pen, and keyboard open on the first click as usual.
   */
  const pointerTypeRef = useRef("");
  return (
    <nav aria-label={eventsContent.timelineLabel} className="relative h-full">
      {/* Month labels sit left of the line; dots on it; previews to its right. */}
      <div className="absolute inset-y-0 left-18 w-px bg-gradient-to-b from-transparent via-ocean-200 to-transparent" />
      {layout.today !== null ? (
        <div
          aria-hidden="true"
          className="absolute left-18 top-0 w-px bg-gradient-to-b from-transparent to-coral"
          style={{ height: percent(layout.today) }}
        />
      ) : null}

      <ol aria-hidden="true">
        {layout.ticks.map((tick) => (
          <li
            key={tick.iso}
            data-under-today={tick.underToday ? "" : undefined}
            className={`absolute left-0 flex w-18 -translate-y-1/2 items-baseline justify-end gap-1.5 pr-3 font-mono leading-none ${
              tick.underToday ? "[&>[data-tick-month]]:invisible [&>[data-tick-year]]:invisible" : ""
            }`}
            style={{ top: percent(tick.position) }}
          >
            {/* Two fixed-width monospace columns, year then month, so every label
                lines up with the ones above and below it. The year cell is always
                there — empty on most ticks — to hold the month column in place. */}
            <span
              data-tick-year
              className="w-[4ch] text-left text-[0.6875rem] font-bold tabular-nums text-coral-dark"
            >
              {tick.year}
            </span>
            <span
              data-tick-month
              className="w-[3ch] text-left text-[0.625rem] font-medium uppercase text-ocean-500"
            >
              {tick.label}
            </span>
            <span
              className={`absolute top-1/2 h-px ${
                tick.year ? "-right-1.5 w-3 bg-coral" : "-right-1 w-2 bg-ocean-200"
              }`}
            />
          </li>
        ))}
      </ol>

      {layout.today !== null ? (
        <div
          aria-hidden="true"
          className="absolute left-18 flex -translate-x-1/2 -translate-y-1/2 items-center"
          style={{ top: percent(layout.today) }}
        >
          <span className="h-2 w-2 rounded-full bg-ocean-900 ring-4 ring-cream" />
          <span className="absolute right-4 rounded-full bg-ocean-900 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider text-cream">
            {eventsContent.todayLabel}
          </span>
        </div>
      ) : null}

      <ol onKeyDown={(keyEvent) => stepFocus(keyEvent, onHighlight)}>
        {events.map((event) => {
          const position = layout.positions.get(event.id) ?? 0;
          const active = event.id === activeId;
          const past = isPast(event);

          return (
            <li
              key={event.id}
              className={`absolute left-18 -translate-y-1/2 ${
                active ? "z-20" : "z-10"
              }`}
              style={{ top: percent(position) }}
            >
              {/* Hover is tracked on the wrapper so the open preview keeps it alive. */}
              <div
                className="relative"
                onPointerEnter={(pointer) => {
                  if (pointer.pointerType !== "touch") onHighlight(event.id);
                }}
                onPointerLeave={(pointer) => {
                  if (pointer.pointerType !== "touch") onHighlight(null);
                }}
              >
                <button
                  type="button"
                  data-event-id={event.id}
                  onPointerDown={(pointer) => {
                    pointerTypeRef.current = pointer.pointerType;
                  }}
                  onClick={() => {
                    const touch = pointerTypeRef.current === "touch";
                    pointerTypeRef.current = "";
                    if (touch && !active) onPreview(event.id);
                    else onOpen(event.id);
                  }}
                  onFocus={(focus) => {
                    if (focus.currentTarget.matches(":focus-visible")) onHighlight(event.id);
                  }}
                  onBlur={() => onHighlight(null)}
                  aria-haspopup="dialog"
                  aria-label={`${event.title} — ${event.dateLabel} — ${event.location}`}
                  aria-current={active ? "true" : undefined}
                  // Padding widens the tap target well past the 14px dot.
                  className="group relative flex items-center rounded-full py-2 focus:outline-none pointer-coarse:py-3"
                >
                  <span className="relative -ml-[7px] flex h-3.5 w-3.5 items-center justify-center">
                    {active ? (
                      <span className="absolute inset-0 rounded-full bg-coral/50 motion-safe:animate-ping" />
                    ) : null}
                    <span
                      className={`relative h-3.5 w-3.5 rounded-full ring-4 ring-cream transition-transform duration-300 group-focus-visible:ring-coral/40 ${
                        past ? "bg-ocean-400" : "bg-coral"
                      } ${active ? "scale-150" : "group-hover:scale-125"}`}
                    />
                  </span>

                  {/* At rest: a quiet title. Active: it zooms into a preview card. */}
                  <span
                    className={`ml-4 max-w-[11rem] truncate text-left text-xs font-medium text-ocean-600 transition-all duration-300 ${
                      active ? "scale-95 opacity-0" : "opacity-100"
                    }`}
                  >
                    {event.title}
                  </span>
                </button>

                {/* A visual zoom of what the button's name already says — outside the
                    button, so the name and the visible text inside it stay the same. */}
                <span
                  aria-hidden="true"
                  onClick={() => onOpen(event.id)}
                  className={`absolute left-6 top-1/2 w-56 origin-left -translate-y-1/2 overflow-hidden rounded-2xl bg-white text-left shadow-2xl shadow-ocean-950/20 ring-1 ring-coral/40 transition-all duration-300 ease-out cursor-pointer ${
                    active
                      ? "scale-100 opacity-100"
                      : "pointer-events-none scale-75 opacity-0"
                  }`}
                >
                  {event.image ? (
                    <span className="relative block h-24 w-full bg-ocean-900">
                      <Image
                        src={event.image.src}
                        alt=""
                        fill
                        unoptimized
                        loading="lazy"
                        sizes="14rem"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="block h-2 w-full bg-gradient-to-r from-coral to-coral-dark" />
                  )}
                  <span className="block p-3">
                    <span className="block text-[0.625rem] font-semibold uppercase tracking-wider text-coral-dark">
                      {event.dateLabel}
                    </span>
                    <span className="mt-1 block font-display text-sm font-semibold leading-snug text-ocean-900">
                      {event.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.6875rem] text-ocean-500">
                      {event.location}
                    </span>
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
