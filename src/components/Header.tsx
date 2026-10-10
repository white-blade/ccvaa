"use client";

import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/BrandMark";
import { headerContent, navigation } from "@/lib/site";
import { useActiveSection } from "@/lib/use-active-section";

const SECTION_IDS = navigation.map((item) => item.id);

/**
 * Fixed header for the one-page site. It floats over the hero as dark glass, turns
 * light once the hero scrolls away, marks the section on screen, and shows reading
 * progress along its lower edge. On phones the section links move to `TabBar` at the
 * bottom of the screen, within thumb reach.
 */
export function Header() {
  const [overHero, setOverHero] = useState(true);
  const active = useActiveSection(SECTION_IDS);
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

  // Publish the header's real height as --header-h (globals.css). It changes with
  // the notch inset on phones, so sticky elements and scroll offsets read it rather
  // than assuming a number.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const dark = overHero;

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
      // pt clears the notch on phones laid out edge to edge (viewport-fit=cover).
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
        dark
          ? "border-b border-white/10 bg-black/15 backdrop-blur-sm"
          : "border-b border-ocean-100/80 bg-cream/95 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-4 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]">
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

      </div>

      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-coral"
      />

    </header>
  );
}
