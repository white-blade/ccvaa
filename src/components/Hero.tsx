import Image from "next/image";

import { assetPath } from "@/lib/asset";
import { heroContent } from "@/lib/site";

/** Hero image is 2000×1313 — sticky background height (content scrolls over it). */
export const HERO_STAGE_HEIGHT_CLASS =
  "h-[max(32rem,calc(100vw*1313/2000))]";
/** Stage must be ≥ sticky height or the image bleeds into About. */
const HERO_STAGE_MIN_HEIGHT_CLASS =
  "min-h-[max(32rem,calc(100vw*1313/2000))]";
const HERO_STAGE_PULL_CLASS = "-mt-[max(32rem,calc(100vw*1313/2000))]";

export function Hero() {
  return (
    <div id="hero-stage" className={`relative ${HERO_STAGE_MIN_HEIGHT_CLASS}`}>
      {/* Sticky background: pinned while the hero copy scrolls over it */}
      <div
        className={`sticky top-0 overflow-hidden bg-ocean-950 ${HERO_STAGE_HEIGHT_CLASS}`}
        aria-hidden="true"
      >
        <Image
          src={assetPath("/images/hero-background.webp")}
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-left"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-ocean-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/55 via-ocean-950/20 to-white/5" />
      </div>

      <div className={`relative z-10 ${HERO_STAGE_PULL_CLASS}`}>
        <section
          id="hero"
          className={`flex ${HERO_STAGE_HEIGHT_CLASS} items-center text-white`}
        >
          <div className="relative mx-auto w-full max-w-6xl select-none px-6 pt-20 pb-10 sm:pt-24 sm:pb-12">
            <p className="text-sm font-medium uppercase tracking-widest text-ocean-100/90">
              {heroContent.eyebrow}
            </p>

            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {heroContent.headline}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ocean-50/95 sm:text-xl">
              {heroContent.subheadline}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
