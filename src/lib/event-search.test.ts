// @vitest-environment node
import { describe, expect, it } from "vitest";

import { searchEvents, searchIndex } from "@/lib/event-search";
import { makeEvent } from "@/test/fixtures";

const exhibition = makeEvent({
  id: "exhibition",
  startsAt: "2026-11-14",
  title: "Coastal Light: Members’ Exhibition",
  location: "Richmond Cultural Centre, Richmond, BC",
  details: [
    "Opening reception on Saturday.",
    { pictures: [{ src: "a.jpg", alt: "A dock" }], caption: "Work from the 2025 edition." },
  ],
});
const talk = makeEvent({
  id: "talk",
  startsAt: "2027-02-11",
  title: "Artist Talk: Photographing Pacific Light",
  location: "Online (Zoom)",
  admission: "Free for members",
});
const events = [exhibition, talk];
const index = searchIndex(events);

function ids(query: string): string[] {
  return searchEvents(events, index, query).matches.map((event) => event.id);
}

describe("searchEvents", () => {
  it("matches everything for a blank query", () => {
    expect(searchEvents(events, index, "   ")).toEqual({ terms: [], matches: events });
  });

  it("ignores case", () => {
    expect(ids("ZOOM")).toEqual(["talk"]);
  });

  it("requires every term, so more words narrow the results", () => {
    expect(ids("light")).toEqual(["exhibition", "talk"]);
    expect(ids("light richmond")).toEqual(["exhibition"]);
  });

  it("searches description paragraphs, captions, and admission", () => {
    expect(ids("reception")).toEqual(["exhibition"]);
    expect(ids("2025 edition")).toEqual(["exhibition"]);
    expect(ids("free for members")).toEqual(["talk"]);
  });

  it("does not search picture alt text", () => {
    expect(ids("dock")).toEqual([]);
  });

  it("returns the normalised terms", () => {
    expect(searchEvents(events, index, "  Light  Zoom ").terms).toEqual(["light", "zoom"]);
  });
});
