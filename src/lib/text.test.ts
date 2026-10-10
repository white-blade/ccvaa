// @vitest-environment node
import { describe, expect, it } from "vitest";

import { initials } from "@/lib/text";

describe("initials", () => {
  it("takes the first letter of each name, upper-cased", () => {
    expect(initials("Zhong Liu")).toBe("ZL");
    expect(initials("yaqi jing")).toBe("YJ");
  });

  it("ignores extra spaces", () => {
    expect(initials("  Albert   Zang ")).toBe("AZ");
  });
});
