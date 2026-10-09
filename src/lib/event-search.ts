import { isPictureBlock, type CcvaaEvent } from "@/lib/events";

/** Everything a visitor might reasonably type, flattened once per event. */
function searchableText(event: CcvaaEvent): string {
  return [
    event.title,
    event.summary,
    event.location,
    event.dateLabel,
    event.admission ?? "",
    ...event.details.map((detail) =>
      isPictureBlock(detail) ? (detail.caption ?? "") : detail,
    ),
  ]
    .join(" ")
    .toLowerCase();
}

/** Event id → searchable text. Built once; the query runs against it per keystroke. */
export function searchIndex(events: CcvaaEvent[]): Map<string, string> {
  return new Map(events.map((event) => [event.id, searchableText(event)]));
}

/**
 * Every term must appear somewhere, so "april richmond" narrows rather than widens.
 * A blank query matches everything.
 */
export function searchEvents(
  events: CcvaaEvent[],
  index: Map<string, string>,
  query: string,
): { terms: string[]; matches: CcvaaEvent[] } {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = terms.length
    ? events.filter((event) => {
        const haystack = index.get(event.id) ?? "";
        return terms.every((term) => haystack.includes(term));
      })
    : events;
  return { terms, matches };
}
