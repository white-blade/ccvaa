import { useEffect, useState } from "react";

import { SECTION_GLIDE_EVENT, type SectionGlideDetail } from "@/lib/scroll-to-section";

/** Not scrolled at all: the visitor is looking at the hero, whatever else fits. */
function atPageTop(): boolean {
  return window.scrollY < 1;
}

function atPageEnd(): boolean {
  return (
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
  );
}

/**
 * The id of the section being read, for marking the matching nav link: whichever
 * crosses the middle of the viewport. `null` over the hero and before hydration.
 *
 * Three corrections to that rule:
 * - At the very top nothing counts. On a tall screen the hero is shorter than half
 *   the viewport, so About would otherwise be "read" — and the address changed to
 *   #about — before the visitor had scrolled at all.
 * - At the end of the page the last section counts, even when it is too short to
 *   ever reach the middle of a tall screen (Contact, on a portrait tablet).
 * - During a section glide the destination counts for the whole trip, so the nav
 *   does not flicker through every section passed on the way.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  // undefined: not gliding. null: gliding to the top.
  const [glideTarget, setGlideTarget] = useState<string | null | undefined>(undefined);
  const key = ids.join(" ");

  useEffect(() => {
    const onGlide = (event: Event) => {
      const { target, gliding } = (event as CustomEvent<SectionGlideDetail>).detail;
      setGlideTarget(gliding ? target : undefined);
    };
    window.addEventListener(SECTION_GLIDE_EVENT, onGlide);
    return () => window.removeEventListener(SECTION_GLIDE_EVENT, onGlide);
  }, []);

  useEffect(() => {
    const sectionIds = key.split(" ");
    const last = sectionIds[sectionIds.length - 1];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                setActive(atPageTop() ? null : atPageEnd() ? last : entry.target.id);
              }
            },
            { rootMargin: "-45% 0px -50% 0px" },
          );
    sections.forEach((section) => observer?.observe(section));

    const first = sections[0];
    const onScroll = () => {
      if (atPageEnd()) {
        setActive(last);
      } else if (
        atPageTop() ||
        (first && first.getBoundingClientRect().top > window.innerHeight / 2)
      ) {
        // Leaving the first section upward means the hero is back on screen.
        setActive(null);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]);

  if (glideTarget !== undefined && (glideTarget === null || ids.includes(glideTarget))) {
    return glideTarget;
  }
  return active;
}
