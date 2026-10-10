# home-0007 — Profile sheet entrance and purpose card alignment

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0005`](home-0005-purposes-and-section-switching.md), [`home-0006`](home-0006-gallery-viewer-motion-profile.md) |
| **Source** | CEO (2026-10-09) |

## Goal

Make the board profile sheet feel smooth when it opens on phones, and align every
card in Our Purposes to the same height.

## Profile sheet

The previous 380ms slide used a quick ease-out and no opacity change, so the panel
could feel like it popped into place. The phone sheet now moves up over 560ms with a
stronger ease-out curve and fades in slightly as it settles. The animation remains
behind `motion-safe`, so reduced-motion preferences skip it. Dialog focus moves to
the close control and back to the opener with `preventScroll`, avoiding focus-driven
page movement.

## Purpose cards

The component measures each card's untransformed content height and applies the
largest height as a shared minimum. It remeasures when the viewport reflows and when
an accordion finishes opening or closing. Every purpose card therefore aligns to
the tallest visible card across both columns and in the one-column phone layout.

## Regression guards

`quality-0001` records both behaviours. Browser coverage checks the phone sheet's
entrance duration and verifies every purpose card has the same height after one is
expanded.
