"use client";

import { useId, useState, type ReactNode } from "react";

/** Subsection heading look, shared by `Disclosure` and plain subsection headings. */
export const subsectionRuleClass = "border-b border-ocean-200 pb-4";
export const subsectionTitleClass = "font-display text-2xl font-semibold text-ocean-900 sm:text-3xl";

type DisclosureProps = {
  title: string;
  showLabel: string;
  hideLabel: string;
  /** Rendered always; `expanded` decides how much of it shows. */
  children: (expanded: boolean) => ReactNode;
};

/**
 * A subsection heading that expands its content in place. The heading text stays
 * the button's name — the show/hide hint is visual only, since `aria-expanded`
 * already tells assistive technology the state.
 */
export function Disclosure({ title, showLabel, hideLabel, children }: DisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="mt-20">
      <h3>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={contentId}
          className={`group flex w-full items-end justify-between gap-6 text-left ${subsectionRuleClass} transition-colors hover:border-ocean-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-4 focus-visible:ring-offset-cream`}
        >
          <span className={subsectionTitleClass}>{title}</span>
          <span className="flex shrink-0 items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-widest text-ocean-600 transition-colors group-hover:text-coral-dark">
            <span aria-hidden="true">{expanded ? hideLabel : showLabel}</span>
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 items-center justify-center rounded-full border border-current text-base leading-none transition-transform duration-300 ${
                expanded ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </span>
        </button>
      </h3>

      <div id={contentId}>{children(expanded)}</div>
    </div>
  );
}
