import { EventList } from "@/components/EventList";
import { getEvents } from "@/lib/events";
import { eventsContent } from "@/lib/site";

/** Server component: resolves listings at build time and hands them to the client list. */
export function EventsSection() {
  const events = getEvents();

  if (events.length === 0) {
    return null;
  }

  return (
    <section id="events" className="scroll-mt-24 bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl">
            {eventsContent.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ocean-700">
            {eventsContent.description}
          </p>
        </div>

        <EventList events={events} />
      </div>
    </section>
  );
}
