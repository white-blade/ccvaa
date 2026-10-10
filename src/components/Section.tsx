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
  { section: string; eyebrow: string; title: string; description: string; glows: [string, string] }
> = {
  light: {
    section: "bg-cream text-ocean-900",
    eyebrow: "text-coral-dark",
    title: "text-ocean-900",
    description: "text-ocean-700",
    glows: ["bg-coral/15", "bg-ocean-200/50"],
  },
  mist: {
    section: "bg-ocean-50 text-ocean-900",
    eyebrow: "text-coral-dark",
    title: "text-ocean-900",
    description: "text-ocean-700",
    glows: ["bg-coral/20", "bg-white/70"],
  },
  dark: {
    section: "bg-ocean-950 text-white",
    eyebrow: "text-coral",
    title: "text-white",
    description: "text-ocean-100",
    glows: ["bg-coral/20", "bg-ocean-600/30"],
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
      // Focusable so in-page navigation can land keyboard and screen-reader users here.
      tabIndex={-1}
      className={`relative isolate scroll-mt-20 focus:outline-none overflow-hidden py-20 sm:py-28 ${styles.section}`}
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
            className={`mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${styles.title}`}
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
