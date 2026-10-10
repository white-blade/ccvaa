import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * End-to-end checks in a real browser, against the static export served the way
 * Pages serves it. Covers what jsdom cannot: layout and overflow, colour contrast,
 * touch input, scrolling. Every test runs on each device below, all in parallel:
 * Chromium on a desktop, a touch tablet, and a touch phone, and WebKit — Safari's
 * engine, the one every iPhone and iPad browser uses — on an iPhone and an iPad in
 * both orientations. Between them every device class in specs/home-0003 is covered.
 *
 * Locally the Chromium projects drive the installed Google Chrome, so only WebKit is
 * downloaded (`npx playwright install webkit`); CI installs both.
 */
const chromium = process.env.CI ? {} : { channel: "chrome" as const };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/ccvaa/`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], ...chromium, viewport: { width: 1440, height: 900 } },
    },
    {
      // Landscape tablet: wide enough for the timeline, but driven by touch.
      name: "tablet-touch",
      use: {
        ...devices["Desktop Chrome"],
        ...chromium,
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
        isMobile: true,
      },
    },
    { name: "phone-touch", use: { ...devices["Pixel 7"], ...chromium } },
    { name: "iphone-webkit", use: { ...devices["iPhone 15"] } },
    // Landscape iPad: wide enough (1194px) for the events timeline.
    { name: "ipad-webkit", use: { ...devices["iPad Pro 11 landscape"] } },
    // Portrait iPad (834px): the top nav, but the date rail instead of the timeline.
    { name: "ipad-portrait-webkit", use: { ...devices["iPad Pro 11"] } },
  ],
  webServer: {
    command: `node e2e/serve-static.mjs ${PORT}`,
    url: `http://localhost:${PORT}/ccvaa/`,
    reuseExistingServer: !process.env.CI,
  },
});
