"use client";

import { useEffect, useState } from "react";

import { headerContent } from "@/lib/site";

/**
 * A quiet way home from deep in the page: appears once the hero is a screen behind,
 * and glides to the top through the shared section links (`href="#top"`).
 *
 * Only from `xl` (1280px), where the page's side margin is wider than the button.
 * Narrower, a floating button sits on top of content — at 768px it covered a
 * purpose's open/close control — and phones and tablets already have the tab bar or
 * the wordmark for the top.
 */
export function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#top"
      aria-label={headerContent.backToTopLabel}
      // visibility (not just opacity) while hidden: out of the tab order, the
      // accessibility tree, and the way of taps.
      className={`fixed bottom-6 right-6 z-40 hidden h-12 w-12 items-center justify-center rounded-full xl:flex bg-ocean-900 text-cream shadow-lg shadow-ocean-950/25 ring-1 ring-white/10 transition-[opacity,transform,visibility,background-color] duration-300 hover:bg-ocean-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 pointer-coarse:active:scale-95 ${
        shown ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
