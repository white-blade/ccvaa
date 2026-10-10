import { EventsBrowser } from "@/components/EventsBrowser";
import { Section } from "@/components/Section";
import { getEvents } from "@/lib/events";
import { eventsContent } from "@/lib/site";

/**
 * Server component: listings resolve at build time from `src/lib/events.ts`, then
 * the client browser adds search and the timeline. Renders nothing when there are
 * no listings, so the page never shows a hollow section.
 */
export function EventsSection() {
  const events = getEvents();

  if (events.length === 0) {
    return null;
  }

  return (
    <Section
      id="events"
      tone="light"
      eyebrow={eventsContent.eyebrow}
      title={eventsContent.title}
      description={eventsContent.description}
      glow
    >
      <EventsBrowser events={events} />
    </Section>
  );
}
