// @vitest-environment node
import { describe, expect, it } from "vitest";

import { dotWindow, MAX_DOTS } from "@/lib/dot-window";

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

  it("keeps the current dot in the middle, shrinking the edges that have more beyond", () => {
    expect(shown(10, 20)).toBe("7:s 8:m 9:f 10:f 11:f 12:m 13:s");
  });

  it("pins the window at either end, shrinking only the side with more", () => {
    expect(shown(0, 20)).toBe("0:f 1:f 2:f 3:f 4:f 5:m 6:s");
    expect(shown(19, 20)).toBe("13:s 14:m 15:f 16:f 17:f 18:f 19:f");
  });

  it("handles an empty gallery", () => {
    expect(dotWindow(0, 0)).toMatchObject({ start: 0, end: 0 });
  });
});
