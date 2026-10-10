import axe from "axe-core";
import { expect } from "vitest";

/**
 * Runs axe over rendered markup and fails with each violation spelled out.
 * Two rules are off because they judge the whole page, not a component:
 * - `color-contrast`: jsdom computes no styles, so axe cannot measure it here. The
 *   contrast-bearing colours are chosen in globals.css.
 * - `region`: a component rendered alone has no `<main>` around it; on the page
 *   every section sits inside one.
 */
export async function expectNoAxeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n  ${violation.nodes
        .map((node) => node.target.join(" "))
        .join("\n  ")}`,
  );
  expect(violations).toEqual([]);
}
