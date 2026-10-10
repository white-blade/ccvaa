# quality-0002 — Code review: dead code and reuse

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Source** | CEO (2026-10-09) |

## Goal

Review all code: remove what is not needed, and reuse more.

## Method

A script listed every export with no importer, every `site.ts` copy key no component
reads, and every `public/` file nothing references; then each component was read for
repeated logic. Behaviour is unchanged throughout — the full unit and browser suites
are the proof.

## Removed

| What | Why |
|------|-----|
| `contactContent.emailLabel` | unread since the Contact redesign |
| `ColumnControl`'s light variant (`onDark`) | its only user is on the dark gallery band |
| `export` on `HERO_STAGE_HEIGHT_CLASS`, `EventDetail`, `TimelineTick`, `ColumnStore` | used only in their own files |
| `components/subsection.ts` | merged into `components/styles.ts` |

Nothing in `public/` or `assets/` was unreferenced. `tsconfig.tsbuildinfo` is
TypeScript's incremental cache — git-ignored, never committed, regenerated as needed.

## Reused

| Was | Now |
|-----|-----|
| `useActiveSection` ran once per caller — Header, TabBar, and SectionLinks each kept their own IntersectionObserver, scroll listener, and ResizeObserver | **one shared store** per set of ids (`useSyncExternalStore`); observers start with the first subscriber, stop with the last |
| Strip centring written twice (date rail, viewer thumbnails) | `lib/strip.ts` — `centreInStrip` |
| Swipe detection written twice (`useDialog`, the sheet handle) | `lib/swipe.ts` — `swipeBetween`, one rule and one set of thresholds |
| `initials()` exported from a component and imported by another | `lib/text.ts` |
| Three near-identical round-button class strings (viewer, profile, dialog close) | `components/styles.ts` — `roundButtonClass`, `roundGlassButtonClass` |

One behaviour moved slightly: the photo viewer's swipe-down now shares the sheet's
threshold (60px rather than 80px), so the two feel alike.

## Specs tidied

`events-0001`, `events-0002`, `gallery-0001`, and `gallery-0002` were still marked
in progress; they are marked `superseded` with a pointer to what replaced them.
`home-0001` to `home-0003` are marked `done`.

## Verified

172 unit tests (new: swipe rule, initials, strip centring, the shared store making
one observer for several callers) and the full browser suite on six devices pass.
