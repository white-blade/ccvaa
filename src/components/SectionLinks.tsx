"use client";

import { useEffect } from "react";

import { scrollToSection } from "@/lib/scroll-to-section";

/**
 * Routes every same-page link (`href="#…"`) — nav, menu, hero buttons, footer —
 * through `scrollToSection`. One listener on the document, so links need no
 * wiring of their own. Renders nothing.
 */
export function SectionLinks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash || hash === "#") return;
      if (scrollToSection(hash)) event.preventDefault();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
