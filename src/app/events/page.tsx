import type { Metadata } from "next";

import { EventsBrowser } from "@/components/EventsBrowser";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageBanner } from "@/components/PageBanner";
import { assetPath } from "@/lib/asset";
import { getEvents } from "@/lib/events";
import { eventsContent } from "@/lib/site";

export const metadata: Metadata = {
  title: eventsContent.title,
  description: eventsContent.description,
};

/**
 * A month calendar over every listing, then the listings themselves, searchable, in a
 * grid the visitor sizes. Listings resolve at build
 * time from `src/lib/events.ts`; the search and the layout control are client-side,
 * which is all a static host can offer — and all this volume needs.
 */
export default function EventsPage() {
  const events = getEvents();

  return (
    <>
      <Header />
      {/* pt clears the fixed header; the banner is not a full hero, so the header
          stays in its light state rather than overlaying it. */}
      <main className="pt-16 sm:pt-20">
        <PageBanner
          eyebrow={eventsContent.eyebrow}
          title={eventsContent.title}
          description={eventsContent.description}
          imageSrc={assetPath("/events/coastal-light-exhibition.jpg")}
        />

        <section className="bg-cream pb-16 sm:pb-20">
          {/* Pulled up so the calendar card straddles the banner's lower edge. */}
          <div className="relative mx-auto -mt-28 max-w-6xl px-6 sm:-mt-32">
            {events.length > 0 ? (
              <EventsBrowser events={events} />
            ) : (
              <p className="rounded-3xl bg-white p-10 text-sm text-ocean-500 shadow-xl ring-1 ring-ocean-100">
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
