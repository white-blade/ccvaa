# gallery-0005 — Dots with a little more life

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`gallery-0004`](gallery-0004-new-works-progressive-many.md) |
| **Source** | CEO (2026-10-10) |

## Goal

Make the row of dots under the gallery feel crafted, not default, without changing
what it does: the window of seven (five below 640), its edges, and its keyboard and
screen-reader behaviour all stay as `gallery-0004` left them.

## What changed

All of it lives in `GalleryDots`, split out of `GallerySlider`.

- **A glass track.** The dots sit on a translucent, rounded strip with a faint inner
  highlight, matching the round step buttons beside it. No `backdrop-blur`: the
  section behind is a flat colour, so a blur would show nothing, and with the
  countdown animating inside it WebKit re-blurred the backdrop every frame — slow
  enough on CI that the slideshow moved on before tests could pause it. The list keeps only `li`
  children; the track is a wrapper around it.
- **One gliding pill.** The current work is marked by a single coral pill instead of
  the current dot widening on its own. The pill is measured to the current dot and
  its left and right edges move separately, the leading edge first, so on a step it
  stretches toward the next dot and then settles. Under reduced motion it moves
  without the glide. Until scripts measure the row, the current dot draws itself in
  coral, so the page reads the same without JavaScript.
- **The countdown in the pill.** The thin line under the photograph is gone. While
  the slideshow runs, the pill fills from a pale coral to full as it counts down to
  the next work; on a hold or pause it is solid. Same `data-slide-progress` hook, same
  restart per work.
- **A preview on hover or focus.** A dot under the mouse, or with keyboard focus,
  lifts a small card above the row: the work's picture (the smallest prepared size),
  its number, and its author. It is decorative (`aria-hidden`; the dot's name already
  says where it goes), takes no clicks, and does not show for the current work. Touch
  has no hover, so a tap simply goes to the work; `hoverFocusHandlers` keeps a tap
  from stranding a preview.

## Regression guards

S2, S11c, and the new S11d in [`quality-0001`](quality-0001-regression-checklist.md).
