"use client";

import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/BrandMark";
import { headerContent, navigation } from "@/lib/site";
import { useActiveSection } from "@/lib/use-active-section";

const SECTION_IDS = navigation.map((item) => item.id);

/**
 * Fixed header for the one-page site. It floats over the hero as dark glass, turns
 * light once the hero scrolls away, marks the section on screen, and folds the nav
 * into a menu on phones, where four links do not fit beside the wordmark.
 */
export function Header() {
  const [overHero, setOverHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Reading progress along the header's lower edge. Written straight to the DOM,
  // once per frame, so scrolling never re-renders the header.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progressRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    // Watch the whole sticky hero stage so the glass stays dark until About.
    const stage = document.getElementById("hero-stage");
    if (!stage || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" },
    );

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    // A tap or click anywhere outside the header closes the menu.
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  // An open menu always sits on a light panel, whatever is behind the header.
  const dark = overHero && !menuOpen;

  const linkClass = (current: boolean) =>
    `block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
      dark
        ? current
          ? "bg-white/15 text-white"
          : "text-white/90 hover:bg-white/10 hover:text-white"
        : current
          ? "bg-ocean-900 text-cream"
          : "text-ocean-800 hover:bg-ocean-50 hover:text-ocean-900"
    }`;

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        dark
          ? "border-b border-white/10 bg-black/15 backdrop-blur-sm"
          : "border-b border-ocean-100/80 bg-cream/95 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <BrandMark priority onLight={!dark} />

        <nav aria-label={headerContent.navLabel} className="hidden md:block">
          <ul className="flex items-center gap-1 lg:gap-2">
            {navigation.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "true" : undefined}
                  className={linkClass(active === item.id)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? headerContent.closeMenuLabel : headerContent.openMenuLabel}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral md:hidden ${
            dark ? "text-white hover:bg-white/10" : "text-ocean-900 hover:bg-ocean-50"
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-coral"
      />

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label={headerContent.menuLabel}
          className="border-t border-ocean-100 px-6 pb-6 pt-2 md:hidden"
        >
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active === item.id ? "true" : undefined}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 font-display text-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                    active === item.id
                      ? "bg-ocean-900 text-cream"
                      : "text-ocean-900 hover:bg-ocean-50"
                  }`}
                >
                  {item.label}
                  <span aria-hidden="true" className="text-coral-dark">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
