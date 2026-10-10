import { useEffect, useState } from "react";

/**
 * The id of whichever section crosses the middle of the viewport, for highlighting
 * the matching nav link. `null` above the first one — over the hero — and before
 * hydration.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(" ");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    // Leaving the first section upward means the hero is back on screen.
    const first = sections[0];
    const onScroll = () => {
      if (first && first.getBoundingClientRect().top > window.innerHeight / 2) {
        setActive(null);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]);

  return active;
}
