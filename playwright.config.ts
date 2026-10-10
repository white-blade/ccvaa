import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * End-to-end checks in a real browser, against the static export served the way
 * Pages serves it. Covers what jsdom cannot: layout and overflow, colour contrast,
 * touch input, scrolling. Every test runs on a desktop, a touch tablet, and a touch
 * phone, all in parallel.
 *
 * Locally this drives the installed Google Chrome, so nothing is downloaded; CI
 * installs Playwright's Chromium instead.
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
  ],
  webServer: {
    command: `node e2e/serve-static.mjs ${PORT}`,
    url: `http://localhost:${PORT}/ccvaa/`,
    reuseExistingServer: !process.env.CI,
  },
});
