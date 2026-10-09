"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { navigation } from "@/lib/site";

type HeaderProps = {
  /**
   * True on routes that render the hero, where the header floats over the image
   * as dark glass until the page scrolls past it. Routes without a hero must leave
   * this false, or the dark header sits unreadably over a cream background.
   */
  overlayHero?: boolean;
};

export function Header({ overlayHero = false }: HeaderProps) {
  const [overHero, setOverHero] = useState(overlayHero);

  useEffect(() => {
    if (!overlayHero) return;

    // Watch the whole sticky hero stage so the glass stays dark until About.
    const stage = document.getElementById("hero-stage");
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" },
    );

    observer.observe(stage);
    return () => observer.disconnect();
  }, [overlayHero]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        overHero
          ? "border-b border-white/10 bg-black/15 backdrop-blur-sm"
          : "border-b border-ocean-100/80 bg-cream/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <BrandMark
          priority
          onLight={!overHero}
          subtitleClassName={
            overHero
              ? "text-ocean-200 transition-colors"
              : "text-ocean-600 transition-colors"
          }
        />

        {/* Five items no longer fit a narrow phone beside the wordmark, so the row
            scrolls rather than wraps under it or clips. */}
        <nav
          aria-label="Main navigation"
          className="-mr-2 min-w-0 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-0.5 sm:gap-2">
            {navigation.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={`block whitespace-nowrap rounded-full px-2.5 py-2 text-[0.8125rem] font-medium transition-colors sm:px-4 sm:text-sm ${
                    overHero
                      ? "text-white/90 hover:bg-white/10 hover:text-white"
                      : "text-ocean-800 hover:bg-ocean-50 hover:text-ocean-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
