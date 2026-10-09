import { describe, expect, it } from "vitest";

import {
  daysBetween,
  defaultMonth,
  eventsInMonth,
  groupEventsByDay,
  monthCells,
  monthName,
  seasonMonths,
  shiftMonth,
} from "@/lib/calendar";
import { makeEvent } from "@/test/fixtures";

const exhibition = makeEvent({ id: "exhibition", startsAt: "2026-11-14", endsAt: "2026-12-06" });
const talk = makeEvent({ id: "talk", startsAt: "2027-02-11" });
const retreat = makeEvent({ id: "retreat", startsAt: "2027-06-05", endsAt: "2027-06-06" });
const season = [exhibition, talk, retreat];

describe("shiftMonth", () => {
  it("moves within a year", () => {
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2026-11", -10)).toBe("2026-01");
  });

  it("crosses year boundaries both ways", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-11", 14)).toBe("2028-01");
  });
});

describe("monthName", () => {
  it("names the month", () => {
    expect(monthName("2026-11")).toBe("November");
    expect(monthName("2027-01")).toBe("January");
  });
});

describe("daysBetween", () => {
  it("includes both ends", () => {
    expect(daysBetween("2026-11-29", "2026-12-02")).toEqual([
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
    ]);
  });

  it("is a single day for a one-day event", () => {
    expect(daysBetween("2027-02-11", "2027-02-11")).toEqual(["2027-02-11"]);
  });

  it("neither drops nor repeats a day across daylight saving changes", () => {
    // BC springs forward on 2027-03-14 and falls back on 2027-11-07.
    expect(daysBetween("2027-03-13", "2027-03-15")).toHaveLength(3);
    expect(daysBetween("2027-11-06", "2027-11-08")).toHaveLength(3);
  });

  it("is empty when the range is reversed", () => {
    expect(daysBetween("2027-02-11", "2027-02-10")).toEqual([]);
  });
});

describe("monthCells", () => {
  it("always returns six full weeks", () => {
    for (const month of ["2026-11", "2027-02", "2027-05"]) {
      expect(monthCells(month)).toHaveLength(42);
    }
  });

  it("starts each week on Sunday", () => {
    monthCells("2027-02").forEach(({ iso }, index) => {
      if (index % 7 === 0) {
        expect(new Date(`${iso}T00:00:00Z`).getUTCDay()).toBe(0);
      }
    });
  });

  it("pads with neighbouring months and flags them", () => {
    // 2027-02-01 is a Monday, so the grid opens on Sunday 31 January.
    const cells = monthCells("2027-02");
    expect(cells[0]).toEqual({ iso: "2027-01-31", inMonth: false });
    expect(cells[1]).toEqual({ iso: "2027-02-01", inMonth: true });
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(28);
  });

  it("opens on the 1st when the month starts on a Sunday", () => {
    expect(monthCells("2026-11")[0]).toEqual({ iso: "2026-11-01", inMonth: true });
  });
});

describe("groupEventsByDay", () => {
  it("covers every day of a multi-day event", () => {
    const byDay = groupEventsByDay([exhibition]);
    expect(byDay.size).toBe(23);
    expect(byDay.get("2026-11-14")).toEqual([exhibition]);
    expect(byDay.get("2026-12-06")).toEqual([exhibition]);
    expect(byDay.has("2026-12-07")).toBe(false);
  });

  it("keeps every event on a shared day", () => {
    const opening = makeEvent({ id: "opening", startsAt: "2026-11-20" });
    expect(groupEventsByDay([exhibition, opening]).get("2026-11-20")).toEqual([
      exhibition,
      opening,
    ]);
  });
});

describe("seasonMonths", () => {
  it("runs from the first start to the last end, empty months included", () => {
    expect(seasonMonths(season)).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06",
    ]);
  });

  it("extends to a multi-day event's end month", () => {
    expect(seasonMonths([exhibition])).toEqual(["2026-11", "2026-12"]);
  });

  it("is empty with no events", () => {
    expect(seasonMonths([])).toEqual([]);
  });
});

describe("eventsInMonth", () => {
  it("includes an event in every month it runs through", () => {
    expect(eventsInMonth(season, "2026-11")).toEqual([exhibition]);
    expect(eventsInMonth(season, "2026-12")).toEqual([exhibition]);
  });

  it("is empty for a month with nothing on", () => {
    expect(eventsInMonth(season, "2027-01")).toEqual([]);
  });
});

describe("defaultMonth", () => {
  const months = seasonMonths(season);

  it("opens on the first month before today is known", () => {
    expect(defaultMonth(season, months, null)).toBe("2026-11");
  });

  it("opens on the next upcoming event", () => {
    expect(defaultMonth(season, months, "2026-10-09")).toBe("2026-11");
    expect(defaultMonth(season, months, "2026-12-07")).toBe("2027-02");
  });

  it("opens on today's month while an event is running", () => {
    expect(defaultMonth(season, months, "2026-12-01")).toBe("2026-12");
  });

  it("opens on the last month once everything has passed", () => {
    expect(defaultMonth(season, months, "2027-07-01")).toBe("2027-06");
  });
});
