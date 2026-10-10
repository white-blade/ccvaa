// @vitest-environment node
import { describe, expect, it } from "vitest";

import { spreadPositions, timelineLayout } from "@/lib/timeline";
import { makeEvent } from "@/test/fixtures";

const exhibition = makeEvent({ id: "exhibition", startsAt: "2026-11-14", endsAt: "2026-12-06" });
const talk = makeEvent({ id: "talk", startsAt: "2027-02-11" });
const retreat = makeEvent({ id: "retreat", startsAt: "2027-06-05" });
const season = [exhibition, talk, retreat];

describe("timelineLayout", () => {
  it("runs from the first event's month to the end of the last one's", () => {
    const { ticks } = timelineLayout(season, null);
    expect(ticks.map((tick) => tick.iso)).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2027-01-01",
      "2027-02-01",
      "2027-03-01",
      "2027-04-01",
      "2027-05-01",
      "2027-06-01",
    ]);
    expect(ticks[0].position).toBe(0);
  });

  it("labels the year on the first tick and every January only", () => {
    const { ticks } = timelineLayout(season, null);
    expect(ticks.filter((tick) => tick.year).map((tick) => [tick.label, tick.year])).toEqual([
      ["Nov", "2026"],
      ["Jan", "2027"],
    ]);
  });

  it("places each dot on its start date, in proportion", () => {
    const { positions } = timelineLayout(season, null, 0);
    // 2026-11-01 → 2027-07-01 is 242 days; the talk is 102 days in.
    expect(positions.get("talk")).toBeCloseTo(102 / 242);
    expect(positions.get("exhibition")).toBeCloseTo(13 / 242);
  });

  it("keeps dots in date order, top to bottom", () => {
    const { positions } = timelineLayout(season, null);
    const order = [...positions.values()];
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const position of order) {
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(1);
    }
  });

  it("marks today when it falls on the timeline", () => {
    expect(timelineLayout(season, "2027-02-11", 0).today).toBeCloseTo(102 / 242);
  });

  it("leaves today off when it is before, after, or unknown", () => {
    expect(timelineLayout(season, "2026-10-09").today).toBeNull();
    expect(timelineLayout(season, "2027-08-01").today).toBeNull();
    expect(timelineLayout(season, null).today).toBeNull();
  });

  it("handles a single event and an empty list", () => {
    const single = timelineLayout([talk], null);
    expect(single.ticks).toHaveLength(1);
    expect(single.positions.get("talk")).toBeGreaterThan(0);
    expect(timelineLayout([], null)).toEqual({ positions: new Map(), ticks: [], today: null });
  });
});

describe("spreadPositions", () => {
  it("leaves well-spaced positions alone", () => {
    expect(spreadPositions([0.1, 0.5, 0.9], 0.05)).toEqual([0.1, 0.5, 0.9]);
  });

  it("pushes crowded dots apart by at least the gap", () => {
    const spread = spreadPositions([0.2, 0.21, 0.22], 0.05);
    expect(spread[1] - spread[0]).toBeCloseTo(0.05);
    expect(spread[2] - spread[1]).toBeCloseTo(0.05);
  });

  it("packs dots back up rather than running past the end", () => {
    const spread = spreadPositions([0.9, 0.98, 1], 0.05);
    expect(spread[2]).toBe(1);
    expect(spread[1]).toBeCloseTo(0.95);
    expect(spread[0]).toBeCloseTo(0.9);
  });
});
