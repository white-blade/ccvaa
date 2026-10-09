import type { Metadata } from "next";

import { EventsBrowser } from "@/components/EventsBrowser";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getEvents } from "@/lib/events";
import { eventsContent } from "@/lib/site";

export const metadata: Metadata = {
  title: eventsContent.title,
  description: eventsContent.description,
};

/**
 * Every listing, searchable, in a grid the visitor sizes. Listings resolve at build
 * time from `src/lib/events.ts`; the search and the layout control are client-side,
 * which is all a static host can offer — and all this volume needs.
 */
export default function EventsPage() {
  const events = getEvents();

  return (
    <>
      <Header />
      {/* pt clears the fixed header — this page has no hero to sit beneath it. */}
      <main className="pt-16 sm:pt-20">
        <section className="bg-cream py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl">
                {eventsContent.title}
              </h1>
              <p className="mt-6 text-base leading-relaxed text-ocean-700">
                {eventsContent.description}
              </p>
            </div>

            {events.length > 0 ? (
              <EventsBrowser events={events} />
            ) : (
              <p className="mt-10 text-sm text-ocean-500">
                {eventsContent.emptyNote}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
