"use client";

import { useEffect } from "react";

import { navigation } from "@/lib/site";
import { scrollToSection } from "@/lib/scroll-to-section";
import { useActiveSection } from "@/lib/use-active-section";

const SECTION_IDS = navigation.map((item) => item.id);

/**
 * In-page navigation, wired once for the whole document. Renders nothing.
 *
 * - Every same-page link (`href="#…"` — nav, tab bar, hero, footer, back to top)
 *   goes through `scrollToSection`, so links need no wiring of their own.
 * - Back and Forward glide between sections too, rather than snapping.
 * - The address follows the section being read (replaced, never pushed), so a
 *   shared link or a reload lands where the visitor actually was.
 */
export function SectionLinks() {
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash || hash === "#") return;
      if (scrollToSection(hash)) event.preventDefault();
    };

    // The page restores positions itself (it glides to the entry's section), so
    // the browser's own instant restore would only fight it.
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onPopState = () => {
      console.log(`GLIDE popstate y=${Math.round(window.scrollY)} hash=${window.location.hash}`);
      scrollToSection(window.location.hash, { history: "none" });
    };

    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const hash = active ? `#${active}` : "";
    if (window.location.hash === hash) return;
    // Over the hero: drop the hash — but not on a first load that is still on its
    // way to the section in the URL (it is not near the top yet).
    if (!active && window.scrollY > window.innerHeight / 2) return;
    window.history.replaceState(window.history.state, "", hash || window.location.pathname + window.location.search);
  }, [active]);

  return null;
}
