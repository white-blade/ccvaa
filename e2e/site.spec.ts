import { expect, test, type Page, type TestInfo } from "@playwright/test";

/**
 * Every project runs every test; some only make sense for some devices. Decided by
 * what the device is — touch, and how wide — not by its name, so a new device in
 * playwright.config.ts needs no changes here.
 */
const isTouch = (testInfo: TestInfo) => Boolean(testInfo.project.use.hasTouch);
const widthOf = (testInfo: TestInfo) => testInfo.project.use.viewport?.width ?? 1280;
/** Below `md` the section links move to the bottom tab bar. */
const isPhone = (testInfo: TestInfo) => widthOf(testInfo) < 768;
/** The events timeline shows from `lg`. */
const hasTimeline = (testInfo: TestInfo) => widthOf(testInfo) >= 1024;

/** Scroll the whole page once so every scroll-reveal and lazy image has fired. */
async function revealAll(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  // Let the last reveal transitions (700ms) finish before measuring colours.
  await page.waitForTimeout(900);
}

/**
 * How far a section's top sits from the header's bottom edge — 0 when it landed
 * right under the header. A section near the end of a tall screen cannot be
 * scrolled that far, so there "landed" means the page is scrolled to its end.
 */
async function landingGap(page: Page, id: string): Promise<number> {
  return page.evaluate((id) => {
    const atEnd =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const gap =
      document.getElementById(id)!.getBoundingClientRect().top -
      document.querySelector("header")!.getBoundingClientRect().bottom;
    return atEnd && gap > 0 ? 0 : gap;
  }, id);
}

/** Whichever section navigation this device shows: the header's, or the phone tab bar. */
async function sectionNav(page: Page) {
  const header = page.getByRole("navigation", { name: "Main navigation" });
  return (await header.isVisible()) ? header : page.getByRole("navigation", { name: "Sections" });
}

async function followNav(page: Page, label: string) {
  await (await sectionNav(page)).getByRole("link", { name: label }).click();
}

/**
 * A one-finger horizontal swipe. Chromium can build real Touch objects; WebKit's
 * desktop build forbids the constructor, so there the events carry plain
 * coordinate objects — all the app's handlers read.
 */
async function swipe(page: Page, selector: string, dx: number, dy = 0) {
  await page.evaluate(
    ({ selector, dx, dy }) => {
      const target = document.querySelector(selector)!;
      const box = target.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + Math.min(box.height / 2, 40);
      const point = (clientX: number, clientY: number) => {
        try {
          return new Touch({ identifier: 1, target, clientX, clientY });
        } catch {
          return { identifier: 1, target, clientX, clientY };
        }
      };
      const fire = (type: string, touches: unknown[], changed: unknown[]) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, "touches", { value: touches });
        Object.defineProperty(event, "changedTouches", { value: changed });
        target.dispatchEvent(event);
      };
      fire("touchstart", [point(x, y)], [point(x, y)]);
      fire("touchend", [], [point(x + dx, y + dy)]);
    },
    { selector, dx, dy },
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test.describe("layout", () => {
  test("never scrolls sideways", async ({ page }, testInfo) => {
    // The desktop project also sweeps the common widths in between.
    const widths = testInfo.project.name === "desktop" ? [320, 375, 768, 1024, 1440, 1920] : [null];
    for (const width of widths) {
      if (width) await page.setViewportSize({ width, height: 900 });
      await revealAll(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `sideways overflow at ${width ?? "device"} px`).toBe(0);
    }
  });

  test("dialogs cover the fixed header", async ({ page }) => {
    await page.getByRole("button", { name: /Zhong Liu/ }).click();
    await expect(page.getByRole("dialog", { name: "Zhong Liu" })).toBeVisible();
    const headerOnTop = await page.evaluate(() => {
      const header = document.querySelector("header")!.getBoundingClientRect();
      const hit = document.elementFromPoint(header.left + 40, header.top + header.height / 2);
      return Boolean(hit?.closest("header"));
    });
    expect(headerOnTop).toBe(false);
  });
});

test.describe("accessibility", () => {
  test("has no axe violations, colour contrast included", async ({ page }) => {
    await revealAll(page);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (c: Document) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
      const results = await axe.run(document);
      return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    });
    expect(violations).toEqual([]);
  });

  test("keyboard: the skip link comes first and lands on the content", async ({ page }, testInfo) => {
    test.skip(isTouch(testInfo), "keyboard path");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("main");
  });

  test("reduced motion: everything is visible at once, and the nav jumps", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const contactHeading = page.locator("#contact [data-reveal]").first();
    expect(await contactHeading.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

    await followNav(page, "Contact");
    // No glide: the very next frame is already there, just under the header.
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#contact");
    expect(Math.abs(await landingGap(page, "contact"))).toBeLessThan(3);
  });
});

