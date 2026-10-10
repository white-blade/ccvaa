import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

import { MAX_DOTS, MAX_DOTS_NARROW } from "../src/lib/dot-window";
import { galleryPhotoDetails } from "../src/lib/gallery-photos";

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

/** Subscribe before the action so short animations cannot finish before the wait begins. */
async function waitForAnimationEnd(page: Page, selector: string, name: string) {
  return page.evaluate(
    ({ selector, name }) =>
      new Promise<void>((resolve) => {
        const onEnd = (event: AnimationEvent) => {
          if (event.animationName !== name || !(event.target instanceof Element) || !event.target.matches(selector)) {
            return;
          }
          document.removeEventListener("animationend", onEnd);
          resolve();
        };
        document.addEventListener("animationend", onEnd);
      }),
    { selector, name },
  );
}

/** Subscribe before the action so the assertion follows the transition's real end. */
async function waitForTransitionEnd(locator: Locator, property: string) {
  return locator.evaluate(
    (element, property) =>
      new Promise<void>((resolve) => {
        const onEnd = (event: Event) => {
          if (event.target !== element || (event as TransitionEvent).propertyName !== property) return;
          element.removeEventListener("transitionend", onEnd);
          resolve();
        };
        element.addEventListener("transitionend", onEnd);
      }),
    property,
  );
}

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
  // …and the hero's copy settle back from its scroll-driven recede: WebKit can
  // update a scroll timeline a frame or more after the jump back to the top, and
  // colours measured mid-recede are blended with the photograph behind. Settled is
  // unchanged across two frames (not "fully opaque": on a 320px screen the copy
  // starts above the fold, so it rests just short of 1 even at the top).
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const hero = document.querySelector(".hero-exit");
        if (!hero) return resolve(true);
        const before = getComputedStyle(hero).opacity;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve(window.scrollY === 0 && getComputedStyle(hero).opacity === before)),
        );
      }),
  );
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
      // The slideshow's own motion runs as long as the slideshow does: the countdown
      // line restarts with every work and the picture drifts. Neither touches text.
      const target = (animation.effect as KeyframeEffect | null)?.target;
      const slideshow = target instanceof Element && target.closest("[data-slow-zoom], [data-slide-progress]");
      return !timeBased || slideshow || timing?.iterations === Infinity || animation.playState === "finished";
    }),
  );
}

/** Waits until every time-based animation inside `selector` (a dialog's entrance) has finished. */
async function motionSettled(page: Page, selector = '[role="dialog"]') {
  await page.waitForFunction(
    (selector) =>
      [...document.querySelectorAll(selector)].every((element) =>
        element.getAnimations({ subtree: true }).every((animation) => {
          const timing = animation.effect?.getComputedTiming();
          const timeBased = animation.timeline === document.timeline;
          return !timeBased || timing?.iterations === Infinity || animation.playState === "finished";
        }),
      ),
    selector,
  );
}

