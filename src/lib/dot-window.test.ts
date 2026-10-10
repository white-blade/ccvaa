// @vitest-environment node
import { describe, expect, it } from "vitest";

import { dotWindow, MAX_DOTS, MAX_DOTS_NARROW } from "@/lib/dot-window";

const shown = (index: number, count: number) => {
  const { start, end, scale } = dotWindow(index, count);
  return Array.from({ length: end - start }, (_, offset) => `${start + offset}:${scale(start + offset)[0]}`).join(" ");
};

describe("dotWindow", () => {
  it("shows every dot, all full size, for a small gallery", () => {
    expect(shown(0, 5)).toBe("0:f 1:f 2:f 3:f 4:f");
    expect(shown(4, 7)).toBe("0:f 1:f 2:f 3:f 4:f 5:f 6:f");
  });

  it(`never shows more than ${MAX_DOTS}, however large the gallery`, () => {
    for (const count of [8, 20, 200]) {
      for (const index of [0, Math.floor(count / 2), count - 1]) {
        const { start, end } = dotWindow(index, count);
        expect(end - start).toBe(MAX_DOTS);
        expect(index).toBeGreaterThanOrEqual(start);
        expect(index).toBeLessThan(end);
      }
    }
  });

  it("starts one before the current work: on the 11th, the dots run 10 to 16", () => {
    // 0-based: index 10 is the 11th work; dots 9..15 are works 10..16.
    expect(shown(10, 20)).toBe("9:s 10:f 11:f 12:f 13:f 14:m 15:s");
  });

  it("keeps the window one step behind as the visitor moves on", () => {
    for (const index of [1, 5, 12]) {
      expect(dotWindow(index, 20).start).toBe(index - 1);
    }
  });

  it("never draws the current dot smaller, even at a window edge", () => {
    for (let index = 0; index < 20; index++) {
      expect(dotWindow(index, 20).scale(index)).toBe("full");
    }
  });

  it("pins the window at either end, shrinking only the side with more", () => {
    expect(shown(0, 20)).toBe("0:f 1:f 2:f 3:f 4:f 5:m 6:s");
    expect(shown(1, 20)).toBe("0:f 1:f 2:f 3:f 4:f 5:m 6:s");
    expect(shown(19, 20)).toBe("13:s 14:m 15:f 16:f 17:f 18:f 19:f");
    expect(shown(15, 20)).toBe("13:s 14:m 15:f 16:f 17:f 18:f 19:f");
  });

  it("handles an empty gallery", () => {
    expect(dotWindow(0, 0)).toMatchObject({ start: 0, end: 0 });
  });

  it("narrows to five for small screens, by the same rule, always inside the wide window", () => {
    expect(dotWindow(10, 20, MAX_DOTS_NARROW)).toMatchObject({ start: 9, end: 14 });
    for (const count of [3, 6, 8, 19, 200]) {
      for (let index = 0; index < count; index++) {
        const wide = dotWindow(index, count);
        const narrow = dotWindow(index, count, MAX_DOTS_NARROW);
        expect(narrow.end - narrow.start).toBe(Math.min(count, MAX_DOTS_NARROW));
        expect(narrow.start).toBeGreaterThanOrEqual(wide.start);
        expect(narrow.end).toBeLessThanOrEqual(wide.end);
        expect(index).toBeGreaterThanOrEqual(narrow.start);
        expect(index).toBeLessThan(narrow.end);
      }
    }
  });
});
