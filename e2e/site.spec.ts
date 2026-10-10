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
  // Let the last reveal transitions (700ms) finish before measuring colours…
  await page.waitForTimeout(900);
  await entranceFinished(page);
}

/**
 * …and the first-load entrance: colours measured mid-fade would be wrong. Waits for
 * every finite, time-based animation; scroll-driven and looping ones never "finish".
 */
async function entranceFinished(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      const timing = animation.effect?.getComputedTiming();
      const timeBased = animation.timeline === document.timeline;
      return !timeBased || timing?.iterations === Infinity || animation.playState === "finished";
    }),
  );
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

  test("below lg: jumping back up to Events leaves no stale chip marked", async ({ page }, testInfo) => {
    test.skip(hasTimeline(testInfo), "below lg only");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await followNav(page, "Events");
    await expect.poll(async () => Math.abs(await landingGap(page, "events"))).toBeLessThan(3);
    const rail = page.getByRole("navigation", { name: "Event dates" });
    await expect(rail.getByRole("button", { name: /^Annual General Meeting/ })).not.toHaveAttribute(
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

test.describe("moving between sections", () => {
  test("the nav marks only the destination during a glide, never the sections passed", async ({ page }) => {
    const nav = await sectionNav(page);
    // Start recording in the same tick as the click, so only the trip is seen.
    await page.evaluate(() => {
      (window as unknown as { marked: string[] }).marked = [];
      const record = () => {
        const current = document.querySelector("nav [aria-current=true]")?.textContent?.trim();
        if (current) (window as unknown as { marked: string[] }).marked.push(current);
        requestAnimationFrame(record);
      };
      const link = [...document.querySelectorAll<HTMLAnchorElement>('nav a[href="#contact"]')].find(
        (candidate) => candidate.offsetParent !== null,
      )!;
      link.click();
      requestAnimationFrame(record);
    });
    await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute("aria-current", "true");
    await page.waitForTimeout(1300);
    const marked = await page.evaluate(() => (window as unknown as { marked: string[] }).marked);
    expect(new Set(marked)).toEqual(new Set(["Contact"]));
  });

  test("the last section is marked at the end of the page, on every screen", async ({ page }) => {
    const contact = (await sectionNav(page)).getByRole("link", { name: "Contact" });
    // Re-scroll on each attempt: images loading below can grow the page after the
    // first scroll, so "the end" moves.
    await expect(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(contact).toHaveAttribute("aria-current", "true", { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
  });

  test("Back glides to the previous section instead of snapping", async ({ page }) => {
    await followNav(page, "Gallery");
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#gallery");
    await page.waitForTimeout(1300);
    await followNav(page, "Contact");
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#contact");
    await page.waitForTimeout(1300);

    const start = await page.evaluate(() => window.scrollY);
    // Record every frame inside the page: sampling from the test, one round trip at
    // a time, can miss a whole glide on a slow machine.
    await page.evaluate(() => {
      const seen: number[] = [];
      (window as unknown as { seen: number[] }).seen = seen;
      const record = () => {
        seen.push(window.scrollY);
        if (seen.length < 600) requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    });
    await page.goBack();
    await expect.poll(async () => Math.abs(await landingGap(page, "gallery"))).toBeLessThan(3);
    const end = await page.evaluate(() => window.scrollY);
    const samples = await page.evaluate(() => (window as unknown as { seen: number[] }).seen);
    // A glide passes through positions in between; a snap would not.
    expect(samples.some((y) => y < start - 20 && y > end + 20)).toBe(true);
    expect(await page.evaluate(() => window.location.hash)).toBe("#gallery");
  });

  test("the address follows the section being read", async ({ page }) => {
    await page.evaluate(() => document.getElementById("events")!.scrollIntoView());
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#events");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("");
  });

  test("back to top never covers content: shown only from 1280px", async ({ page }, testInfo) => {
    test.skip(widthOf(testInfo) >= 1280, "below xl only");
    await page.evaluate(() => document.getElementById("events")!.scrollIntoView());
    await expect(page.getByRole("link", { name: "Back to top", exact: true })).toBeHidden();
  });

  test("back to top appears deep in the page and glides home", async ({ page }, testInfo) => {
    test.skip(widthOf(testInfo) < 1280, "xl and up");
    const button = page.getByRole("link", { name: "Back to top", exact: true });
    await expect(button).toBeHidden();
    await page.evaluate(() => document.getElementById("events")!.scrollIntoView());
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(button).toBeHidden();
  });
});

test.describe("purposes", () => {
  test("each purpose opens on its own, with its description revealed", async ({ page }) => {
    const purpose = page.getByRole("button", { name: "Education" });
    await purpose.scrollIntoViewIfNeeded();
    await purpose.click();
    await expect(purpose).toHaveAttribute("aria-expanded", "true");
    const region = page.getByRole("region", { name: "Education" });
    await expect(region).toBeVisible();
    await expect.poll(async () => (await region.boundingBox())?.height ?? 0).toBeGreaterThan(40);
    await expect(page.getByRole("button", { name: "Cultural Exchange" })).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("board profiles", () => {
  test("every portrait gets the same frame, however long the bio", async ({ page }) => {
    const sizes: string[] = [];
    for (const who of ["Zhong Liu", "Yaqi Jing", "Albert Zang"]) {
      await page.getByRole("button", { name: new RegExp(who) }).click();
      const photo = page.getByRole("dialog", { name: who }).getByRole("img", { name: new RegExp(`^${who}`) });
      await expect(photo).toBeVisible();
      await page.waitForTimeout(450); // let the sheet or dialog finish arriving
      const box = (await photo.boundingBox())!;
      sizes.push(`${Math.round(box.width)}×${Math.round(box.height)}`);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
    }
    expect(new Set(sizes).size, sizes.join(", ")).toBe(1);
  });
});

test.describe("photo viewer", () => {
  test("thumbnails show the set and jump to any photograph", async ({ page }) => {
    await page.getByRole("button", { name: /View this photograph larger/ }).first().click();
    const strip = page.getByRole("list", { name: "All photographs" });
    await expect(strip.getByRole("button")).toHaveCount(await page.locator("#gallery li").count());
    const dialog = page.getByRole("dialog");
    const first = await dialog.getAttribute("aria-label");
    await strip.getByRole("button", { name: "Show photograph 4" }).click();
    await expect(dialog).not.toHaveAttribute("aria-label", first!);
    await expect(strip.getByRole("button", { name: "Show photograph 4" })).toHaveAttribute("aria-current", "true");
  });

  test("a swipe down closes it on touch screens", async ({ page }, testInfo) => {
    test.skip(!isTouch(testInfo), "touch devices only");
    await page.getByRole("button", { name: /View this photograph larger/ }).first().tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await swipe(page, "[role=dialog]", 0, 200);
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("motion", () => {
  test("the first-load entrance ends with the hero fully in place", async ({ page }) => {
    await entranceFinished(page);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText(/Celebrating visual arts/);
    expect(await heading.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    const veil = await page.evaluate(
      () => getComputedStyle(document.querySelector("[class*=animate-intro-unveil]")!).opacity,
    );
    expect(veil).toBe("0");
  });

  test("scroll-driven section effects run where supported, never under reduced motion", async ({
    page,
  }) => {
    const supported = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
    const gallery = () => page.evaluate(() => getComputedStyle(document.getElementById("gallery")!).animationName);
    expect(await gallery()).toBe(supported ? "aperture-open" : "none");

    // Round two: motion inside the sections.
    const names = () =>
      page.evaluate(() =>
        [".fx-title", ".fx-tile", ".fx-tile-image", ".fx-cards > li", ".fx-rise", ".fx-write", ".fx-parallax"].map(
          (selector) => getComputedStyle(document.querySelector(selector)!).animationName,
        ),
      );
    for (const name of await names()) {
      if (supported) expect(name).not.toBe("none");
      else expect(name).toBe("none");
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await gallery()).toBe("none");
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector(".section-ghost")!).animationName),
    ).toBe("none");
    expect(new Set(await names())).toEqual(new Set(["none"]));
  });

  test("scroll effects never fade text: at any scroll position, all text is opaque", async ({ page }) => {
    // Sample positions through the page and check every text-bearing animated
    // element — contrast must not depend on where the scroll happens to stop.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      const faded = await page.evaluate(() =>
        [...document.querySelectorAll(".fx-title, .fx-cards > li, .fx-rise, .fx-write")]
          .filter((el) => parseFloat(getComputedStyle(el).opacity) < 1)
          .map((el) => el.textContent?.slice(0, 30)),
      );
      expect(faded, `at ${y}px`).toEqual([]);
    }
  });

  test("reduced motion: no entrance animation at all", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const running = await page.evaluate(() =>
      document.getAnimations().filter((animation) =>
        String((animation as CSSAnimation).animationName ?? "").startsWith("intro-"),
      ).length,
    );
    expect(running).toBe(0);
  });
});

test.describe("content policy", () => {
  test("the page shows no email address but the organization's", async ({ page }) => {
    const html = await page.content();
    const found = new Set(html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []);
    expect([...found]).toEqual(["info@ccvaa.ca"]);
  });
});
