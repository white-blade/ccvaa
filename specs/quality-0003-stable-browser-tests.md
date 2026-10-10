# quality-0003 — Stable browser tests

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`quality-0001`](quality-0001-regression-checklist.md), [`home-0008`](home-0008-purposes-events-rail-founding.md) §9 |
| **Source** | CEO (2026-10-10) |

## Goal

No test should pass only on retry. CI retries a failed browser test once, and a
test that needs that retry hides real regressions and slows every run.

## What was flaky, and why

The tests that failed on a first attempt in recent CI runs:

| Test (device) | Cause | Fix |
|---|---|---|
| section navigation › … lands under the header (iPhone WebKit) | The glide landed, then the page above the section shifted (pictures, fonts). Safari has no scroll anchoring, so the visitor was left 4–12px short. | **App:** for 1s after landing, the glide holds its section in place when the page resizes; any wheel, touch, or key lets go at once. |
| below lg › … no stale chip marked (iPhone WebKit); same family, 2951px gap | WebKit on a loaded runner stopped giving the page animation frames, so the glide never moved. | **App:** a timer finishes a glide that gets no frames (duration + 400ms): it arrives without the ease. |
| accessibility › axe, colour contrast (iPhone, iPad portrait) | The hero copy dims as the page scrolls (`hero-recede`). After scrolling back to the top, WebKit can update the scroll timeline a frame late, so the hero button was measured half-faded. | **Test:** wait until the hero's opacity is unchanged across two frames at the top. |
| mouse › hovering a timeline dot … a click opens it (desktop) | Hovering opens the preview card over the middle of the dot's button; clicking the middle hit the card. | **Test:** click the dot itself, as the touch test already taps it. |
| moving between sections › Back glides…, the nav marks only the destination… | Real-time sampling on a runner painting ~1 frame/s. | Fixed in home-0008 §9: on Playwright's clock. |

Fixed real-time waits (`waitForTimeout`) used to "let the dialog finish arriving"
are replaced with waits on the condition itself: `motionSettled` (every
time-based animation in the dialog finished), the nav marking Contact at the end
of the page, and `nextFrames` after a scroll.

## Test port

The suite serves `out/` on 4173 and, outside CI, reuses a server already there.
A test site left running on 4173 for manual checks (another branch) was silently
tested instead. `E2E_PORT` now overrides the port (`E2E_PORT=4180 npm run
test:e2e`); the default is unchanged.

## Found on the way

At 320px wide the hero copy starts above the fold, so its scroll-driven recede has
begun even at the very top and the copy rests at about 93% opacity. Contrast still
passes; not changed here.

## Regression guards

- unit:scroll-to-section: a glide with no frames still arrives; after landing the
  section is held in place as the page shifts, let go on input and after 1s.
- Verified: the full suite with retries off, and the formerly flaky tests five
  times each on all six devices in parallel (320 runs, 0 failures).
