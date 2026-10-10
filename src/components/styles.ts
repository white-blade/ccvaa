/**
 * Class strings shared across components, so a look defined once stays one look.
 */

/** The heading of a subsection inside a section (Our Board, Our Purposes). */
export const subsectionRuleClass = "border-b border-ocean-200 pb-4";
export const subsectionTitleClass =
  "font-display text-2xl font-semibold text-ocean-900 sm:text-3xl";

/** A round 44px icon button on a dark surface: viewer controls, profile arrows. */
export const roundButtonClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 text-cream transition-colors hover:border-coral hover:bg-white/10 hover:text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";

/** The same, glazed, for sitting on top of a photograph: dialog close buttons. */
export const roundGlassButtonClass = `${roundButtonClass} bg-ocean-950/40 backdrop-blur-sm hover:bg-ocean-950/70`;
