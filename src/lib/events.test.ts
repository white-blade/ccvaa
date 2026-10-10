// @vitest-environment node
import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getEvents, isPictureBlock, type EventPicture } from "@/lib/events";

/** Checks the authored listings themselves, so a bad edit fails here, not on the live site. */
const events = getEvents();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function allPictures(): EventPicture[] {
  return events.flatMap((event) => [
    ...(event.image ? [event.image] : []),
    ...event.details.filter(isPictureBlock).flatMap((block) => block.pictures),
  ]);
}

describe("getEvents", () => {
  it("returns events in chronological order", () => {
    const starts = events.map((event) => event.startsAt);
    expect(starts).toEqual([...starts].sort());
  });

  it("gives every event a unique id", () => {
    const ids = events.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses ISO dates, with any end date after the start", () => {
    for (const event of events) {
      expect(event.startsAt).toMatch(ISO_DATE);
      if (event.endsAt) {
        expect(event.endsAt).toMatch(ISO_DATE);
        expect(event.endsAt > event.startsAt).toBe(true);
      }
    }
  });

  it("runs west of Greenwich, where a UTC-parsed date reads as the day before", () => {
    // Guards the next test: without vitest.config's TZ pin it would pass vacuously.
    expect(new Date("2026-11-14").getDate()).toBe(13);
  });

  it("reads the date badge off the ISO string, not a shifted Date", () => {
    // Tests run in America/Vancouver: a UTC-parsed date would show the 13th here.
    const exhibition = events.find((event) => event.id === "coastal-light-exhibition");
    expect(exhibition?.dateBadge).toEqual({ month: "Nov", day: "14" });
  });

  it("prefixes every picture with the base path", () => {
    for (const picture of allPictures()) {
      expect(picture.src.startsWith("/ccvaa/events/")).toBe(true);
    }
  });

  it("points every picture at a file in public/events", () => {
    for (const picture of allPictures()) {
      const file = picture.src.replace("/ccvaa/", "");
      expect(existsSync(path.join(process.cwd(), "public", file)), file).toBe(true);
    }
  });

  it("describes every picture", () => {
    for (const picture of allPictures()) {
      expect(picture.alt.trim()).not.toBe("");
    }
  });
});
