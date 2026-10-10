import { describe, expect, it, vi } from "vitest";

import { centreInStrip } from "@/lib/strip";

describe("centreInStrip", () => {
  it("scrolls the strip itself so the item sits in its middle — never the page", () => {
    const strip = { clientWidth: 400, scrollTo: vi.fn() } as unknown as HTMLElement;
    const item = { offsetLeft: 900, offsetWidth: 100 } as unknown as HTMLElement;
    const page = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    centreInStrip(strip, item);
    expect(strip.scrollTo).toHaveBeenCalledWith({ left: 750, behavior: "smooth" });
    expect(page).not.toHaveBeenCalled();
    page.mockRestore();
  });
});
