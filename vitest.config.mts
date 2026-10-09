import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Pinned before workers start, so date handling is tested in the zone that has
// bitten before: west of Greenwich, where a UTC-parsed date reads as the day before.
process.env.TZ = "America/Vancouver";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Mirrors next.config.ts, so asset paths are checked with the prefix Pages serves.
    env: { NEXT_PUBLIC_BASE_PATH: "/ccvaa" },
  },
});
