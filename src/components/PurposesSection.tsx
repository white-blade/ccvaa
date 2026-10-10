"use client";

import { Disclosure } from "@/components/Disclosure";
import { aboutContent } from "@/lib/site";

export function PurposesSection() {
  return (
    <Disclosure
      title={aboutContent.purposesHeading}
      showLabel={aboutContent.purposesShowLabel}
      hideLabel={aboutContent.purposesHideLabel}
    >
      {(expanded) => (
        // Hairline grid: the gap shows the background through as rules between cells.
        <ol className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-ocean-200 ring-1 ring-ocean-200 md:grid-cols-2">
          {aboutContent.purposes.map((purpose, index) => (
            <li
              key={purpose.title}
              className="group bg-white p-6 transition-colors duration-300 hover:bg-cream sm:p-8"
            >
              <div className="flex items-baseline gap-4">
                <span
                  aria-hidden="true"
                  className="font-display text-4xl italic leading-none text-coral-dark transition-transform duration-300 lining-nums group-hover:-translate-y-0.5 sm:text-5xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="font-display text-lg font-semibold text-ocean-900 sm:text-xl">
                  {purpose.title}
                </h4>
              </div>
              {expanded ? (
                <p className="mt-4 text-sm leading-relaxed text-ocean-600">
                  {purpose.description}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Disclosure>
  );
}
