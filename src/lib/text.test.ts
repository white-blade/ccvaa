// @vitest-environment node
import { describe, expect, it } from "vitest";

import { formatIsoDate, initials } from "@/lib/text";

describe("initials", () => {
  it("takes the first letter of each name, upper-cased", () => {
    expect(initials("Zhong Liu")).toBe("ZL");
    expect(initials("yaqi jing")).toBe("YJ");
  });

  it("ignores extra spaces", () => {
    expect(initials("  Albert   Zang ")).toBe("AZ");
  });
});

describe("formatIsoDate", () => {
  it("spells the date out without shifting it a day (tests run in America/Vancouver)", () => {
    expect(formatIsoDate("2024-10-19")).toBe("October 19, 2024");
    expect(formatIsoDate("2023-01-01")).toBe("January 1, 2023");
    expect(formatIsoDate("2022-12-31")).toBe("December 31, 2022");
  });

  it("knows leap years", () => {
    expect(formatIsoDate("2024-02-29")).toBe("February 29, 2024");
    expect(formatIsoDate("2023-02-29")).toBeNull();
  });

  it("rejects anything that is not a real YYYY-MM-DD date", () => {
    for (const bad of ["", "2024-13-01", "2024-04-31", "2024-4-1", "19 October 2024", "2024-10-19T00:00"]) {
      expect(formatIsoDate(bad), bad).toBeNull();
    }
  });
});