/** Two painted frames: enough for layout and sticky positioning to catch up with a scroll. */
async function nextFrames(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
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

/** The gallery slide on screen, named "3 / 19". */
const currentSlide = (page: Page) => page.locator("#gallery [aria-roledescription=slide]");

/** Stop the gallery slideshow, so a test reads the slide it expects. */
async function pauseSlideshow(page: Page) {
  const pause = page.getByRole("button", { name: "Pause slideshow" });
  await pause.scrollIntoViewIfNeeded();
  await pause.click();
  await expect(page.getByRole("button", { name: "Play slideshow" })).toBeVisible();
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
          "#gallery button, #gallery a, main a[href^='#'], nav[aria-label=Sections] a, nav[aria-label='Event dates'] button",
        ),
      ]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ label: el.getAttribute("aria-label") ?? el.textContent?.trim(), height: el.getBoundingClientRect().height })),
    );
    for (const { label, height } of sizes) {
      expect(height, `${label} is ${height}px tall`).toBeGreaterThanOrEqual(40);
    }
  });

  test("gallery labels show without hover", async ({ page }) => {
    // The mark that says the photograph opens full size, and its credits.
    const mark = page.locator("#gallery").getByText("View full size");
    await mark.scrollIntoViewIfNeeded();
    await expect(mark).toBeVisible();
    expect(await mark.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await expect(page.locator("#gallery [data-credits]")).toBeVisible();
  });

  test("swiping the slideshow changes the photograph; a scroll does not", async ({ page }) => {
    await pauseSlideshow(page);
    const slide = currentSlide(page);
    await expect(slide).toHaveAccessibleName("1 / 19");
    await swipe(page, "#gallery .fx-tile", -150);
    await expect(slide).toHaveAccessibleName("2 / 19");
    await swipe(page, "#gallery .fx-tile", 150);
    await expect(slide).toHaveAccessibleName("1 / 19");
    await swipe(page, "#gallery .fx-tile", 10, 200);
    await expect(slide).toHaveAccessibleName("1 / 19");
  });

  test("the photo viewer opens on tap and swipes between photographs", async ({ page }) => {
    const tiles = page.getByRole("button", { name: /View full size/ });
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

    // Once hovered, the preview card covers the middle of the button (the label),
    // so click the dot itself, as the touch test taps it.
    await dot.click({ position: { x: 8, y: (await dot.boundingBox())!.height / 2 } });
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
    const opening = waitForAnimationEnd(page, '[role="dialog"]', "sheet-in");
    await page.getByRole("button", { name: /Zhong Liu/ }).click();
    const dialog = page.getByRole("dialog", { name: "Zhong Liu" });
    await expect(dialog).toBeVisible();
    // The bottom sheet uses a longer eased entrance so it does not pop in.
    const animationDuration = await dialog.evaluate((el) =>
      parseFloat(getComputedStyle(el).animationDuration),
    );
    expect(animationDuration).toBeGreaterThanOrEqual(0.5);
    await opening;
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
    await expect(page.getByRole("dialog", { name: "Zhong Liu" })).toBeVisible();
    await motionSettled(page);
    const box = (await page.getByRole("dialog", { name: "Zhong Liu" }).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThan(0);
    expect(box.y + box.height).toBeLessThan(viewport.height);
  });

  test("phones: the gallery is a card — the photograph, then its credits, no veil", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), "below md only");
    await pauseSlideshow(page);
    await expect(page.locator("#gallery [data-veil]")).toBeHidden();
    const photo = (await page.getByRole("button", { name: /View full size/ }).boundingBox())!;
    const credits = page.locator("#gallery [data-credits]");
    await expect(credits.getByText("Chensiyuan")).toBeVisible();
    await expect(credits.getByText("June 16, 2019")).toBeVisible();
    const box = (await credits.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(photo.y + photo.height - 1);
  });

  test("md and up: one photograph fills the stage, credits at the top right over the veil", async ({
    page,
  }, testInfo) => {
    test.skip(isPhone(testInfo), "md and up");
    await pauseSlideshow(page);
    await expect(page.locator("#gallery img")).toHaveCount(1);
    const stage = (await page.locator("#gallery .fx-tile").boundingBox())!;
    const photo = (await page.getByRole("button", { name: /View full size/ }).boundingBox())!;
    expect(Math.round(photo.width)).toBe(Math.round(stage.width));
    expect(await page.locator("#gallery img").evaluate((img) => getComputedStyle(img).objectFit)).toBe("cover");

    await expect(page.locator("#gallery [data-veil]")).toBeVisible();
    const credits = page.locator("#gallery [data-credits]");
    await expect(credits.getByText("Chensiyuan")).toBeVisible();
    await expect(credits.getByText("June 16, 2019")).toBeVisible();
    const box = (await credits.boundingBox())!;
    expect(box.x).toBeGreaterThan(stage.x + stage.width / 2);
    expect(box.y - stage.y).toBeLessThan(5);
  });

  test("every device: a dot jumps to its photograph and is the one marked", async ({ page }, testInfo) => {
    await pauseSlideshow(page);
    const dots = page.getByRole("list", { name: "Choose a work" }).getByRole("button");
    await expect(dots).toHaveCount(widthOf(testInfo) < 640 ? MAX_DOTS_NARROW : MAX_DOTS);
    await page.getByRole("button", { name: "Show work 4", exact: true }).click();
    await expect(currentSlide(page)).toHaveAccessibleName(`4 / ${galleryPhotoDetails.length}`);
    await expect(page.getByRole("button", { name: "Show work 4", exact: true })).toHaveAttribute("aria-current", "true");
    await expect(page.locator("#gallery [aria-current=true]")).toHaveCount(1);
    // The window keeps one work back: work 3 is now the first dot.
    await expect(dots.first()).toHaveAccessibleName("Show work 3");
    // Highlighted, not just announced: once the change settles, the current dot is
    // drawn wider than the rest.
    const widestIsCurrent = () =>
      dots.evaluateAll((buttons) => {
        const widths = buttons.map((button) => button.firstElementChild!.getBoundingClientRect().width);
        const widest = Math.max(...widths);
        const current = buttons.findIndex((button) => button.getAttribute("aria-current") === "true");
        return widths.filter((width) => width === widest).length === 1 && widths.indexOf(widest) === current;
      });
    await expect.poll(widestIsCurrent).toBe(true);
  });

  test("below lg: a date rail stands in for the timeline, and a chip glides to its card", async ({
    page,
  }, testInfo) => {
    test.skip(hasTimeline(testInfo), "below lg only");
    await expect(page.getByRole("navigation", { name: "Event timeline" })).toBeHidden();
    await page.evaluate(() => document.getElementById("events")!.scrollIntoView());
    const rail = page.getByRole("navigation", { name: "Event dates" });
    await expect(rail).toBeVisible();

    await rail.getByRole("button", { name: /— Annual General Meeting/ }).click();
    const card = page.locator("li[data-event-id=annual-general-meeting] > button");
    await expect(card).toBeFocused();
    // The card lands just below the sticky rail, not underneath it.
    const railBox = (await rail.boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.y).toBeGreaterThanOrEqual(railBox.y + railBox.height);
    expect(cardBox.y - (railBox.y + railBox.height)).toBeLessThan(30);
    // …and the rail marks it.
    await expect(rail.getByRole("button", { name: /— Annual General Meeting/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("below lg: each chip shows the full date and the city and country, not the title", async ({
    page,
  }, testInfo) => {
    test.skip(hasTimeline(testInfo), "below lg only");
    const rail = page.getByRole("navigation", { name: "Event dates" });
    await expect(rail.getByRole("button", { name: /CCVAA Is Founded$/ })).toHaveText(/^Jun 27, 2026\s*Victoria, Canada/i);
    await expect(rail.getByRole("button", { name: /Artist Talk: Photographing Pacific Light$/ })).toHaveText(
      /^Feb 11, 2027\s*Online/i,
    );
    const visible = await rail.evaluate((nav) =>
      [...nav.querySelectorAll("button > span:not(.sr-only)")].map((span) => span.textContent).join(" "),
    );
    expect(visible).not.toContain("Annual General Meeting");
  });

  test("below lg: jumping back up to Events leaves no stale chip marked", async ({ page }, testInfo) => {
    test.skip(hasTimeline(testInfo), "below lg only");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    // At the end of the page, the nav marks Contact: the starting point is settled.
    await expect((await sectionNav(page)).getByRole("link", { name: "Contact" })).toHaveAttribute("aria-current", "true");
    await followNav(page, "Events");
    await expect.poll(async () => Math.abs(await landingGap(page, "events"))).toBeLessThan(3);
    const rail = page.getByRole("navigation", { name: "Event dates" });
    await expect(rail.getByRole("button", { name: /— Annual General Meeting/ })).not.toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("every device: the listings have no search or filter", async ({ page }) => {
    await expect(page.locator("#events input")).toHaveCount(0);
    await expect(page.locator("#events li[data-event-id]")).toHaveCount(6);
  });

  test("lg and up: the side timeline, no rail", async ({ page }, testInfo) => {
    test.skip(!hasTimeline(testInfo), "lg and up");
    await expect(page.getByRole("navigation", { name: "Event dates" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Event timeline" })).toBeVisible();
  });

  test("lg and up: timeline months and years each line up in an even column", async ({ page }, testInfo) => {
    test.skip(!hasTimeline(testInfo), "lg and up");
    const timeline = page.getByRole("navigation", { name: "Event timeline" });
    await timeline.scrollIntoViewIfNeeded();
    const measure = (selector: string) =>
      timeline.locator(selector).evaluateAll((cells) =>
        cells.map((cell) => {
          const box = cell.getBoundingClientRect();
          const style = getComputedStyle(cell);
          return {
            text: cell.textContent ?? "",
            left: box.left,
            width: box.width,
            weight: Number(style.fontWeight),
            color: style.color,
          };
        }),
      );
    const months = await measure("[data-tick-month]");
    const years = await measure("[data-tick-year]");
    expect(months.length).toBeGreaterThan(3);
    expect(years.filter((year) => year.text).length).toBeGreaterThanOrEqual(2);

    for (const column of [months, years]) {
      for (const cell of column) {
        expect(Math.abs(cell.width - column[0].width)).toBeLessThanOrEqual(1);
        expect(Math.abs(cell.left - column[0].left)).toBeLessThanOrEqual(1);
      }
    }
    // Years sit in their own column, left of the months, set apart by weight and colour.
    expect(years[0].left + years[0].width).toBeLessThanOrEqual(months[0].left);
    expect(years[0].weight).toBeGreaterThan(months[0].weight);
    expect(years[0].color).not.toBe(months[0].color);

    // Monospace: the month text itself is the same width whatever the letters.
    const inked = await timeline.locator("[data-tick-month]").evaluateAll((cells) =>
      cells.map((cell) => {
        const range = document.createRange();
        range.selectNodeContents(cell);
        return range.getBoundingClientRect().width;
      }),
    );
    for (const width of inked) expect(Math.abs(width - inked[0])).toBeLessThanOrEqual(1);
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
        await nextFrames(page);
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
    // On the test's clock, as for Back below: every frame of the glide is recorded,
    // however slowly the machine paints.
    await page.clock.install();
    await page.goto("./");
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
    await page.clock.runFor(1500);
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
    // The page's clock runs on the test's say-so. A busy CI machine can paint one
    // frame a second, so a real-time glide (≤ 1.1s) may show only its first and
    // last frame and look exactly like a snap. Stepping time in 50ms ticks samples
    // the glide itself, however slow the machine is.
    await page.clock.install();
    await page.goto("./");
    await followNav(page, "Gallery");
    await page.clock.runFor(1500);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#gallery");
    await followNav(page, "Contact");
    await page.clock.runFor(1500);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#contact");

    const start = await page.evaluate(() => window.scrollY);
    await page.goBack();
    const samples: number[] = [];
    for (let tick = 0; tick < 30; tick++) {
      await page.clock.runFor(50);
      samples.push(await page.evaluate(() => window.scrollY));
    }
    await expect.poll(async () => Math.abs(await landingGap(page, "gallery"))).toBeLessThan(3);
    const end = await page.evaluate(() => window.scrollY);
    // A glide passes through positions in between; a snap would not.
    expect(samples.filter((y) => y < start - 20 && y > end + 20).length, samples.join(",")).toBeGreaterThan(3);
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

  test("open cards share one height, closed cards another, set by the tallest", async ({ page }) => {
    const cards = page.locator("#about ol").last().locator(":scope > li");
    const heights = () => cards.evaluateAll((items) => items.map((item) => (item as HTMLElement).offsetHeight));
    const longest = page.getByRole("button", { name: "Advancement of Visual Arts" });
    const other = page.getByRole("button", { name: "Education" });
    await longest.scrollIntoViewIfNeeded();
    await expect.poll(async () => new Set(await heights()).size).toBe(1);
    const [closed] = await heights();

    // Two purposes with descriptions of different lengths open to the same height.
    for (const name of ["Advancement of Visual Arts", "Education"]) {
      const opening = waitForTransitionEnd(page.getByRole("region", { name }), "grid-template-rows");
      await page.getByRole("button", { name }).click();
      await opening;
    }
    const open = await heights();
    const tall = open.filter((height) => height > closed);
    expect(tall).toHaveLength(2);
    expect(new Set(tall).size).toBe(1);
    // Closed cards keep their own height: an open neighbour does not stretch them.
    expect(open.filter((height) => height === closed)).toHaveLength(open.length - 2);

    // Each closes on its own, back to the closed height.
    const closing = waitForTransitionEnd(page.getByRole("region", { name: "Education" }), "grid-template-rows");
    await other.click();
    await closing;
    await expect(longest).toHaveAttribute("aria-expanded", "true");
    const after = await heights();
    expect(after.filter((height) => height > closed)).toEqual([tall[0]]);
  });
});

test.describe("event pictures", () => {
  test("a cropped picture opens whole in the viewer, over the event", async ({ page }) => {
    await page.locator("li[data-event-id=ccvaa-founded] > button").click();
    const event = page.getByRole("dialog", { name: /CCVAA Is Founded/ });
    await expect(event).toBeVisible();
    await motionSettled(page);
    await event.getByRole("button", { name: /^View the full picture: The British Columbia/ }).click();

    const viewer = page.getByRole("dialog", { name: /^The British Columbia Societies Act Certificate/ });
    await expect(viewer).toBeVisible();
    const image = viewer.getByRole("img", { name: /^The British Columbia/ });
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    // Shown whole: contained, not cropped, and inside the screen.
    expect(await image.evaluate((img) => getComputedStyle(img).objectFit)).toBe("contain");
    const box = (await image.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(event).toBeVisible();
  });
});

test.describe("board profiles", () => {
  test("every portrait gets the same frame, however long the bio", async ({ page }) => {
    const sizes: string[] = [];
    for (const who of ["Zhong Liu", "Yaqi Jing", "Albert Zang"]) {
      await page.getByRole("button", { name: new RegExp(who) }).click();
      const photo = page.getByRole("dialog", { name: who }).getByRole("img", { name: new RegExp(`^${who}`) });
      await expect(photo).toBeVisible();
      await motionSettled(page);
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
    await page.getByRole("button", { name: /View full size/ }).click();
    const strip = page.getByRole("list", { name: "All works" });
    await expect(strip.getByRole("button")).toHaveCount(galleryPhotoDetails.length);
    const dialog = page.getByRole("dialog");
    const first = await dialog.getAttribute("aria-label");
    await strip.getByRole("button", { name: "Show work 4" }).click();
    await expect(dialog).not.toHaveAttribute("aria-label", first!);
    await expect(strip.getByRole("button", { name: "Show work 4" })).toHaveAttribute("aria-current", "true");
  });

  test("a swipe down closes it on touch screens", async ({ page }, testInfo) => {
    test.skip(!isTouch(testInfo), "touch devices only");
    await page.getByRole("button", { name: /View full size/ }).tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await swipe(page, "[role=dialog]", 0, 200);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("shows the whole photograph, with its author and date above the caption", async ({ page }) => {
    await pauseSlideshow(page);
    // From the keyboard: WebKit does not focus a clicked button, so a click would
    // leave no opener to return to.
    const opener = page.getByRole("button", { name: /View full size/ });
    await opener.focus();
    await page.keyboard.press("Enter");
    const viewer = page.getByRole("dialog", { name: /^Lake Louise from high above/ });
    await expect(viewer).toBeVisible();
    const image = viewer.getByRole("img", { name: /^Lake Louise from high above/ });
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await image.evaluate((img) => getComputedStyle(img).objectFit)).toBe("contain");
    const box = (await image.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

    const credit = viewer.getByText("Chensiyuan");
    const caption = viewer.getByText(/^Lake Louise from the ridge above/);
    await expect(credit).toBeVisible();
    await expect(viewer.getByText("June 16, 2019")).toBeVisible();
    expect((await credit.boundingBox())!.y).toBeLessThan((await caption.boundingBox())!.y);

    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

test.describe("photo viewer: full view", () => {
  test("expand gives the photograph the whole screen; Escape steps back, then closes", async ({ page }) => {
    await pauseSlideshow(page);
    await page.getByRole("button", { name: /View full size/ }).click();
    const viewer = page.getByRole("dialog", { name: /^Lake Louise from high above/ });
    const image = viewer.getByRole("img", { name: /^Lake Louise from high above/ });
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const framed = (await image.boundingBox())!;

    await viewer.getByRole("button", { name: "Expand image" }).click();
    await expect(viewer).toHaveAttribute("data-expanded", "");
    await expect(viewer.getByText(/^Lake Louise from the ridge above/)).toBeHidden();
    await expect(viewer.getByRole("list", { name: "All works" })).toHaveCount(0);
    // The photograph's box now spans the whole screen, and is still contained, not cropped.
    const viewport = page.viewportSize()!;
    await expect.poll(async () => (await image.boundingBox())!.height).toBeGreaterThan(framed.height);
    // Polled: the photograph's own entrance (a slight scale) may still be settling.
    await expect.poll(async () => (await image.boundingBox())!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    await expect.poll(async () => (await image.boundingBox())!.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(await image.evaluate((img) => getComputedStyle(img).objectFit)).toBe("contain");
    // The controls stay reachable over the photograph.
    await expect(viewer.getByRole("button", { name: "Exit full view" })).toBeInViewport();
    await expect(viewer.getByRole("button", { name: "Close" })).toBeInViewport();

    await page.keyboard.press("Escape");
    await expect(viewer).not.toHaveAttribute("data-expanded", "");
    await expect(viewer.getByText(/^Lake Louise from the ridge above/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });
});

test.describe("gallery works", () => {
  test("a phone downloads a phone-sized file; every device a prepared size", async ({ page }, testInfo) => {
    await pauseSlideshow(page);
    const image = page.locator("#gallery [data-credits]").locator("..").getByRole("img").first();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const chosen = await image.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(chosen).toMatch(/\/photos\/lake-louise-panorama-(sm|md|lg)\.avif$/);
    if (isPhone(testInfo)) expect(chosen, "a phone should not fetch the 1920px file").not.toMatch(/-lg\.avif$/);
    // Uncovered once loaded: the blurred preview is gone.
    await expect(image.locator("..")).toHaveAttribute("data-picture-loaded", "");
  });

  test("the dots stay a fixed number (seven, five below 640), sliding with the works", async ({ page }, testInfo) => {
    await pauseSlideshow(page);
    const shown = widthOf(testInfo) < 640 ? MAX_DOTS_NARROW : MAX_DOTS;
    const dots = page.getByRole("list", { name: "Choose a work" }).getByRole("button");
    await expect(dots).toHaveCount(shown);
    const next = page.getByRole("button", { name: "Next work" });
    // Stepped by keyboard: a click waits each time for the button to hold still over
    // two frames, and WebKit on CI paints slowly enough that nine of those overran
    // the test's 30s. Enter on the focused button is the same press, minus that wait.
    await next.focus();
    for (let step = 0; step < 9; step++) await page.keyboard.press("Enter");
    await expect(currentSlide(page)).toHaveAccessibleName(`10 / ${galleryPhotoDetails.length}`);
    await expect(dots).toHaveCount(shown);
    await expect(page.getByRole("button", { name: "Show work 10" })).toHaveAttribute("aria-current", "true");
    // The row fits beside the arrows even on the narrowest screen.
    const row = (await page.getByRole("list", { name: "Choose a work" }).boundingBox())!;
    expect(row.x).toBeGreaterThanOrEqual(0);
    expect(row.x + row.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test("first and last jump to either end; the dots window follows", async ({ page }) => {
    await pauseSlideshow(page);
    const total = galleryPhotoDetails.length;
    await page.getByRole("button", { name: "Last work" }).click();
    await expect(currentSlide(page)).toHaveAccessibleName(`${total} / ${total}`);
    await expect(page.getByRole("button", { name: `Show work ${total}` })).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("button", { name: "Last work" })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: "First work" }).click();
    await expect(currentSlide(page)).toHaveAccessibleName(`1 / ${total}`);
    await expect(page.getByRole("button", { name: "First work" })).toHaveAttribute("aria-disabled", "true");
  });

  test("the controls fit in one row on every screen: first, previous, dots, next, last", async ({ page }) => {
    const dots = page.getByRole("list", { name: "Choose a work" });
    await dots.scrollIntoViewIfNeeded();
    const viewport = page.viewportSize()!;
    const box = async (name: string) => (await page.getByRole("button", { name, exact: true }).boundingBox())!;
    const [first, previous, next, last] = await Promise.all(
      ["First work", "Previous work", "Next work", "Last work"].map(box),
    );
    const row = (await dots.boundingBox())!;
    const middle = (b: { y: number; height: number }) => b.y + b.height / 2;
    for (const b of [first, previous, next, last]) {
      expect(Math.abs(middle(b) - middle(row)), "all on the dots' row").toBeLessThan(3);
      expect(b.height, "tap target").toBeGreaterThanOrEqual(40);
    }
    expect(first.x).toBeGreaterThanOrEqual(0);
    expect(first.x + first.width).toBeLessThanOrEqual(previous.x + 1);
    expect(previous.x + previous.width).toBeLessThanOrEqual(row.x + 1);
    expect(next.x).toBeGreaterThanOrEqual(row.x + row.width - 1);
    expect(last.x).toBeGreaterThanOrEqual(next.x + next.width - 1);
    expect(last.x + last.width).toBeLessThanOrEqual(viewport.width);
  });

  test("at 320px the controls still fit in one row", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one width sweep is enough");
    await page.setViewportSize({ width: 320, height: 700 });
    const dots = page.getByRole("list", { name: "Choose a work" });
    await dots.scrollIntoViewIfNeeded();
    await expect(dots.getByRole("button")).toHaveCount(MAX_DOTS_NARROW);
    const first = (await page.getByRole("button", { name: "First work" }).boundingBox())!;
    const last = (await page.getByRole("button", { name: "Last work" }).boundingBox())!;
    expect(first.x).toBeGreaterThanOrEqual(0);
    expect(last.x + last.width).toBeLessThanOrEqual(320);
    expect(Math.abs(first.y - last.y)).toBeLessThan(2);
  });

  test("a thin line fills as the slideshow counts down to the next work", async ({ page }) => {
    await page.clock.install();
    await page.goto("./");
    await page.getByRole("region", { name: "Gallery of works" }).scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const line = page.locator("#gallery [data-slide-progress]");
    await expect(line).toHaveCount(1);
    expect(await line.evaluate((el) => getComputedStyle(el).animationName)).toBe("slide-progress");
    await pauseSlideshow(page);
    await expect(line).toHaveCount(0);
  });

  test("the credit links the licence and the source, and can be clicked over the veil", async ({ page }) => {
    await pauseSlideshow(page);
    const credits = page.locator("#gallery [data-credits]");
    const licence = credits.getByRole("link", { name: "CC BY-SA 4.0" });
    await expect(licence).toHaveAttribute("href", "https://creativecommons.org/licenses/by-sa/4.0/");
    await expect(credits.getByRole("link", { name: /^Source/ })).toHaveAttribute(
      "href",
      /commons\.wikimedia\.org\/wiki\/File:1_lake_louise_pano_2019\.jpg$/,
    );
    // Nothing (the veil, the photograph's button) sits over the link where it is drawn.
    await licence.scrollIntoViewIfNeeded();
    const box = (await licence.boundingBox())!;
    const onTop = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest("a")?.textContent ?? null,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    expect(onTop).toBe("CC BY-SA 4.0");
  });
});

test.describe("events polish", () => {
  test("every event card ends with View details at its bottom right", async ({ page }) => {
    // Measured at rest: the cards' scroll-driven glide-in shifts alternate cards
    // mid-scroll, which is motion, not layout.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const cards = page.locator("li[data-event-id] > button");
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
    const offsets: { id: string | null; right: number; bottom: number }[] = [];
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();
      const cardBox = (await card.boundingBox())!;
      const link = (await card.locator("[data-details-link]").boundingBox())!;
      offsets.push({
        id: await card.locator("..").getAttribute("data-event-id"),
        right: cardBox.x + cardBox.width - (link.x + link.width),
        bottom: cardBox.y + cardBox.height - (link.y + link.height),
      });
    }
    // In the same place on every card — whatever its admission note — and inside
    // the card's padding of the bottom-right corner.
    for (const edge of ["right", "bottom"] as const) {
      const values = offsets.map((offset) => offset[edge]);
      expect(Math.max(...values) - Math.min(...values), `${edge}: ${JSON.stringify(offsets)}`).toBeLessThan(2);
      expect(Math.max(...values)).toBeLessThan(56);
    }
  });

  test("an event without a picture names its place in the picture's frame", async ({ page }) => {
    const frame = page.locator("li[data-event-id=artist-talk-pacific-light] [data-no-image]");
    await frame.scrollIntoViewIfNeeded();
    await expect(frame).toBeVisible();
    await expect(frame).toHaveText("Online");
  });

  test("lg and up: no month or year label is printed under the Today badge", async ({ page }, testInfo) => {
    test.skip(!hasTimeline(testInfo), "the timeline shows from 1024px");
    const timeline = page.getByRole("navigation", { name: "Event timeline" });
    await timeline.scrollIntoViewIfNeeded();
    const badge = timeline.getByText("Today", { exact: true });
    test.skip((await badge.count()) === 0, "today is off the timeline");
    const b = (await badge.boundingBox())!;
    const overlaps = await timeline.evaluate(
      (nav, b) =>
        [...nav.querySelectorAll<HTMLElement>("[data-tick-month], [data-tick-year]")]
          .filter((label) => label.textContent && getComputedStyle(label).visibility === "visible")
          .filter((label) => {
            const r = label.getBoundingClientRect();
            return r.right > b.x && r.left < b.x + b.width && r.bottom > b.y && r.top < b.y + b.height;
          })
          .map((label) => label.textContent),
      b,
    );
    expect(overlaps).toEqual([]);
  });
});

test.describe("gallery slideshow", () => {
  test("advances on its own, every six seconds", async ({ page }) => {
    await page.clock.install();
    await page.goto("./");
    const slide = currentSlide(page);
    await expect(slide).toHaveAccessibleName("1 / 19");
    await page.clock.runFor(6_100);
    await expect(slide).toHaveAccessibleName("2 / 19");
    await expect(page.getByRole("button", { name: "Show work 2" })).toHaveAttribute("aria-current", "true");
  });

  test("the pause button stops it, and play starts it again", async ({ page }) => {
    await page.clock.install();
    await page.goto("./");
    const slide = currentSlide(page);
    await pauseSlideshow(page);
    await page.mouse.move(0, 0); // and away, so hovering does not hold it instead
    await page.clock.runFor(20_000);
    await expect(slide).toHaveAccessibleName("1 / 19");
    await page.getByRole("button", { name: "Play slideshow" }).click();
    await page.mouse.move(0, 0);
    await page.locator("body").evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.clock.runFor(6_100);
    await expect(slide).toHaveAccessibleName("2 / 19");
  });

  test("holds while the mouse rests on it", async ({ page }, testInfo) => {
    test.skip(isTouch(testInfo), "mouse only");
    await page.clock.install();
    await page.goto("./");
    await page.getByRole("button", { name: /View full size/ }).hover();
    await page.clock.runFor(20_000);
    await expect(currentSlide(page)).toHaveAccessibleName("1 / 19");
  });

  test("reduced motion: never plays on its own", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await page.goto("./");
    await expect(page.getByRole("button", { name: "Play slideshow" })).toBeVisible();
    await page.clock.runFor(20_000);
    await expect(currentSlide(page)).toHaveAccessibleName("1 / 19");
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
