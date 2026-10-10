import { expect, test, type Page, type TestInfo } from "@playwright/test";

/** Every project runs every test; some only make sense with or without touch. */
const isTouch = (testInfo: TestInfo) => testInfo.project.name.endsWith("-touch");
const isPhone = (testInfo: TestInfo) => testInfo.project.name.startsWith("phone");

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

/** Opens the phone menu first when the desktop nav is folded away. */
async function followNav(page: Page, label: string) {
  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.getByRole("navigation", { name: "Site menu" }).getByRole("link", { name: label }).click();
  } else {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: label }).click();
  }
}

/** A one-finger horizontal swipe, dispatched as real TouchEvents. */
async function swipe(page: Page, selector: string, dx: number) {
  await page.evaluate(
    ({ selector, dx }) => {
      const target = document.querySelector(selector)!;
      const box = target.getBoundingClientRect();
      const y = box.top + box.height / 2;
      const x = box.left + box.width / 2;
      const touch = (clientX: number) =>
        new Touch({ identifier: 1, target, clientX, clientY: y });
      target.dispatchEvent(
        new TouchEvent("touchstart", { touches: [touch(x)], changedTouches: [touch(x)], bubbles: true }),
      );
      target.dispatchEvent(
        new TouchEvent("touchend", { touches: [], changedTouches: [touch(x + dx)], bubbles: true }),
      );
    },
    { selector, dx },
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
    // No glide: the very next frame is already there.
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#contact");
    const top = await page.evaluate(() => document.getElementById("contact")!.getBoundingClientRect().top);
    expect(Math.abs(top - 80)).toBeLessThan(3);
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
      // Lands with the section just below the 80px header…
      await expect
        .poll(() => page.evaluate((id) => document.getElementById(id)!.getBoundingClientRect().top, id))
        .toBeLessThan(83);
      const top = await page.evaluate((id) => document.getElementById(id)!.getBoundingClientRect().top, id);
      expect(top).toBeGreaterThan(77);
      // …and keyboard focus moves with it.
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
      // The heading's arrival flourish plays, then clears itself.
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-arrived", "");
      await expect(page.locator(`#${id}`)).not.toHaveAttribute("data-arrived", { timeout: 3000 });
    });
  }

  test("the header marks the section on screen", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), "the phone shows a menu button instead");
    await followNav(page, "Events");
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Events" }),
    ).toHaveAttribute("aria-current", "true");
  });

  test("the phone menu closes on a tap outside it", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), "phone layout only");
    await page.getByRole("button", { name: "Open menu" }).tap();
    await expect(page.getByRole("navigation", { name: "Site menu" })).toBeVisible();
    await page.touchscreen.tap(200, 700);
    await expect(page.getByRole("navigation", { name: "Site menu" })).toBeHidden();
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
          "#gallery [role=group] button, #events-search, header button, main a[href^='#']",
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
    test.skip(isPhone(testInfo), "the timeline shows from 1024px");
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
    test.skip(isPhone(testInfo), "the timeline shows from 1024px");
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
