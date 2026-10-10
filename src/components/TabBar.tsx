"use client";

import type { ReactNode } from "react";

import { headerContent, navigation, type SectionId } from "@/lib/site";
import { useActiveSection } from "@/lib/use-active-section";

const SECTION_IDS = navigation.map((item) => item.id);

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-6 w-6",
  "aria-hidden": true,
};

const ICONS: Record<SectionId, ReactNode> = {
  about: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
  gallery: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5-8 9" />
    </svg>
  ),
  events: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  contact: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  ),
};

/**
 * Phone navigation: the sections as tabs along the bottom edge, where a thumb
 * reaches without a stretch, always visible and marking where you are. Hidden from
 * `md` up, where the header carries the links. Taps go through the same section
 * glide as every in-page link.
 */
export function TabBar() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <nav
      aria-label={headerContent.tabBarLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ocean-100 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {navigation.map((item) => {
          const current = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "true" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition-[color,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral active:scale-95 ${
                  current ? "text-ocean-900" : "text-ocean-600"
                }`}
              >
                {/* The marker slides in above the current tab. */}
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-0.5 rounded-full bg-coral transition-all duration-300 ${
                    current ? "w-8 opacity-100" : "w-0 opacity-0"
                  }`}
                />
                <span
                  className={`transition-transform duration-300 ${current ? "-translate-y-0.5 text-coral-dark" : ""}`}
                >
                  {ICONS[item.id]}
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