test.describe("section navigation", () => {
  for (const [label, id] of [
    ["Gallery", "gallery"],
    ["Events", "events"],
    ["Contact", "contact"],
  ] as const) {
    test(`${label} glides there, lands under the header, and takes focus`, async ({ page }) => {
      await followNav(page, label);
      await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(`#${id}`);
      // Lands with the section just below the header, however tall it is here…
      await expect.poll(async () => Math.abs(await landingGap(page, id))).toBeLessThan(3);
      // …and keyboard focus moves with it.
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
      // The heading's arrival flourish plays, then clears itself.
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-arrived", "");
      await expect(page.locator(`#${id}`)).not.toHaveAttribute("data-arrived", { timeout: 3000 });
    });
  }

  test("the navigation marks the section on screen", async ({ page }) => {
    await followNav(page, "Events");
    await expect((await sectionNav(page)).getByRole("link", { name: "Events" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});

test.describe("touch", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(!isTouch(testInfo), "touch devices only");
  });

  test("controls are big enough to tap", async ({ page }) => {
    const sizes = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          "#gallery [role=group] button, #events-search, main a[href^='#'], nav[aria-label=Sections] a, nav[aria-label='Event dates'] button",
        ),
      ]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ label: el.getAttribute("aria-label") ?? el.textContent?.trim(), height: el.getBoundingClientRect().height })),
    );
    for (const { label, height } of sizes) {
      expect(height, `${label} is ${height}px tall`).toBeGreaterThanOrEqual(40);
    }
  });

  test("the search field is 16px, so phones do not zoom into it", async ({ page }) => {
    const size = await page.locator("#events-search").evaluate((el) => getComputedStyle(el).fontSize);
    expect(parseFloat(size)).toBeGreaterThanOrEqual(16);
  });

  test("gallery labels show without hover", async ({ page }) => {
    const label = page.locator("#gallery li").first().getByText(/^View\s*⤢$/);
    await label.scrollIntoViewIfNeeded();
    await expect.poll(() => label.evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("1");
  });

  test("the photo viewer opens on tap and swipes between photographs", async ({ page }) => {
    const tiles = page.getByRole("button", { name: /View this photograph larger/ });
    await tiles.first().tap();
    const dialog = page.getByRole("dialog");
    const first = await dialog.getAttribute("aria-label");

    await swipe(page, "[role=dialog]", -150);
    await expect(dialog).not.toHaveAttribute("aria-label", first!);
    await swipe(page, "[role=dialog]", 150);
    await expect(dialog).toHaveAttribute("aria-label", first!);
  });

  test("board profiles swipe between members", async ({ page }) => {
    await page.getByRole("button", { name: /Zhong Liu/ }).tap();
    await expect(page.getByRole("dialog", { name: "Zhong Liu" })).toBeVisible();
    await swipe(page, "[role=dialog]", -150);
    await expect(page.getByRole("dialog", { name: "Yaqi Jing" })).toBeVisible();
  });

  test("timeline: first tap previews, second tap opens", async ({ page }, testInfo) => {
    test.skip(!hasTimeline(testInfo), "the timeline shows from 1024px");
    const timeline = page.getByRole("navigation", { name: "Event timeline" });
    await timeline.scrollIntoViewIfNeeded();
    const dot = timeline.getByRole("button", { name: /^Artist Talk/ });

    await dot.tap();
    await expect(dot).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("dialog")).toBeHidden();

    // Once previewed, the card covers the label, so tap the dot itself.
    await dot.tap({ position: { x: 4, y: 20 } });
    await expect(page.getByRole("dialog", { name: /Artist Talk/ })).toBeVisible();
  });

  test("timeline: tapping the open preview card opens the event", async ({ page }, testInfo) => {
    test.skip(!hasTimeline(testInfo), "the timeline shows from 1024px");
    const timeline = page.getByRole("navigation", { name: "Event timeline" });
    await timeline.scrollIntoViewIfNeeded();
    const dot = timeline.getByRole("button", { name: /^Artist Talk/ });
    await dot.tap();
    await expect(dot).toHaveAttribute("aria-current", "true");

    const box = (await dot.boundingBox())!;
    await page.touchscreen.tap(box.x + 140, box.y + box.height / 2);
    await expect(page.getByRole("dialog", { name: /Artist Talk/ })).toBeVisible();
  });
});

test.describe("mouse", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(isTouch(testInfo), "mouse devices only");
  });

  test("hovering a timeline dot zooms it and rings its card; a click opens it", async ({ page }) => {
    const timeline = page.getByRole("navigation", { name: "Event timeline" });
    await page.evaluate(() => document.getElementById("events")!.scrollIntoView());
    const dot = timeline.getByRole("button", { name: /^Artist Talk/ });

    await dot.hover();
    await expect(dot).toHaveAttribute("aria-current", "true");
    await expect(page.locator("li[data-event-id=artist-talk-pacific-light] > button")).toHaveClass(/ring-coral/);

    await dot.click();
    await expect(page.getByRole("dialog", { name: /Artist Talk/ })).toBeVisible();
  });
});

