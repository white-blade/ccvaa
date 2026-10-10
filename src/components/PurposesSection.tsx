"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

import { subsectionRuleClass, subsectionTitleClass } from "@/components/styles";
import { aboutContent } from "@/lib/site";

const purposes = aboutContent.purposes;

/**
 * Sizes every heading to the tallest heading and every description to the longest
 * description, so an open card is as tall as any other open card and a closed one
 * as any other closed one. The minimums are cleared first so each pass measures the
 * natural size and can shrink as well as grow when the columns reflow.
 */
function alignPurposeCards(list: HTMLElement) {
  const tallest = (selector: string) =>
    Math.max(0, ...Array.from(list.querySelectorAll<HTMLElement>(selector), (element) => element.offsetHeight));
  for (const [property, selector] of [
    ["--purpose-head-h", "[data-purpose-head]"],
    ["--purpose-body-h", "[data-purpose-body]"],
  ] as const) {
    list.style.removeProperty(property);
    const height = tallest(selector);
    if (height > 0) list.style.setProperty(property, `${height}px`);
  }
}

/**
 * The ten purposes as an accordion: each opens on its own, so a visitor reads the
 * one that caught their eye instead of all ten at once, and "Expand all" is there
 * for reading straight through. Open and close animate their height (motion-safe);
 * a closed description is `inert`, so neither Tab nor a screen reader lands in it.
 */
export function PurposesSection() {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const baseId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const allOpen = open.size === purposes.length;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    alignPurposeCards(list);

    // Text wraps differently at a new width, and again once the display font loads.
    // Height changes are the cards opening and closing, which need no remeasure.
    let width = list.offsetWidth;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (list.offsetWidth === width) return;
            width = list.offsetWidth;
            alignPurposeCards(list);
          });
    observer?.observe(list);
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) alignPurposeCards(list);
    });
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, []);

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const toggleAll = () =>
    setOpen(allOpen ? new Set() : new Set(purposes.map((_, index) => index)));

  return (
    <div className="mt-20">
      <div className={`flex items-end justify-between gap-6 ${subsectionRuleClass}`}>
        <h3 className={subsectionTitleClass}>{aboutContent.purposesHeading}</h3>
        <button
          type="button"
          onClick={toggleAll}
          className="group flex shrink-0 items-center gap-2 rounded-full pb-1 text-xs font-semibold uppercase tracking-widest text-ocean-600 transition-colors hover:text-coral-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-4 focus-visible:ring-offset-cream pointer-coarse:min-h-10"
        >
          {allOpen ? aboutContent.purposesCollapseAllLabel : aboutContent.purposesExpandAllLabel}
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-current text-base leading-none transition-transform duration-300 ${
              allOpen ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </button>
      </div>

      {/* items-start: opening one card does not stretch its closed neighbour; the
          measured minimums line up open cards with open, closed with closed. */}
      <ol ref={listRef} className="mt-8 grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4">
        {purposes.map((purpose, index) => {
          const expanded = open.has(index);
          const panelId = `${baseId}-purpose-${index}`;
          return (
            <li
              key={purpose.title}
              className={`fx-rise overflow-hidden rounded-2xl bg-white ring-1 transition-shadow duration-300 ${
                expanded ? "shadow-lg shadow-ocean-950/5 ring-coral/50" : "shadow-sm ring-ocean-100"
              }`}
            >
              <h4>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  data-purpose-head=""
                  style={{ minHeight: "var(--purpose-head-h)" }}
                  className="group flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral pointer-coarse:active:bg-cream sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="w-12 shrink-0 font-display text-3xl italic leading-none text-coral-dark lining-nums sm:text-4xl"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-lg font-semibold text-ocean-900 sm:text-xl">
                    {purpose.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      expanded
                        ? "rotate-180 border-coral bg-coral text-ocean-950"
                        : "border-ocean-200 text-ocean-600 group-hover:border-coral-dark group-hover:text-coral-dark"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </h4>

              {/* Height animates by moving the row from 0fr to 1fr. */}
              <div
                id={panelId}
                role="region"
                aria-label={purpose.title}
                inert={!expanded}
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p
                    data-purpose-body=""
                    style={{ minHeight: "var(--purpose-body-h)" }}
                    className="border-t border-ocean-100 px-5 pb-6 pt-4 text-sm leading-relaxed text-ocean-700 sm:pl-[5.5rem] sm:pr-8"
                  >
                    {purpose.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
