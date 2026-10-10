// @vitest-environment node
import { describe, expect, it } from "vitest";

import { swipeBetween } from "@/lib/swipe";

const at = (x: number, y: number) => ({ x, y });

describe("swipeBetween", () => {
  it("reads clear horizontal swipes", () => {
    expect(swipeBetween(at(300, 200), at(120, 210))).toBe("left");
    expect(swipeBetween(at(100, 200), at(280, 190))).toBe("right");
  });

  it("reads a clear downward swipe", () => {
    expect(swipeBetween(at(200, 100), at(210, 300))).toBe("down");
  });

  it("ignores short travel, diagonals, and upward drags", () => {
    expect(swipeBetween(at(200, 200), at(170, 200))).toBeNull(); // too short
    expect(swipeBetween(at(200, 100), at(330, 230))).toBeNull(); // diagonal
    expect(swipeBetween(at(200, 300), at(205, 100))).toBeNull(); // up: a scroll
  });
});