test.describe("device layouts (specs/home-0003)", () => {
  test("phones: a bottom tab bar instead of header links", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), "phones only");
    await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
    await expect(page.getByRole("button", { name: /menu/i })).toHaveCount(0);

    const bar = (await page.getByRole("navigation", { name: "Sections" }).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(Math.round(bar.y + bar.height)).toBe(viewport.height);
  });

  test("phones: the end of the page is not hidden behind the tab bar", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), "phones only");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const copyright = (await page.getByText(/All rights reserved/).boundingBox())!;
    const bar = (await page.getByRole("navigation", { name: "Sections" }).boundingBox())!;
    expect(copyright.y + copyright.height).toBeLessThanOrEqual(bar.y);
  });

  test("tablets and up: header links, no tab bar", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), "md and up");
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();
  });

  test("small phones: dialogs are bottom sheets that a swipe down dismisses", async ({ page }, testInfo) => {
    test.skip(widthOf(testInfo) >= 640, "below sm only");
    await page.getByRole("button", { name: /Zhong Liu/ }).click();
    const dialog = page.getByRole("dialog", { name: "Zhong Liu" });
    await expect(dialog).toBeVisible();
    // Wait out the slide-up, then check it meets the bottom edge at full width.
    await page.waitForTimeout(500);
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(Math.round(box.y + box.height)).toBe(viewport.height);
    expect(Math.round(box.width)).toBe(viewport.width);

    await swipe(page, "[data-sheet-handle]", 0, 140);
    await expect(dialog).toBeHidden();
  });

  test("tablets and up: dialogs stay centred", async ({ page }, testInfo) => {
    test.skip(widthOf(testInfo) < 640, "sm and up");
    await page.getByRole("button", { name: /Zhong Liu/ }).click();
    await page.waitForTimeout(400);
    const box = (await page.getByRole("dialog", { name: "Zhong Liu" }).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThan(0);
    expect(box.y + box.height).toBeLessThan(viewport.height);
  });

  test("phones: the gallery drops the per-row control", async ({ page }, testInfo) => {
    test.skip(widthOf(testInfo) >= 640, "below sm only");
    await expect(page.getByRole("group", { name: "Per row" })).toBeHidden();
    await expect(page.getByText(/\d+ photographs/)).toBeVisible();
  });

  test("below lg: a date rail stands in for the timeline, and a chip glides to its card", async ({
    page,
  }, testInfo) => {
    test.skip(hasTimeline(testInfo), "below lg only");
    await expect(page.getByRole("navigation", { name: "Event timeline" })).toBeHidden();
    await page.evaluate(() => document.getElementById("events")!.scrollIntoView());
    const rail = page.getByRole("navigation", { name: "Event dates" });
    await expect(rail).toBeVisible();

    await rail.getByRole("button", { name: /^Annual General Meeting/ }).click();
    const card = page.locator("li[data-event-id=annual-general-meeting] > button");
    await expect(card).toBeFocused();
    // The card lands just below the sticky rail, not underneath it.
    const railBox = (await rail.boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.y).toBeGreaterThanOrEqual(railBox.y + railBox.height);
    expect(cardBox.y - (railBox.y + railBox.height)).toBeLessThan(30);
    // …and the rail marks it.
    await expect(rail.getByRole("button", { name: /^Annual General Meeting/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("lg and up: the side timeline, no rail", async ({ page }, testInfo) => {
    test.skip(!hasTimeline(testInfo), "lg and up");
    await expect(page.getByRole("navigation", { name: "Event dates" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Event timeline" })).toBeVisible();
  });

  // Regression: an overflow-hidden section once made both of these scroll away.
  for (const [name, label, from] of [
    ["the side timeline", "Event timeline", 1024],
    ["the date rail", "Event dates", 0],
  ] as const) {
    test(`${name} stays pinned while the listings scroll`, async ({ page }, testInfo) => {
      const width = widthOf(testInfo);
      test.skip(from === 1024 ? width < 1024 : width >= 1024, `${name} is not shown here`);
      const nav = page.getByRole("navigation", { name: label });
      const topAt = async (eventId: string) => {
        await page.evaluate((eventId) => {
          const card = document.querySelector(`li[data-event-id="${eventId}"]`)!;
          window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2);
        }, eventId);
        await page.waitForTimeout(150);
        return (await nav.boundingBox())!.y;
      };
      // Two points well into the list, where it must already have stuck.
      const early = await topAt("spring-garden-plein-air");
      const late = await topAt("valley-printmaking-retreat");
      expect(Math.abs(late - early)).toBeLessThan(2);
      expect(late).toBeGreaterThanOrEqual(0);
    });
  }
});
