import type { ReactNode } from "react";

import { Reveal } from "@/components/Reveal";
import { sectionNumber, type SectionId } from "@/lib/site";

type Tone = "light" | "mist" | "dark";

type SectionProps = {
  id: SectionId;
  tone?: Tone;
  eyebrow: string;
  title: string;
  description?: string;
  /** Soft colour blooms behind the content. */
  glow?: boolean;
  children: ReactNode;
};

const TONES: Record<
  Tone,
  {
    section: string;
    eyebrow: string;
    title: string;
    description: string;
    glows: [string, string];
    /** Outline colour for the ghost numeral (see .section-ghost). */
    ghostInk: string;
  }
> = {
  light: {
    section: "bg-cream text-ocean-900",
    eyebrow: "text-coral-dark",
    title: "text-ocean-900",
    description: "text-ocean-700",
    glows: ["bg-coral/15", "bg-ocean-200/50"],
    ghostInk: "[--ghost-ink:var(--color-ocean-900)]",
  },
  mist: {
    section: "bg-ocean-50 text-ocean-900",
    eyebrow: "text-coral-dark",
    title: "text-ocean-900",
    description: "text-ocean-700",
    glows: ["bg-coral/20", "bg-white/70"],
    ghostInk: "[--ghost-ink:var(--color-ocean-900)]",
  },
  dark: {
    section: "bg-ocean-950 text-white",
    eyebrow: "text-coral",
    title: "text-white",
    description: "text-ocean-100",
    glows: ["bg-coral/20", "bg-ocean-600/30"],
    ghostInk: "[--ghost-ink:var(--color-cream)]",
  },
};

/**
 * One numbered section of the page: anchor, tone, heading, and container. The
 * number comes from the section's place in the nav, so the two never disagree.
 */
export function Section({
  id,
  tone = "light",
  eyebrow,
  title,
  description,
  glow = false,
  children,
}: SectionProps) {
  const styles = TONES[tone];
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      // Focusable so in-page navigation can land keyboard and screen-reader users here;
      // the scroll margin is the header's measured height (--header-h). overflow-clip,
      // not -hidden, trims the glows: hidden makes the section a scroll container,
      // which silently stops the sticky timeline and date rail inside from sticking.
      tabIndex={-1}
      // section-aperture: tinted sections open from an inset window as they scroll in
      // (globals.css); on the cream page a cream section would show no edge.
      className={`relative isolate scroll-mt-(--header-h) focus:outline-none overflow-clip py-20 sm:py-28 ${styles.section} fx-divider ${
        tone === "light" ? "" : "section-aperture"
      }`}
    >
      {glow ? (
        <>
          <div
            aria-hidden="true"
            className={`absolute -right-40 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full blur-3xl ${styles.glows[0]}`}
          />
          <div
            aria-hidden="true"
            className={`absolute -bottom-40 -left-40 -z-10 h-[26rem] w-[26rem] rounded-full blur-3xl ${styles.glows[1]}`}
          />
        </>
      ) : null}

      <div className="mx-auto max-w-6xl px-6">
        {/* The section's number, huge and outlined, drifting behind the heading
            at its own pace as the page scrolls (globals.css). Pure decoration, so it
            is drawn by CSS from data-ghost rather than written as text: neither
            screen readers nor contrast checks should treat it as content. */}
        <span
          aria-hidden="true"
          data-ghost={sectionNumber(id)}
          className={`section-ghost ${styles.ghostInk} pointer-events-none absolute right-3 top-4 -z-10 select-none font-display text-[6rem] font-semibold italic leading-none sm:right-10 sm:top-10 sm:text-[14rem] lg:text-[18rem]`}
        />

        <Reveal className="max-w-3xl">
          <p
            className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] sm:text-sm ${styles.eyebrow}`}
          >
            <span className="font-display text-base font-normal italic tracking-normal sm:text-lg">
              {sectionNumber(id)}
            </span>
            <span aria-hidden="true" className="section-rule h-px w-10 bg-current opacity-60" />
            {eyebrow}
          </p>
          <h2
            id={titleId}
            className={`fx-title mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${styles.title}`}
          >
            <span className="section-title-ink">{title}</span>
          </h2>
          {description ? (
            <p className={`mt-6 max-w-2xl text-base leading-relaxed sm:text-lg ${styles.description}`}>
              {description}
            </p>
          ) : null}
        </Reveal>

        {children}
      </div>
    </section>
  );
}
