import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

// Node 25+ ships its own experimental `localStorage` global, which is undefined
// without a backing file and shadows jsdom's. Point it back at jsdom's.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (jsdomWindow && !globalThis.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: jsdomWindow.localStorage,
  });
}

afterEach(() => {
  cleanup();
});

// next/image needs Next's runtime config; a plain <img> is all a test inspects.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const imgProps = { ...props };
    for (const nextOnly of ["fill", "priority", "unoptimized"]) {
      delete imgProps[nextOnly];
    }
    return React.createElement("img", imgProps);
  },
}));
