import Image from "next/image";
import { Fragment } from "react";

import { assetPath } from "@/lib/asset";
import { heroContent } from "@/lib/site";

/** Hero image is 2000×1313 — sticky background height (content scrolls over it). */
export const HERO_STAGE_HEIGHT_CLASS =
  "h-[max(32rem,calc(100vw*1313/2000))]";
/** Stage must be ≥ sticky height or the image bleeds into About. */
const HERO_STAGE_MIN_HEIGHT_CLASS =
  "min-h-[max(32rem,calc(100vw*1313/2000))]";
const HERO_STAGE_PULL_CLASS = "-mt-[max(32rem,calc(100vw*1313/2000))]";

const headlineWords = heroContent.headline.split(" ");

export function Hero() {
  return (
    <div id="hero-stage" className={`relative ${HERO_STAGE_MIN_HEIGHT_CLASS}`}>
      {/* Sticky background: pinned while the hero copy scrolls over it */}
      <div
        className={`sticky top-0 overflow-hidden bg-ocean-950 ${HERO_STAGE_HEIGHT_CLASS}`}
        aria-hidden="true"
      >
        {/* next/image `fill` needs a positioned parent, and sticky does not count.
            On arrival the photograph settles from a slight zoom. */}
        <div className="absolute inset-0 motion-safe:animate-intro-zoom">
          <Image
            src={assetPath("/images/hero-background.webp")}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover object-left"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-ocean-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/55 via-ocean-950/20 to-white/5" />
        {/* Fades up from dark on arrival. Transparent at rest, so without the
            animation (reduced motion) the photograph is simply there. */}
        <div className="pointer-events-none absolute inset-0 bg-ocean-950 opacity-0 motion-safe:animate-intro-unveil" />
      </div>

      <div className={`relative z-10 ${HERO_STAGE_PULL_CLASS}`}>
        <section
          id="hero"
          className={`relative flex ${HERO_STAGE_HEIGHT_CLASS} items-center text-white`}
        >
          {/* hero-exit: the copy recedes as About slides up over it (globals.css). */}
          <div className="hero-exit relative mx-auto w-full max-w-6xl px-6 pb-10 pt-20 sm:pb-12 sm:pt-24">
            {/* The entrance, in order: a coral rule draws, the eyebrow fades in,
                the headline rises word by word from behind a mask, then the rest.
                CSS only, so it starts with the first paint; every step ends at
                the resting layout, and reduced motion skips it. */}
            <p className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-ocean-100/90">
              <span
                aria-hidden="true"
                className="h-px w-10 origin-left bg-coral motion-safe:animate-intro-rule"
                style={{ animationDelay: "250ms" }}
              />
              <span className="motion-safe:animate-intro-fade" style={{ animationDelay: "350ms" }}>
                {heroContent.eyebrow}
              </span>
            </p>

            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {headlineWords.map((word, index) => (
                <Fragment key={`${word}-${index}`}>
                  <span className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-top">
                    <span
                      className="inline-block motion-safe:animate-intro-word"
                      style={{ animationDelay: `${450 + index * 80}ms` }}
                    >
                      {word}
                    </span>
                  </span>
                  {index < headlineWords.length - 1 ? " " : null}
                </Fragment>
              ))}
            </h1>

            <p
              className="mt-6 max-w-2xl text-lg leading-relaxed text-ocean-50/95 motion-safe:animate-intro-fade sm:text-xl"
              style={{ animationDelay: `${600 + headlineWords.length * 80}ms` }}
            >
              {heroContent.subheadline}
            </p>

            <div
              className="mt-10 flex flex-wrap gap-3 motion-safe:animate-intro-fade sm:gap-4"
              style={{ animationDelay: `${750 + headlineWords.length * 80}ms` }}
            >
              <a
                href={`#${heroContent.primaryCta.sectionId}`}
                className="group inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-ocean-950 shadow-lg shadow-black/20 transition-colors hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 sm:text-base"
              >
                {heroContent.primaryCta.label}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
              <a
                href={`#${heroContent.secondaryCta.sectionId}`}
                className="inline-flex items-center rounded-full border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
              >
                {heroContent.secondaryCta.label}
              </a>
            </div>
          </div>

          {/* Scroll cue: a line that draws down, pointing at what comes next. */}
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-white/70 motion-safe:animate-intro-fade sm:flex"
            style={{ animationDelay: "1500ms" }}
          >
            {heroContent.scrollLabel}
            <span className="relative h-12 w-px overflow-hidden bg-white/20">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white motion-safe:animate-scroll-cue" />
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
